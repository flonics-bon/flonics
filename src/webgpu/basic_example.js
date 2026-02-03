// WebGPU Basic Example

async function initWebGPU() {
  // Check if WebGPU is supported
  if (!navigator.gpu) {
    console.error('WebGPU is not supported in this browser');
    return;
  }

  // Request adapter and device
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error('Failed to get GPU adapter');
    return;
  }

  const device = await adapter.requestDevice();
  
  // Get canvas and configure context
  const canvas = document.querySelector('canvas');
  const context = canvas.getContext('webgpu');
  
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: format,
    alphaMode: 'opaque'
  });

  // Create shader module
  const shaderModule = device.createShaderModule({
    code: `
      @vertex
      fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
        var pos = array<vec2<f32>, 3>(
          vec2<f32>(0.0, 0.5),
          vec2<f32>(-0.5, -0.5),
          vec2<f32>(0.5, -0.5)
        );
        return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
      }

      @fragment
      fn fragmentMain() -> @location(0) vec4<f32> {
        return vec4<f32>(1.0, 0.0, 0.0, 1.0);
      }
    `
  });

  // Create render pipeline
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module: shaderModule,
      entryPoint: 'vertexMain'
    },
    fragment: {
      module: shaderModule,
      entryPoint: 'fragmentMain',
      targets: [{ format: format }]
    },
    primitive: {
      topology: 'triangle-list'
    }
  });

  // Render loop
  function render() {
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    
    const renderPass = commandEncoder.beginRenderPass({
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    });

    renderPass.setPipeline(pipeline);
    renderPass.draw(3);
    renderPass.end();

    device.queue.submit([commandEncoder.finish()]);
  }

  render();
}

// Initialize on page load
initWebGPU();