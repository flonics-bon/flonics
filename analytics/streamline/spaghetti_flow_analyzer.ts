/**
 * Spaghetti Flow Analyzer for 4D Flow MRI
 * Generates dense streamline visualization resembling spaghetti patterns
 * Uses WebGPU for high-performance particle tracing and rendering
 */

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface FlowField {
  data: Float32Array;
  dimensions: { width: number; height: number; depth: number; time: number };
  spacing: Vector3;
}

interface SpaghettiConfig {
  seedDensity: number;
  maxSteps: number;
  stepSize: number;
  minVelocity: number;
  colorMode: 'velocity' | 'direction' | 'time';
  tubeRadius: number;
}

export class SpaghettiFlowAnalyzer {
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private computePipeline: GPUComputePipeline | null = null;
  private flowField: FlowField | null = null;
  private streamlines: Float32Array[] = [];

  constructor(private canvas: HTMLCanvasElement) {}

  async initialize(): Promise<void> {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported');
    }

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
      throw new Error('Failed to get GPU adapter');
    }

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext('webgpu');

    if (!this.context) {
      throw new Error('Failed to get WebGPU context');
    }

    const format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format,
      alphaMode: 'opaque',
    });

    await this.createPipelines();
  }

  private async createPipelines(): Promise<void> {
    if (!this.device) return;

    // Compute shader for particle tracing
    const computeShader = `
      struct FlowData {
        velocity: vec3<f32>,
        pressure: f32,
      }

      struct Particle {
        position: vec3<f32>,
        velocity: vec3<f32>,
        age: f32,
        active: f32,
      }

      @group(0) @binding(0) var<storage, read> flowField: array<FlowData>;
      @group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
      @group(0) @binding(2) var<uniform> params: vec4<f32>; // stepSize, minVel, dimX, dimY

      fn getFlowVelocity(pos: vec3<f32>) -> vec3<f32> {
        let dimX = i32(params.z);
        let dimY = i32(params.w);
        
        let ix = i32(floor(pos.x));
        let iy = i32(floor(pos.y));
        let iz = i32(floor(pos.z));
        
        let idx = iz * dimX * dimY + iy * dimX + ix;
        
        if (idx >= 0 && idx < arrayLength(&flowField)) {
          return flowField[idx].velocity;
        }
        return vec3<f32>(0.0, 0.0, 0.0);
      }

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let idx = global_id.x;
        if (idx >= arrayLength(&particles)) {
          return;
        }

        var particle = particles[idx];
        
        if (particle.active < 0.5) {
          return;
        }

        let velocity = getFlowVelocity(particle.position);
        let speed = length(velocity);

        if (speed < params.y) {
          particle.active = 0.0;
        } else {
          // RK4 integration
          let k1 = velocity;
          let k2 = getFlowVelocity(particle.position + k1 * params.x * 0.5);
          let k3 = getFlowVelocity(particle.position + k2 * params.x * 0.5);
          let k4 = getFlowVelocity(particle.position + k3 * params.x);
          
          let newPos = particle.position + (k1 + 2.0 * k2 + 2.0 * k3 + k4) * params.x / 6.0;
          
          particle.position = newPos;
          particle.velocity = velocity;
          particle.age += 1.0;
        }

        particles[idx] = particle;
      }
    `;

    // Render shader for tube visualization
    const renderShader = `
      struct VertexInput {
        @location(0) position: vec3<f32>,
        @location(1) velocity: vec3<f32>,
        @location(2) normal: vec3<f32>,
      }

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec4<f32>,
        @location(1) normal: vec3<f32>,
      }

      @group(0) @binding(0) var<uniform> mvp: mat4x4<f32>;
      @group(0) @binding(1) var<uniform> colorMode: vec4<f32>;

      @vertex
      fn vs_main(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.position = mvp * vec4<f32>(input.position, 1.0);
        output.normal = input.normal;
        
        let speed = length(input.velocity);
        let normalizedSpeed = clamp(speed / 100.0, 0.0, 1.0);
        
        // Color based on velocity magnitude
        output.color = vec4<f32>(
          normalizedSpeed,
          0.5,
          1.0 - normalizedSpeed,
          1.0
        );
        
        return output;
      }

      @fragment
      fn fs_main(input: VertexOutput) -> @location(0) vec4<f32> {
        let lightDir = normalize(vec3<f32>(1.0, 1.0, 1.0));
        let diffuse = max(dot(input.normal, lightDir), 0.2);
        return vec4<f32>(input.color.rgb * diffuse, input.color.a);
      }
    `;

    const computeModule = this.device.createShaderModule({ code: computeShader });
    const renderModule = this.device.createShaderModule({ code: renderShader });

    this.computePipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: computeModule,
        entryPoint: 'main',
      },
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: renderModule,
        entryPoint: 'vs_main',
        buffers: [
          {
            arrayStride: 36,
            attributes: [
              { shaderLocation: 0, offset: 0, format: 'float32x3' },
              { shaderLocation: 1, offset: 12, format: 'float32x3' },
              { shaderLocation: 2, offset: 24, format: 'float32x3' },
            ],
          },
        ],
      },
      fragment: {
        module: renderModule,
        entryPoint: 'fs_main',
        targets: [{ format: navigator.gpu.getPreferredCanvasFormat() }],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
    });
  }

  setFlowField(flowField: FlowField): void {
    this.flowField = flowField;
  }

  generateStreamlines(config: SpaghettiConfig): void {
    if (!this.flowField) {
      throw new Error('Flow field not set');
    }

    this.streamlines = [];
    const { dimensions } = this.flowField;
    const seedPoints = this.generateSeedPoints(dimensions, config.seedDensity);

    for (const seed of seedPoints) {
      const streamline = this.traceStreamline(seed, config);
      if (streamline.length > 10) {
        this.streamlines.push(streamline);
      }
    }
  }

  private generateSeedPoints(dimensions: any, density: number): Vector3[] {
    const seeds: Vector3[] = [];
    const step = Math.floor(1 / density);

    for (let z = 0; z < dimensions.depth; z += step) {
      for (let y = 0; y < dimensions.height; y += step) {
        for (let x = 0; x < dimensions.width; x += step) {
          seeds.push({ x, y, z });
        }
      }
    }

    return seeds;
  }

  private traceStreamline(seed: Vector3, config: SpaghettiConfig): Float32Array {
    const points: number[] = [];
    let current = { ...seed };

    for (let step = 0; step < config.maxSteps; step++) {
      const velocity = this.getVelocityAt(current);
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);

      if (speed < config.minVelocity) break;

      points.push(current.x, current.y, current.z);
      points.push(velocity.x, velocity.y, velocity.z);

      // RK4 integration
      const k1 = velocity;
      const k2 = this.getVelocityAt({
        x: current.x + k1.x * config.stepSize * 0.5,
        y: current.y + k1.y * config.stepSize * 0.5,
        z: current.z + k1.z * config.stepSize * 0.5,
      });
      const k3 = this.getVelocityAt({
        x: current.x + k2.x * config.stepSize * 0.5,
        y: current.y + k2.y * config.stepSize * 0.5,
        z: current.z + k2.z * config.stepSize * 0.5,
      });
      const k4 = this.getVelocityAt({
        x: current.x + k3.x * config.stepSize,
        y: current.y + k3.y * config.stepSize,
        z: current.z + k3.z * config.stepSize,
      });

      current.x += (k1.x + 2 * k2.x + 2 * k3.x + k4.x) * config.stepSize / 6;
      current.y += (k1.y + 2 * k2.y + 2 * k3.y + k4.y) * config.stepSize / 6;
      current.z += (k1.z + 2 * k2.z + 2 * k3.z + k4.z) * config.stepSize / 6;

      if (!this.isInBounds(current)) break;
    }

    return new Float32Array(points);
  }

  private getVelocityAt(pos: Vector3): Vector3 {
    if (!this.flowField) return { x: 0, y: 0, z: 0 };

    const { dimensions } = this.flowField;
    const ix = Math.floor(pos.x);
    const iy = Math.floor(pos.y);
    const iz = Math.floor(pos.z);

    if (ix < 0 || ix >= dimensions.width || iy < 0 || iy >= dimensions.height || iz < 0 || iz >= dimensions.depth) {
      return { x: 0, y: 0, z: 0 };
    }

    const idx = (iz * dimensions.height * dimensions.width + iy * dimensions.width + ix) * 3;

    return {
      x: this.flowField.data[idx],
      y: this.flowField.data[idx + 1],
      z: this.flowField.data[idx + 2],
    };
  }

  private isInBounds(pos: Vector3): boolean {
    if (!this.flowField) return false;
    const { dimensions } = this.flowField;
    return pos.x >= 0 && pos.x < dimensions.width &&
           pos.y >= 0 && pos.y < dimensions.height &&
           pos.z >= 0 && pos.z < dimensions.depth;
  }

  getStreamlineCount(): number {
    return this.streamlines.length;
  }

  getStreamlineData(): Float32Array[] {
    return this.streamlines;
  }

  exportAnalytics(): any {
    return {
      streamlineCount: this.streamlines.length,
      totalPoints: this.streamlines.reduce((sum, s) => sum + s.length / 6, 0),
      averageLength: this.streamlines.reduce((sum, s) => sum + s.length / 6, 0) / this.streamlines.length,
      timestamp: new Date().toISOString(),
    };
  }

  destroy(): void {
    this.device?.destroy();
    this.streamlines = [];
  }
}