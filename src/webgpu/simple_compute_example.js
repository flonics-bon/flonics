/**
 * WebGPU Simple Compute Example
 * Demonstrates basic WebGPU setup and compute shader execution
 * for 4D Flow MRI data processing
 */

class WebGPUSimpleExample {
  constructor() {
    this.device = null;
    this.adapter = null;
    this.initialized = false;
  }

  /**
   * Initialize WebGPU device and adapter
   */
  async initialize() {
    if (!navigator.gpu) {
      throw new Error('WebGPU is not supported in this browser');
    }

    try {
      this.adapter = await navigator.gpu.requestAdapter();
      if (!this.adapter) {
        throw new Error('Failed to get GPU adapter');
      }

      this.device = await this.adapter.requestDevice();
      this.device.lost.then((info) => {
        console.error(`WebGPU device lost: ${info.message}`);
        this.initialized = false;
      });

      this.initialized = true;
      console.log('WebGPU initialized successfully');
    } catch (error) {
      throw new Error(`WebGPU initialization failed: ${error.message}`);
    }
  }

  /**
   * Create a simple compute shader for vector magnitude calculation
   * Useful for calculating velocity magnitude from 4D Flow MRI data
   */
  createComputeShader() {
    const shaderCode = `
      struct VelocityVector {
        x: f32,
        y: f32,
        z: f32,
        padding: f32
      }

      @group(0) @binding(0) var<storage, read> inputVectors: array<VelocityVector>;
      @group(0) @binding(1) var<storage, read_write> outputMagnitudes: array<f32>;

      @compute @workgroup_size(64)
      fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
        let index = global_id.x;
        
        if (index >= arrayLength(&inputVectors)) {
          return;
        }

        let vec = inputVectors[index];
        let magnitude = sqrt(vec.x * vec.x + vec.y * vec.y + vec.z * vec.z);
        outputMagnitudes[index] = magnitude;
      }
    `;

    return this.device.createShaderModule({
      label: 'Velocity Magnitude Compute Shader',
      code: shaderCode
    });
  }

  /**
   * Run a simple compute operation
   * @param {Float32Array} velocityData - Velocity vectors [x, y, z, padding, ...]
   * @returns {Promise<Float32Array>} - Computed magnitudes
   */
  async computeVelocityMagnitudes(velocityData) {
    if (!this.initialized) {
      await this.initialize();
    }

    const vectorCount = velocityData.length / 4;

    // Create buffers
    const inputBuffer = this.createBuffer(
      velocityData,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    );

    const outputBuffer = this.createBuffer(
      new Float32Array(vectorCount),
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    );

    const readBuffer = this.device.createBuffer({
      label: 'Read Buffer',
      size: vectorCount * Float32Array.BYTES_PER_ELEMENT,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    // Create compute pipeline
    const shaderModule = this.createComputeShader();
    const pipeline = this.createComputePipeline(shaderModule);

    // Create bind group
    const bindGroup = this.device.createBindGroup({
      label: 'Compute Bind Group',
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: inputBuffer } },
        { binding: 1, resource: { buffer: outputBuffer } }
      ]
    });

    // Execute compute shader
    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatchWorkgroups(Math.ceil(vectorCount / 64));
    passEncoder.end();

    // Copy output to read buffer
    commandEncoder.copyBufferToBuffer(
      outputBuffer,
      0,
      readBuffer,
      0,
      vectorCount * Float32Array.BYTES_PER_ELEMENT
    );

    this.device.queue.submit([commandEncoder.finish()]);

    // Read results
    await readBuffer.mapAsync(GPUMapMode.READ);
    const result = new Float32Array(readBuffer.getMappedRange()).slice();
    readBuffer.unmap();

    // Cleanup
    inputBuffer.destroy();
    outputBuffer.destroy();
    readBuffer.destroy();

    return result;
  }

  /**
   * Create a GPU buffer with initial data
   */
  createBuffer(data, usage) {
    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: usage,
      mappedAtCreation: true
    });

    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  /**
   * Create compute pipeline
   */
  createComputePipeline(shaderModule) {
    return this.device.createComputePipeline({
      label: 'Velocity Magnitude Pipeline',
      layout: 'auto',
      compute: {
        module: shaderModule,
        entryPoint: 'main'
      }
    });
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.device) {
      this.device.destroy();
      this.device = null;
      this.adapter = null;
      this.initialized = false;
    }
  }
}

// Example usage
async function runExample() {
  const example = new WebGPUSimpleExample();

  try {
    // Sample 4D Flow MRI velocity data (x, y, z, padding)
    const velocityData = new Float32Array([
      1.0, 2.0, 3.0, 0.0,  // Vector 1: magnitude = sqrt(1+4+9) = 3.74
      4.0, 5.0, 6.0, 0.0,  // Vector 2: magnitude = sqrt(16+25+36) = 8.77
      7.0, 8.0, 9.0, 0.0   // Vector 3: magnitude = sqrt(49+64+81) = 13.93
    ]);

    console.log('Computing velocity magnitudes...');
    const magnitudes = await example.computeVelocityMagnitudes(velocityData);

    console.log('Results:');
    magnitudes.forEach((mag, idx) => {
      console.log(`Vector ${idx + 1} magnitude: ${mag.toFixed(2)}`);
    });

  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    example.destroy();
  }
}

// Export for use in other modules
export { WebGPUSimpleExample, runExample };

// Auto-run if in browser environment
if (typeof window !== 'undefined') {
  window.WebGPUSimpleExample = WebGPUSimpleExample;
  window.runWebGPUExample = runExample;
}