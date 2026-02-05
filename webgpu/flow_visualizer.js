/**
 * 4D Flow MRI WebGPU Velocity Vector Visualizer
 * Real-time visualization of blood flow velocity vectors using WebGPU
 */

class FlowVisualizer {
    constructor(canvas) {
        this.canvas = canvas;
        this.device = null;
        this.context = null;
        this.pipeline = null;
        this.velocityBuffer = null;
        this.uniformBuffer = null;
        this.bindGroup = null;
    }

    async initialize() {
        if (!navigator.gpu) {
            throw new Error('WebGPU not supported on this browser');
        }

        const adapter = await navigator.gpu.requestAdapter();
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');

        const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({
            device: this.device,
            format: presentationFormat,
            alphaMode: 'premultiplied',
        });

        await this.createPipeline(presentationFormat);
    }

    async createPipeline(format) {
        // Shader code for velocity vector visualization
        const shaderCode = `
            struct Uniforms {
                viewMatrix: mat4x4<f32>,
                projectionMatrix: mat4x4<f32>,
                time: f32,
                scale: f32,
            };

            struct VelocityData {
                position: vec3<f32>,
                velocity: vec3<f32>,
            };

            @group(0) @binding(0) var<uniform> uniforms: Uniforms;
            @group(0) @binding(1) var<storage, read> velocities: array<VelocityData>;

            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) color: vec4<f32>,
            };

            @vertex
            fn vertexMain(@builtin(vertex_index) vertexIndex: u32,
                         @builtin(instance_index) instanceIndex: u32) -> VertexOutput {
                var output: VertexOutput;
                
                let velocityData = velocities[instanceIndex];
                let pos = velocityData.position;
                let vel = velocityData.velocity;
                
                // Calculate velocity magnitude for coloring
                let magnitude = length(vel);
                
                // Create arrow geometry (line from position to position+velocity)
                var vertexPos: vec3<f32>;
                if (vertexIndex == 0u) {
                    vertexPos = pos;
                } else {
                    vertexPos = pos + vel * uniforms.scale;
                }
                
                // Transform to clip space
                let worldPos = vec4<f32>(vertexPos, 1.0);
                output.position = uniforms.projectionMatrix * uniforms.viewMatrix * worldPos;
                
                // Color based on velocity magnitude (blue=slow, red=fast)
                let normalizedMag = clamp(magnitude / 100.0, 0.0, 1.0);
                output.color = vec4<f32>(normalizedMag, 0.0, 1.0 - normalizedMag, 1.0);
                
                return output;
            }

            @fragment
            fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
                return input.color;
            }
        `;

        const shaderModule = this.device.createShaderModule({
            code: shaderCode,
        });

        // Create uniform buffer
        this.uniformBuffer = this.device.createBuffer({
            size: 144, // mat4x4 + mat4x4 + float + float + padding
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Create bind group layout
        const bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'uniform' },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: { type: 'read-only-storage' },
                },
            ],
        });

        const pipelineLayout = this.device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout],
        });

        this.pipeline = this.device.createRenderPipeline({
            layout: pipelineLayout,
            vertex: {
                module: shaderModule,
                entryPoint: 'vertexMain',
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fragmentMain',
                targets: [{ format }],
            },
            primitive: {
                topology: 'line-list',
            },
        });

        this.bindGroupLayout = bindGroupLayout;
    }

    loadVelocityData(velocityData) {
        // velocityData: array of {position: [x,y,z], velocity: [vx,vy,vz]}
        const dataArray = new Float32Array(velocityData.length * 6);
        
        velocityData.forEach((data, i) => {
            const offset = i * 6;
            dataArray[offset + 0] = data.position[0];
            dataArray[offset + 1] = data.position[1];
            dataArray[offset + 2] = data.position[2];
            dataArray[offset + 3] = data.velocity[0];
            dataArray[offset + 4] = data.velocity[1];
            dataArray[offset + 5] = data.velocity[2];
        });

        if (this.velocityBuffer) {
            this.velocityBuffer.destroy();
        }

        this.velocityBuffer = this.device.createBuffer({
            size: dataArray.byteLength,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
        });

        this.device.queue.writeBuffer(this.velocityBuffer, 0, dataArray);

        // Create bind group
        this.bindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                { binding: 0, resource: { buffer: this.uniformBuffer } },
                { binding: 1, resource: { buffer: this.velocityBuffer } },
            ],
        });

        this.instanceCount = velocityData.length;
    }

    updateUniforms(viewMatrix, projectionMatrix, time, scale) {
        const uniformData = new Float32Array(36); // Total size / 4
        
        // View matrix (16 floats)
        uniformData.set(viewMatrix, 0);
        
        // Projection matrix (16 floats)
        uniformData.set(projectionMatrix, 16);
        
        // Time (1 float)
        uniformData[32] = time;
        
        // Scale (1 float)
        uniformData[33] = scale;

        this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
    }

    render() {
        if (!this.bindGroup || !this.pipeline) {
            return;
        }

        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();

        const renderPassDescriptor = {
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(this.pipeline);
        passEncoder.setBindGroup(0, this.bindGroup);
        passEncoder.draw(2, this.instanceCount); // 2 vertices per line
        passEncoder.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }

    destroy() {
        if (this.velocityBuffer) this.velocityBuffer.destroy();
        if (this.uniformBuffer) this.uniformBuffer.destroy();
    }
}

// Helper function to create identity matrix
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
}

// Helper function to create perspective projection matrix
function createPerspectiveMatrix(fov, aspect, near, far) {
    const f = 1.0 / Math.tan(fov / 2);
    const rangeInv = 1 / (near - far);

    return new Float32Array([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) * rangeInv, -1,
        0, 0, near * far * rangeInv * 2, 0,
    ]);
}

export { FlowVisualizer, createIdentityMatrix, createPerspectiveMatrix };
