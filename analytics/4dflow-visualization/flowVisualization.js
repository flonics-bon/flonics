// 4D Flow MRI Visualization using WebGPU
class FlowVisualization {
    constructor(canvas) {
        this.canvas = canvas;
        this.device = null;
        this.context = null;
        this.pipeline = null;
        this.particleBuffer = null;
        this.uniformBuffer = null;
        
        // Simulation parameters
        this.params = {
            particleCount: 5000,
            timePhase: 0,
            velocityThreshold: 0.5,
            flowSpeed: 1.0,
            isPlaying: false
        };
        
        this.lastTime = performance.now();
        this.frameCount = 0;
        this.fps = 0;
    }
    
    async init() {
        // Check WebGPU support
        if (!navigator.gpu) {
            document.getElementById('webgpuStatus').textContent = 'Not Supported';
            alert('WebGPU is not supported in your browser. Please use Chrome Canary or Edge Canary with WebGPU enabled.');
            return false;
        }
        
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            document.getElementById('webgpuStatus').textContent = 'No Adapter';
            return false;
        }
        
        this.device = await adapter.requestDevice();
        document.getElementById('webgpuStatus').textContent = 'Active';
        
        this.context = this.canvas.getContext('webgpu');
        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        
        this.context.configure({
            device: this.device,
            format: presentationFormat,
            alphaMode: 'premultiplied',
        });
        
        await this.createBuffers();
        await this.createPipeline(presentationFormat);
        
        return true;
    }
    
    async createBuffers() {
        // Create particle data
        const particleData = new Float32Array(this.params.particleCount * 8);
        
        for (let i = 0; i < this.params.particleCount; i++) {
            const offset = i * 8;
            
            // Position (x, y, z)
            particleData[offset + 0] = (Math.random() - 0.5) * 2;
            particleData[offset + 1] = (Math.random() - 0.5) * 2;
            particleData[offset + 2] = (Math.random() - 0.5) * 2;
            
            // Velocity (vx, vy, vz)
            particleData[offset + 3] = (Math.random() - 0.5) * 0.1;
            particleData[offset + 4] = (Math.random() - 0.5) * 0.1;
            particleData[offset + 5] = (Math.random() - 0.5) * 0.1;
            
            // Speed magnitude and lifetime
            particleData[offset + 6] = Math.random();
            particleData[offset + 7] = Math.random() * 100;
        }
        
        this.particleBuffer = this.device.createBuffer({
            size: particleData.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        
        new Float32Array(this.particleBuffer.getMappedRange()).set(particleData);
        this.particleBuffer.unmap();
        
        // Create uniform buffer
        const uniformData = new Float32Array([
            0.0, // time
            this.params.velocityThreshold,
            this.params.flowSpeed,
            this.params.timePhase,
        ]);
        
        this.uniformBuffer = this.device.createBuffer({
            size: uniformData.byteLength,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            mappedAtCreation: true,
        });
        
        new Float32Array(this.uniformBuffer.getMappedRange()).set(uniformData);
        this.uniformBuffer.unmap();
    }
    
    async createPipeline(format) {
        const shaderModule = this.device.createShaderModule({
            code: `
                struct Particle {
                    position: vec3<f32>,
                    velocity: vec3<f32>,
                    speed: f32,
                    lifetime: f32,
                }
                
                struct Uniforms {
                    time: f32,
                    velocityThreshold: f32,
                    flowSpeed: f32,
                    timePhase: f32,
                }
                
                @group(0) @binding(0) var<uniform> uniforms: Uniforms;
                @group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
                
                struct VertexOutput {
                    @builtin(position) position: vec4<f32>,
                    @location(0) color: vec4<f32>,
                }
                
                @vertex
                fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                    let particle = particles[vertexIndex];
                    var output: VertexOutput;
                    
                    // Apply perspective projection
                    let z = particle.position.z + 3.0;
                    let scale = 1.0 / z;
                    
                    output.position = vec4<f32>(
                        particle.position.x * scale,
                        particle.position.y * scale,
                        particle.position.z * 0.5 + 0.5,
                        1.0
                    );
                    
                    // Color based on velocity magnitude
                    let speed = length(particle.velocity);
                    let normalizedSpeed = clamp(speed / uniforms.velocityThreshold, 0.0, 1.0);
                    
                    // Heat map coloring: blue -> cyan -> green -> yellow -> red
                    let r = clamp(normalizedSpeed * 2.0, 0.0, 1.0);
                    let g = clamp(sin(normalizedSpeed * 3.14159), 0.0, 1.0);
                    let b = clamp(1.0 - normalizedSpeed, 0.0, 1.0);
                    
                    output.color = vec4<f32>(r, g, b, 0.8);
                    
                    return output;
                }
                
                @fragment
                fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
                    return input.color;
                }
                
                @compute @workgroup_size(64)
                fn computeMain(@builtin(global_invocation_id) globalId: vec3<u32>) {
                    let index = globalId.x;
                    if (index >= arrayLength(&particles)) {
                        return;
                    }
                    
                    var particle = particles[index];
                    
                    // Simulate 4D flow field based on time phase
                    let phase = uniforms.timePhase / 20.0 * 6.28318;
                    let t = uniforms.time * uniforms.flowSpeed * 0.01;
                    
                    // Complex flow field simulation (simplified cardiac flow)
                    let x = particle.position.x;
                    let y = particle.position.y;
                    let z = particle.position.z;
                    
                    // Helical flow pattern
                    let radius = sqrt(x * x + y * y);
                    let theta = atan2(y, x);
                    
                    particle.velocity.x = -sin(theta + phase) * cos(z + t) * 0.05;
                    particle.velocity.y = cos(theta + phase) * cos(z + t) * 0.05;
                    particle.velocity.z = sin(t + phase) * 0.03;
                    
                    // Add pulsatile component
                    let pulseFactor = sin(phase) * 0.5 + 0.5;
                    particle.velocity = particle.velocity * pulseFactor;
                    
                    // Update position
                    particle.position = particle.position + particle.velocity;
                    
                    // Boundary conditions - reset if out of bounds
                    if (length(particle.position) > 2.0) {
                        particle.position = vec3<f32>(
                            (fract(sin(f32(index) * 12.9898) * 43758.5453) - 0.5) * 0.5,
                            (fract(sin(f32(index) * 78.233) * 43758.5453) - 0.5) * 0.5,
                            (fract(sin(f32(index) * 45.164) * 43758.5453) - 0.5) * 0.5
                        );
                    }
                    
                    particle.speed = length(particle.velocity);
                    particle.lifetime = particle.lifetime + 1.0;
                    
                    particles[index] = particle;
                }
            `
        });
        
        // Create compute pipeline
        this.computePipeline = this.device.createComputePipeline({
            layout: 'auto',
            compute: {
                module: shaderModule,
                entryPoint: 'computeMain',
            },
        });
        
        // Create render pipeline
        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'vertexMain',
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fragmentMain',
                targets: [{
                    format: format,
                    blend: {
                        color: {
                            srcFactor: 'src-alpha',
                            dstFactor: 'one-minus-src-alpha',
                        },
                        alpha: {
                            srcFactor: 'one',
                            dstFactor: 'one-minus-src-alpha',
                        },
                    },
                }],
            },
            primitive: {
                topology: 'point-list',
            },
        });
        
        // Create bind group
        this.bindGroup = this.device.createBindGroup({
            layout: this.computePipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.particleBuffer } },
            ],
        });
    }
    
    updateUniforms() {
        const uniformData = new Float32Array([
            performance.now() / 1000,
            this.params.velocityThreshold,
            this.params.flowSpeed,
            this.params.timePhase,
        ]);
        
        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }
    
    render() {
        this.updateUniforms();
        
        const commandEncoder = this.device.createCommandEncoder();
        
        // Compute pass
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(this.computePipeline);
        computePass.setBindGroup(0, this.bindGroup);
        computePass.dispatchWorkgroups(Math.ceil(this.params.particleCount / 64));
        computePass.end();
        
        // Render pass
        const textureView = this.context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.1, g: 0.1, b: 0.18, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        });
        
        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.draw(this.params.particleCount);
        renderPass.end();
        
        this.device.queue.submit([commandEncoder.finish()]);
        
        // Update FPS
        this.frameCount++;
        const currentTime = performance.now();
        if (currentTime - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            document.getElementById('fps').textContent = this.fps;
        }
    }
    
    updateParticleCount(newCount) {
        this.params.particleCount = newCount;
        this.createBuffers();
        document.getElementById('particleCount').textContent = newCount;
    }
}

