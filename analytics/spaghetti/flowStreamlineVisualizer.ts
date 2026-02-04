/**
 * 4D Flow MRI Spaghetti Streamline Visualizer
 * High-performance streamline rendering using WebGPU
 */

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface FlowData {
  velocity: Vector3;
  position: Vector3;
  magnitude: number;
  timestamp: number;
}

interface StreamlineConfig {
  stepSize: number;
  maxSteps: number;
  seedPoints: Vector3[];
  colormap: 'velocity' | 'pressure' | 'vorticity';
  lineWidth: number;
}

class FlowStreamlineVisualizer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private streamlines: Float32Array[] = [];
  private vertexBuffer: GPUBuffer | null = null;
  private colorBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;

  constructor(private canvas: HTMLCanvasElement) {}

  async initialize(): Promise<void> {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('No GPU adapter found');
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu');

    if (!this.context) {
      throw new Error('Failed to get WebGPU context');
    }

    const format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: format,
      alphaMode: 'premultiplied',
    });

    await this.createPipeline(format);
  }

  private async createPipeline(format: GPUTextureFormat): Promise<void> {
    if (!this.device) return;

    const shaderCode = `
      struct Uniforms {
        modelViewProjection: mat4x4<f32>,
        time: f32,
        lineWidth: f32,
      }

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      struct VertexInput {
        @location(0) position: vec3<f32>,
        @location(1) velocity: vec3<f32>,
        @location(2) magnitude: f32,
      }

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec4<f32>,
        @location(1) velocity: vec3<f32>,
      }

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
        
        // Velocity-based color mapping (spaghetti coloring)
        let normalizedMag = clamp(input.magnitude / 150.0, 0.0, 1.0);
        output.color = vec4<f32>(
          normalizedMag,
          0.5 + 0.5 * sin(uniforms.time + normalizedMag * 3.14159),
          1.0 - normalizedMag,
          0.8
        );
        output.velocity = input.velocity;
        
        return output;
      }

      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        // Smooth spaghetti-like appearance
        let velMag = length(input.velocity);
        let glow = 0.1 + 0.9 * smoothstep(0.0, 1.0, velMag / 100.0);
        return vec4<f32>(input.color.rgb * glow, input.color.a);
      }
    `;

    const shaderModule = this.device.createShaderModule({
      code: shaderCode,
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        this.device.createBindGroupLayout({
          entries: [
            {
              binding: 0,
              visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
              buffer: { type: 'uniform' },
            },
          ],
        }),
      ],
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 28, // 3 (pos) + 3 (vel) + 1 (mag) * 4 bytes
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },
              { shaderLocation: 1, offset: 12, format: 'float32x3' },
              { shaderLocation: 2, offset: 24, format: 'float32' },
            ],
          },
        ],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: format, blend: {
          color: {
            srcFactor: 'src-alpha',
            dstFactor: 'one-minus-src-alpha',
          },
          alpha: {
            srcFactor: 'one',
            dstFactor: 'one-minus-src-alpha',
          },
        }}],
      },
      primitive: {
        topology: 'line-strip',
        stripIndexFormat: 'uint32',
      },
      depthStencil: {
        format: 'depth24plus',
        depthWriteEnabled: true,
        depthCompare: 'less',
      },
    });
  }

  /**
   * Generate streamlines from 4D Flow MRI data
   */
  generateStreamlines(
    velocityField: Float32Array,
    dimensions: Vector3,
    config: StreamlineConfig
  ): void {
    this.streamlines = [];

    for (const seedPoint of config.seedPoints) {
      const streamline = this.integrateStreamline(
        seedPoint,
        velocityField,
        dimensions,
        config
      );
      if (streamline.length > 0) {
        this.streamlines.push(streamline);
      }
    }

    this.createBuffers();
  }

  /**
   * Runge-Kutta 4th order integration for smooth streamlines
   */
  private integrateStreamline(
    seed: Vector3,
    velocityField: Float32Array,
    dimensions: Vector3,
    config: StreamlineConfig
  ): Float32Array {
    const points: number[] = [];
    let position = { ...seed };

    for (let step = 0; step < config.maxSteps; step++) {
      const velocity = this.interpolateVelocity(position, velocityField, dimensions);
      
      if (!velocity || this.isOutOfBounds(position, dimensions)) {
        break;
      }

      const magnitude = Math.sqrt(
        velocity.x * velocity.x +
        velocity.y * velocity.y +
        velocity.z * velocity.z
      );

      if (magnitude < 0.01) break;

      // Store position, velocity, and magnitude
      points.push(
        position.x, position.y, position.z,
        velocity.x, velocity.y, velocity.z,
        magnitude
      );

      // RK4 integration
      const k1 = velocity;
      const k2 = this.interpolateVelocity(
        this.addVectors(position, this.scaleVector(k1, config.stepSize * 0.5)),
        velocityField,
        dimensions
      );
      const k3 = this.interpolateVelocity(
        this.addVectors(position, this.scaleVector(k2!, config.stepSize * 0.5)),
        velocityField,
        dimensions
      );
      const k4 = this.interpolateVelocity(
        this.addVectors(position, this.scaleVector(k3!, config.stepSize)),
        velocityField,
        dimensions
      );

      if (!k2 || !k3 || !k4) break;

      // Update position
      const weighted = this.scaleVector(
        this.addVectors(
          this.addVectors(k1, this.scaleVector(k2, 2)),
          this.addVectors(this.scaleVector(k3, 2), k4)
        ),
        config.stepSize / 6.0
      );

      position = this.addVectors(position, weighted);
    }

    return new Float32Array(points);
  }

  private interpolateVelocity(
    position: Vector3,
    velocityField: Float32Array,
    dimensions: Vector3
  ): Vector3 | null {
    const x = Math.floor(position.x);
    const y = Math.floor(position.y);
    const z = Math.floor(position.z);

    if (
      x < 0 || x >= dimensions.x - 1 ||
      y < 0 || y >= dimensions.y - 1 ||
      z < 0 || z >= dimensions.z - 1
    ) {
      return null;
    }

    // Trilinear interpolation
    const fx = position.x - x;
    const fy = position.y - y;
    const fz = position.z - z;

    const idx = (z * dimensions.y * dimensions.x + y * dimensions.x + x) * 3;

    const vx =
      this.lerp3D(velocityField, idx, fx, fy, fz, dimensions.x, dimensions.y, 0);
    const vy =
      this.lerp3D(velocityField, idx, fx, fy, fz, dimensions.x, dimensions.y, 1);
    const vz =
      this.lerp3D(velocityField, idx, fx, fy, fz, dimensions.x, dimensions.y, 2);

    return { x: vx, y: vy, z: vz };
  }

  private lerp3D(
    data: Float32Array,
    baseIdx: number,
    fx: number,
    fy: number,
    fz: number,
    strideX: number,
    strideY: number,
    component: number
  ): number {
    const stride = strideX * strideY * 3;
    const rowStride = strideX * 3;

    const c000 = data[baseIdx + component];
    const c100 = data[baseIdx + component + 3];
    const c010 = data[baseIdx + component + rowStride];
    const c110 = data[baseIdx + component + rowStride + 3];
    const c001 = data[baseIdx + component + stride];
    const c101 = data[baseIdx + component + stride + 3];
    const c011 = data[baseIdx + component + stride + rowStride];
    const c111 = data[baseIdx + component + stride + rowStride + 3];

    const c00 = c000 * (1 - fx) + c100 * fx;
    const c01 = c001 * (1 - fx) + c101 * fx;
    const c10 = c010 * (1 - fx) + c110 * fx;
    const c11 = c011 * (1 - fx) + c111 * fx;

    const c0 = c00 * (1 - fy) + c10 * fy;
    const c1 = c01 * (1 - fy) + c11 * fy;

    return c0 * (1 - fz) + c1 * fz;
  }

  private isOutOfBounds(position: Vector3, dimensions: Vector3): boolean {
    return (
      position.x < 0 || position.x >= dimensions.x ||
      position.y < 0 || position.y >= dimensions.y ||
      position.z < 0 || position.z >= dimensions.z
    );
  }

  private addVectors(a: Vector3, b: Vector3): Vector3 {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  private scaleVector(v: Vector3, scale: number): Vector3 {
    return { x: v.x * scale, y: v.y * scale, z: v.z * scale };
  }

  private createBuffers(): void {
    if (!this.device || this.streamlines.length === 0) return;

    // Concatenate all streamlines
    const totalSize = this.streamlines.reduce((sum, s) => sum + s.length, 0);
    const vertexData = new Float32Array(totalSize);
    let offset = 0;

    for (const streamline of this.streamlines) {
      vertexData.set(streamline, offset);
      offset += streamline.length;
    }

    this.vertexBuffer = this.device.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });

    this.device.queue.writeBuffer(this.vertexBuffer, 0, vertexData);
  }

  render(viewProjectionMatrix: Float32Array, time: number): void {
    if (!this.device || !this.context || !this.pipeline || !this.vertexBuffer) {
      return;
    }

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);

    const totalVertices = this.streamlines.reduce((sum, s) => sum + s.length / 7, 0);
    passEncoder.draw(totalVertices, 1, 0, 0);
    passEncoder.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  destroy(): void {
    this.vertexBuffer?.destroy();
    this.colorBuffer?.destroy();
    this.uniformBuffer?.destroy();
  }
}

export { FlowStreamlineVisualizer, StreamlineConfig, FlowData, Vector3 };