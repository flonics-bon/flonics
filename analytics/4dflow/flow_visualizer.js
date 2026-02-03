/**
 * 4D Flow MRI Visualizer using WebGPU
 * Renders velocity vector fields in 3D space with temporal evolution
 */

export class FlowVisualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.device = null;
    this.context = null;
    this.pipeline = null;
    this.bindGroup = null;
    this.vertexBuffer = null;
    this.uniformBuffer = null;
    this.flowData = null;
    this.currentTimeStep = 0;
    this.isInitialized = false;
  }

  async initialize() {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported in this browser');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Failed to get GPU adapter');
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu');

    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: 'premultiplied'
    });

    await this.createPipeline(presentationFormat);
    this.createBuffers();
    this.isInitialized = true;
  }

  async createPipeline(format) {
    const shaderModule = this.device.createShaderModule({
      code: this.getShaderCode()
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.createBindGroupLayout()]
    });

    this.pipeline = await this.device.createRenderPipelineAsync({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: 24, // 6 floats: position (3) + velocity (3)
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' }
          ]
        }]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format }]
      },
      primitive: {
        topology: 'line-list',
        stripIndexFormat: undefined
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less'
      }
    });
  }

  createBindGroupLayout() {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: 'uniform' }
        }
      ]
    });
  }

  getShaderCode() {
    return `
      struct Uniforms {
        viewProjectionMatrix: mat4x4<f32>,
        modelMatrix: mat4x4<f32>,
        timeStep: f32,
        velocityScale: f32,
        colorScale: f32,
        padding: f32
      };

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      struct VertexInput {
        @location(0) position: vec3<f32>,
        @location(1) velocity: vec3<f32>
      };

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) velocity: vec3<f32>,
        @location(1) speed: f32
      };

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        let worldPosition = uniforms.modelMatrix * vec4<f32>(input.position, 1.0);
        output.position = uniforms.viewProjectionMatrix * worldPosition;
        output.velocity = input.velocity;
        output.speed = length(input.velocity);
        return output;
      }

      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        // Color based on velocity magnitude (speed)
        let normalizedSpeed = clamp(input.speed * uniforms.colorScale, 0.0, 1.0);
        
        // Create a color gradient from blue (slow) to red (fast)
        var color: vec3<f32>;
        if (normalizedSpeed < 0.5) {
          color = mix(vec3<f32>(0.0, 0.0, 1.0), vec3<f32>(0.0, 1.0, 0.0), normalizedSpeed * 2.0);
        } else {
          color = mix(vec3<f32>(0.0, 1.0, 0.0), vec3<f32>(1.0, 0.0, 0.0), (normalizedSpeed - 0.5) * 2.0);
        }
        
        return vec4<f32>(color, 1.0);
      }
    `;
  }

  createBuffers() {
    // Create uniform buffer
    this.uniformBuffer = this.device.createBuffer({
      size: 144, // mat4x4 (64) + mat4x4 (64) + 4 floats (16)
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    // Create bind group
    this.bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.uniformBuffer } }
      ]
    });
  }

  loadFlowData(flowData) {
    /**
     * Expected flowData format:
     * {
     *   dimensions: { x: number, y: number, z: number, t: number },
     *   voxelSize: { x: number, y: number, z: number },
     *   velocities: Float32Array[t][x][y][z][3] (vx, vy, vz)
     * }
     */
    this.flowData = flowData;
    this.currentTimeStep = 0;
    this.updateVertexBuffer();
  }

  updateVertexBuffer() {
    if (!this.flowData) return;

    const { dimensions, voxelSize, velocities } = this.flowData;
    const timeData = velocities[this.currentTimeStep];
    
    const vertices = [];
    const threshold = 0.01; // Minimum velocity magnitude to display

    // Generate line segments for each velocity vector
    for (let z = 0; z < dimensions.z; z++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let x = 0; x < dimensions.x; x++) {
          const idx = (z * dimensions.y * dimensions.x + y * dimensions.x + x) * 3;
          const vx = timeData[idx];
          const vy = timeData[idx + 1];
          const vz = timeData[idx + 2];
          
          const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
          if (speed < threshold) continue;

          // Start point
          const px = x * voxelSize.x;
          const py = y * voxelSize.y;
          const pz = z * voxelSize.z;
          vertices.push(px, py, pz, vx, vy, vz);

          // End point (arrow)
          const scale = 0.5;
          vertices.push(
            px + vx * scale,
            py + vy * scale,
            pz + vz * scale,
            vx, vy, vz
          );
        }
      }
    }

    const vertexData = new Float32Array(vertices);
    
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
    }

    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
    this.vertexCount = vertices.length / 6;
  }

  updateUniforms(viewProjectionMatrix, modelMatrix, params = {}) {
    const {
      velocityScale = 1.0,
      colorScale = 0.1
    } = params;

    const uniformData = new Float32Array(36); // 144 bytes / 4
    uniformData.set(viewProjectionMatrix, 0);
    uniformData.set(modelMatrix, 16);
    uniformData[32] = this.currentTimeStep;
    uniformData[33] = velocityScale;
    uniformData[34] = colorScale;

    this.device.queue.writeBuffer(this.uniformBuffer, 0, uniformData);
  }

  setTimeStep(timeStep) {
    if (!this.flowData) return;
    
    this.currentTimeStep = Math.max(0, Math.min(timeStep, this.flowData.dimensions.t - 1));
    this.updateVertexBuffer();
  }

  render(commandEncoder, renderPassDescriptor) {
    if (!this.isInitialized || !this.vertexBuffer || this.vertexCount === 0) {
      return;
    }

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.draw(this.vertexCount * 2, 1, 0, 0);
    passEncoder.end();
  }

  animate(deltaTime) {
    if (!this.flowData) return;
    
    // Auto-advance time steps
    const fps = 30;
    const timePerFrame = 1000 / fps;
    
    this.currentTimeStep = (this.currentTimeStep + 1) % this.flowData.dimensions.t;
    this.updateVertexBuffer();
  }

  destroy() {
    if (this.vertexBuffer) this.vertexBuffer.destroy();
    if (this.uniformBuffer) this.uniformBuffer.destroy();
    if (this.device) this.device.destroy();
  }
}

// Utility function to create sample 4D flow data
export function createSampleFlowData(dimensions = { x: 20, y: 20, z: 20, t: 30 }) {
  const voxelSize = { x: 1.0, y: 1.0, z: 1.0 };
  const velocities = [];

  for (let t = 0; t < dimensions.t; t++) {
    const timeData = new Float32Array(dimensions.x * dimensions.y * dimensions.z * 3);
    
    for (let z = 0; z < dimensions.z; z++) {
      for (let y = 0; y < dimensions.y; y++) {
        for (let x = 0; x < dimensions.x; x++) {
          const idx = (z * dimensions.y * dimensions.x + y * dimensions.x + x) * 3;
          
          // Create a spiral flow pattern that evolves over time
          const cx = dimensions.x / 2;
          const cy = dimensions.y / 2;
          const cz = dimensions.z / 2;
          
          const dx = x - cx;
          const dy = y - cy;
          const dz = z - cz;
          
          const r = Math.sqrt(dx * dx + dy * dy);
          const theta = Math.atan2(dy, dx) + t * 0.1;
          
          timeData[idx] = -Math.sin(theta) * r * 0.1;
          timeData[idx + 1] = Math.cos(theta) * r * 0.1;
          timeData[idx + 2] = Math.sin(dz * 0.3 + t * 0.2) * 0.5;
        }
      }
    }
    
    velocities.push(timeData);
  }

  return { dimensions, voxelSize, velocities };
}