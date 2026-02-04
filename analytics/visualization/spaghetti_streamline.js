/**
 * Spaghetti Streamline Visualization Module
 * 4D Flow MRI 데이터의 streamline을 WebGPU로 렌더링
 * Author: AI Assistant
 */

export class SpaghettiStreamlineRenderer {
  constructor(device, canvas) {
    this.device = device;
    this.canvas = canvas;
    this.context = canvas.getContext('webgpu');
    this.streamlines = [];
    this.initialized = false;
  }

  /**
   * 초기화: WebGPU 파이프라인 및 버퍼 설정
   */
  async initialize() {
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format: presentationFormat,
      alphaMode: 'premultiplied'
    });

    // Streamline 렌더링용 셰이더
    const shaderModule = this.device.createShaderModule({
      code: this.getShaderCode()
    });

    // 파이프라인 레이아웃
    this.pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.createBindGroupLayout()]
    });

    // 렌더 파이프라인
    this.pipeline = this.device.createRenderPipeline({
      layout: this.pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [{
          arrayStride: 24, // vec3 position + vec3 velocity
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x3' },
            { shaderLocation: 1, offset: 12, format: 'float32x3' }
          ]
        }]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format: presentationFormat }]
      },
      primitive: {
        topology: 'line-strip',
        stripIndexFormat: 'uint32'
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    });

    this.initialized = true;
  }

  /**
   * Bind Group Layout 생성
   */
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

  /**
   * WGSL 셰이더 코드
   */
  getShaderCode() {
    return `
      struct Uniforms {
        viewProjectionMatrix: mat4x4<f32>,
        timeStep: f32,
        colorScale: f32,
      };

      @group(0) @binding(0) var<uniform> uniforms: Uniforms;

      struct VertexInput {
        @location(0) position: vec3<f32>,
        @location(1) velocity: vec3<f32>,
      };

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec4<f32>,
      };

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.position = uniforms.viewProjectionMatrix * vec4<f32>(input.position, 1.0);
        
        // 속도 기반 색상 매핑 (스파게티 시각화)
        let speed = length(input.velocity);
        let normalizedSpeed = clamp(speed * uniforms.colorScale, 0.0, 1.0);
        
        // Blue to Red colormap
        output.color = vec4<f32>(
          normalizedSpeed,
          0.5 * (1.0 - normalizedSpeed),
          1.0 - normalizedSpeed,
          0.8
        );
        
        return output;
      }

      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        return input.color;
      }
    `;
  }

  /**
   * 4D Flow 데이터로부터 streamline 생성
   * @param {Object} flowData - 속도 필드 데이터 {vx, vy, vz, dimensions}
   * @param {Array} seedPoints - 시드 포인트 배열
   * @param {Number} maxSteps - 최대 추적 스텝
   */
  generateStreamlines(flowData, seedPoints, maxSteps = 100) {
    this.streamlines = [];
    
    seedPoints.forEach(seed => {
      const streamline = this.traceStreamline(flowData, seed, maxSteps);
      if (streamline.length > 1) {
        this.streamlines.push(streamline);
      }
    });

    return this.streamlines;
  }

  /**
   * 입자 추적 알고리즘 (4th order Runge-Kutta)
   */
  traceStreamline(flowData, seedPoint, maxSteps) {
    const streamline = [];
    const dt = 0.1; // 시간 간격
    let currentPos = [...seedPoint];

    for (let step = 0; step < maxSteps; step++) {
      const velocity = this.interpolateVelocity(flowData, currentPos);
      
      if (!velocity || this.isOutOfBounds(currentPos, flowData.dimensions)) {
        break;
      }

      streamline.push({
        position: [...currentPos],
        velocity: [...velocity]
      });

      // RK4 integration
      const k1 = velocity;
      const k2 = this.interpolateVelocity(flowData, [
        currentPos[0] + 0.5 * dt * k1[0],
        currentPos[1] + 0.5 * dt * k1[1],
        currentPos[2] + 0.5 * dt * k1[2]
      ]);
      const k3 = this.interpolateVelocity(flowData, [
        currentPos[0] + 0.5 * dt * k2[0],
        currentPos[1] + 0.5 * dt * k2[1],
        currentPos[2] + 0.5 * dt * k2[2]
      ]);
      const k4 = this.interpolateVelocity(flowData, [
        currentPos[0] + dt * k3[0],
        currentPos[1] + dt * k3[1],
        currentPos[2] + dt * k3[2]
      ]);

      if (!k2 || !k3 || !k4) break;

      currentPos[0] += (dt / 6.0) * (k1[0] + 2*k2[0] + 2*k3[0] + k4[0]);
      currentPos[1] += (dt / 6.0) * (k1[1] + 2*k2[1] + 2*k3[1] + k4[1]);
      currentPos[2] += (dt / 6.0) * (k1[2] + 2*k2[2] + 2*k3[2] + k4[2]);
    }

    return streamline;
  }

  /**
   * Trilinear interpolation for velocity field
   */
  interpolateVelocity(flowData, position) {
    const { vx, vy, vz, dimensions } = flowData;
    const [x, y, z] = position;
    const [nx, ny, nz] = dimensions;

    const i = Math.floor(x);
    const j = Math.floor(y);
    const k = Math.floor(z);

    if (i < 0 || i >= nx-1 || j < 0 || j >= ny-1 || k < 0 || k >= nz-1) {
      return null;
    }

    const fx = x - i;
    const fy = y - j;
    const fz = z - k;

    const idx = (i, j, k) => i + nx * (j + ny * k);

    // Trilinear interpolation
    const interp = (field) => {
      return (
        field[idx(i, j, k)] * (1-fx) * (1-fy) * (1-fz) +
        field[idx(i+1, j, k)] * fx * (1-fy) * (1-fz) +
        field[idx(i, j+1, k)] * (1-fx) * fy * (1-fz) +
        field[idx(i+1, j+1, k)] * fx * fy * (1-fz) +
        field[idx(i, j, k+1)] * (1-fx) * (1-fy) * fz +
        field[idx(i+1, j, k+1)] * fx * (1-fy) * fz +
        field[idx(i, j+1, k+1)] * (1-fx) * fy * fz +
        field[idx(i+1, j+1, k+1)] * fx * fy * fz
      );
    };

    return [interp(vx), interp(vy), interp(vz)];
  }

  /**
   * 경계 체크
   */
  isOutOfBounds(position, dimensions) {
    const [x, y, z] = position;
    const [nx, ny, nz] = dimensions;
    return x < 0 || x >= nx || y < 0 || y >= ny || z < 0 || z >= nz;
  }

  /**
   * Streamline 데이터를 GPU 버퍼로 전송
   */
  createStreamlineBuffers() {
    const buffers = [];

    this.streamlines.forEach(streamline => {
      const vertexData = new Float32Array(streamline.length * 6);
      
      streamline.forEach((point, idx) => {
        vertexData[idx * 6 + 0] = point.position[0];
        vertexData[idx * 6 + 1] = point.position[1];
        vertexData[idx * 6 + 2] = point.position[2];
        vertexData[idx * 6 + 3] = point.velocity[0];
        vertexData[idx * 6 + 4] = point.velocity[1];
        vertexData[idx * 6 + 5] = point.velocity[2];
      });

      const buffer = this.device.createBuffer({
        size: vertexData.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST
      });

      this.device.queue.writeBuffer(buffer, 0, vertexData);
      buffers.push({ buffer, vertexCount: streamline.length });
    });

    return buffers;
  }

  /**
   * 렌더링 실행
   */
  render(viewProjectionMatrix, timeStep = 0.0, colorScale = 1.0) {
    if (!this.initialized) {
      throw new Error('Renderer not initialized. Call initialize() first.');
    }

    const uniformData = new Float32Array([
      ...viewProjectionMatrix,
      timeStep,
      colorScale
    ]);

    const uniformBuffer = this.device.createBuffer({
      size: uniformData.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });

    this.device.queue.writeBuffer(uniformBuffer, 0, uniformData);

    const bindGroup = this.device.createBindGroup({
      layout: this.pipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: { buffer: uniformBuffer }
      }]
    });

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPassDescriptor = {
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, bindGroup);

    const streamlineBuffers = this.createStreamlineBuffers();
    streamlineBuffers.forEach(({ buffer, vertexCount }) => {
      passEncoder.setVertexBuffer(0, buffer);
      passEncoder.draw(vertexCount, 1, 0, 0);
    });

    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

  /**
   * 리소스 정리
   */
  dispose() {
    this.streamlines = [];
    this.initialized = false;
  }
}

/**
 * 유틸리티: 자동 시드 포인트 생성
 */
export function generateSeedPoints(dimensions, spacing = 5) {
  const [nx, ny, nz] = dimensions;
  const seeds = [];

  for (let i = spacing; i < nx; i += spacing) {
    for (let j = spacing; j < ny; j += spacing) {
      for (let k = spacing; k < nz; k += spacing) {
        seeds.push([i, j, k]);
      }
    }
  }

  return seeds;
}

export default SpaghettiStreamlineRenderer;