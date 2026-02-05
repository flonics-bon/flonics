export class VelocityCalculator {
  private device: GPUDevice;
  private pipeline: GPUComputePipeline | null = null;

  constructor(device: GPUDevice) {
    this.device = device;
  }

  async initialize(): Promise<void> {
    const shaderCode = `
      @group(0) @binding(0) var<storage, read> input: array<f32>;
      @group(0) @binding(1) var<storage, read_write> output: array<f32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let idx = global_id.x;
        output[idx] = sqrt(input[idx * 3] * input[idx * 3] + 
                           input[idx * 3 + 1] * input[idx * 3 + 1] + 
                           input[idx * 3 + 2] * input[idx * 3 + 2]);
      }
    `;

    const shaderModule = this.device.createShaderModule({ code: shaderCode });
    this.pipeline = this.device.createComputePipeline({
      layout: 'auto',
      compute: { module: shaderModule, entryPoint: 'main' }
    });
  }

  calculate(velocityComponents: Float32Array): Float32Array {
    const magnitude = new Float32Array(velocityComponents.length / 3);
    for (let i = 0; i < magnitude.length; i++) {
      const vx = velocityComponents[i * 3];
      const vy = velocityComponents[i * 3 + 1];
      const vz = velocityComponents[i * 3 + 2];
      magnitude[i] = Math.sqrt(vx * vx + vy * vy + vz * vz);
    }
    return magnitude;
  }
}