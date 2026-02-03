// WebGPU Cube Rendering Test

const canvas = document.querySelector('canvas');
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu');
const format = navigator.gpu.getPreferredCanvasFormat();

context.configure({
  device,
  format,
  alphaMode: 'opaque'
});

const vertexShader = `
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
  var pos = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5)
  );
  return vec4<f32>(pos[vertexIndex], 0.0, 1.0);
}
`;

const fragmentShader = `
@fragment
fn main() -> @location(0) vec4<f32> {
  return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
`;

const pipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: device.createShaderModule({ code: vertexShader }),
    entryPoint: 'main'
  },
  fragment: {
    module: device.createShaderModule({ code: fragmentShader }),
    entryPoint: 'main',
    targets: [{ format }]
  },
  primitive: {
    topology: 'triangle-list'
  }
});

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