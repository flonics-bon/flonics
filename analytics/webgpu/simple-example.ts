/**
 * WebGPU Simple Example
 * A basic WebGPU setup that renders a colored triangle
 */

export class SimpleWebGPUExample {
  private canvas: HTMLCanvasElement;
  private device: GPUDevice | null = null;
  private context: GPUCanvasContext | null = null;
  private pipeline: GPURenderPipeline | null = null;
  private vertexBuffer: GPUBuffer | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Initialize WebGPU context and resources
   */
  async initialize(): Promise<boolean> {
    if (!navigator.gpu) {
      console.error('WebGPU is not supported in this browser');
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        console.error('Failed to get GPU adapter');
        return false;
      }

      this.device = await adapter.requestDevice();
      this.context = this.canvas.getContext('webgpu');

      if (!this.context) {
        console.error('Failed to get WebGPU context');
        return false;
      }

      const format = navigator.gpu.getPreferredCanvasFormat();
      this.context.configure({
        device: this.device,
        format: format,
        alphaMode: 'opaque',
      });

      await this.createResources();
      return true;
    } catch (error) {
      console.error('WebGPU initialization failed:', error);
      return false;
    }
  }

  /**
   * Create rendering resources (shaders, pipeline, buffers)
   */
  private async createResources(): Promise<void> {
    if (!this.device) return;

    // Vertex data: position (x, y) and color (r, g, b)
    const vertices = new Float32Array([
      // x, y, r, g, b
      0.0, 0.5, 1.0, 0.0, 0.0,  // Top vertex (red)
      -0.5, -0.5, 0.0, 1.0, 0.0,  // Bottom-left vertex (green)
      0.5, -0.5, 0.0, 0.0, 1.0,  // Bottom-right vertex (blue)
    ]);

    // Create vertex buffer
    this.vertexBuffer = this.device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });

    new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
    this.vertexBuffer.unmap();

    // Shader module
    const shaderModule = this.device.createShaderModule({
      code: this.getShaderCode(),
    });

    // Vertex buffer layout
    const vertexBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 5 * Float32Array.BYTES_PER_ELEMENT,
      attributes: [
        {
          // position
          shaderLocation: 0,
          offset: 0,
          format: 'float32x2',
        },
        {
          // color
          shaderLocation: 1,
          offset: 2 * Float32Array.BYTES_PER_ELEMENT,
          format: 'float32x3',
        },
      ],
    };

    // Create render pipeline
    this.pipeline = this.device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [vertexBufferLayout],
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
      },
    });
  }

  /**
   * Get WGSL shader code
   */
  private getShaderCode(): string {
    return `
      struct VertexInput {
        @location(0) position: vec2<f32>,
        @location(1) color: vec3<f32>,
      }

      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec3<f32>,
      }

      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.position = vec4<f32>(input.position, 0.0, 1.0);
        output.color = input.color;
        return output;
      }

      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        return vec4<f32>(input.color, 1.0);
      }
    `;
  }

  /**
   * Render a frame
   */
  render(): void {
    if (!this.device || !this.context || !this.pipeline || !this.vertexBuffer) {
      return;
    }

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();

    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1.0 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });

    renderPass.setPipeline(this.pipeline);
    renderPass.setVertexBuffer(0, this.vertexBuffer);
    renderPass.draw(3, 1, 0, 0);
    renderPass.end();

    this.device.queue.submit([commandEncoder.finish()]);
  }

  /**
   * Start animation loop
   */
  startRenderLoop(): void {
    const animate = () => {
      this.render();
      requestAnimationFrame(animate);
    };
    animate();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.vertexBuffer) {
      this.vertexBuffer.destroy();
      this.vertexBuffer = null;
    }

    this.device = null;
    this.context = null;
    this.pipeline = null;
  }
}

/**
 * Usage example
 */
export async function createSimpleWebGPUExample(
  canvasId: string = 'webgpu-canvas'
): Promise<SimpleWebGPUExample | null> {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    console.error(`Canvas with id '${canvasId}' not found`);
    return null;
  }

  const example = new SimpleWebGPUExample(canvas);
  const success = await example.initialize();

  if (success) {
    example.startRenderLoop();
    return example;
  }

  return null;
}