// Initialize application
let visualization;

async function init() {
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    visualization = new FlowVisualization(canvas);
    const success = await visualization.init();
    
    if (success) {
        setupControls();
        animate();
    }
}

function setupControls() {
    document.getElementById('timeSlider').addEventListener('input', (e) => {
        visualization.params.timePhase = parseFloat(e.target.value);
        document.getElementById('timeValue').textContent = e.target.value;
    });
    
    document.getElementById('velocitySlider').addEventListener('input', (e) => {
        visualization.params.velocityThreshold = parseFloat(e.target.value);
        document.getElementById('velocityValue').textContent = e.target.value;
    });
    
    document.getElementById('densitySlider').addEventListener('input', (e) => {
        const newCount = parseInt(e.target.value);
        visualization.updateParticleCount(newCount);
        document.getElementById('densityValue').textContent = newCount;
    });
    
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        visualization.params.flowSpeed = parseFloat(e.target.value);
        document.getElementById('speedValue').textContent = e.target.value;
    });
    
    document.getElementById('playBtn').addEventListener('click', () => {
        visualization.params.isPlaying = !visualization.params.isPlaying;
        document.getElementById('playBtn').textContent = 
            visualization.params.isPlaying ? 'Pause' : 'Play';
    });
    
    document.getElementById('resetBtn').addEventListener('click', async () => {
        await visualization.createBuffers();
    });
    
    document.getElementById('particleCount').textContent = visualization.params.particleCount;
}

function animate() {
    if (visualization.params.isPlaying) {
        visualization.params.timePhase = (visualization.params.timePhase + 0.1) % 20;
        document.getElementById('timeSlider').value = visualization.params.timePhase;
        document.getElementById('timeValue').textContent = visualization.params.timePhase.toFixed(1);
    }
    
    visualization.render();
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    const canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

init();