// 4D Flow MRI Particle Visualization with WebGPU

const canvas = document.querySelector('canvas');
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
const context = canvas.getContext('webgpu');
const format = navigator.gpu.getPreferredCanvasFormat();

context.configure({ device, format });

// Particle simulation shader
const computeShader = `
@group(0) @binding(0) var<storage, read_write> particles: array<vec4<f32>>;
@group(0) @binding(1) var<storage, read> velocityField: array<vec4<f32>>;
@group(0) @binding(2) var<uniform> params: vec4<f32>; // time, deltaTime, gridSize, maxSpeed

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
  let idx = id.x;
  if (idx >= arrayLength(&particles)) { return; }
  
  var pos = particles[idx].xyz;
  let gridSize = params.z;
  
  // Sample velocity field (trilinear interpolation)
  let gridPos = pos * gridSize;
  let i = vec3<i32>(floor(gridPos));
  
  if (all(i >= vec3<i32>(0)) && all(i < vec3<i32>(i32(gridSize)))) {
    let fieldIdx = i.x + i.y * i32(gridSize) + i.z * i32(gridSize * gridSize);
    let velocity = velocityField[fieldIdx].xyz;
    
    // Update position using velocity
    pos += velocity * params.y * 0.01;
    
    // Wrap around boundaries
    pos = fract(pos);
  }
  
  particles[idx] = vec4<f32>(pos, 1.0);
}
`;

const renderShader = `
struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) color: vec4<f32>,
};

@group(0) @binding(0) var<storage, read> particles: array<vec4<f32>>;
@group(0) @binding(1) var<uniform> mvp: mat4x4<f32>;

@vertex
fn vertexMain(@builtin(vertex_index) idx: u32) -> VertexOutput {
  let particle = particles[idx];
  let pos = particle.xyz * 2.0 - 1.0; // Map to [-1, 1]
  
  var output: VertexOutput;
  output.position = mvp * vec4<f32>(pos, 1.0);
  output.color = vec4<f32>(0.2, 0.6, 1.0, 1.0);
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
  return input.color;
}
`;

const computePipeline = device.createComputePipeline({
  layout: 'auto',
  compute: {
    module: device.createShaderModule({ code: computeShader }),
    entryPoint: 'main',
  },
});

const renderPipeline = device.createRenderPipeline({
  layout: 'auto',
  vertex: {
    module: device.createShaderModule({ code: renderShader }),
    entryPoint: 'vertexMain',
  },
  fragment: {
    module: device.createShaderModule({ code: renderShader }),
    entryPoint: 'fragmentMain',
    targets: [{ format }],
  },
  primitive: { topology: 'point-list' },
});

// Initialize particle and velocity data
const numParticles = 10000;
const gridSize = 64;
const particleData = new Float32Array(numParticles * 4);
const velocityData = new Float32Array(gridSize * gridSize * gridSize * 4);

// Random particle positions
for (let i = 0; i < numParticles * 4; i += 4) {
  particleData[i] = Math.random();
  particleData[i + 1] = Math.random();
  particleData[i + 2] = Math.random();
  particleData[i + 3] = 1.0;
}

// Synthetic velocity field (spiral flow)
for (let z = 0; z < gridSize; z++) {
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const idx = (x + y * gridSize + z * gridSize * gridSize) * 4;
      const cx = x / gridSize - 0.5;
      const cy = y / gridSize - 0.5;
      const cz = z / gridSize - 0.5;
      velocityData[idx] = -cy;
      velocityData[idx + 1] = cx;
      velocityData[idx + 2] = cz * 0.1;
      velocityData[idx + 3] = 0.0;
    }
  }
}

const particleBuffer = device.createBuffer({
  size: particleData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(particleBuffer, 0, particleData);

const velocityBuffer = device.createBuffer({
  size: velocityData.byteLength,
  usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(velocityBuffer, 0, velocityData);

const paramsBuffer = device.createBuffer({
  size: 16,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const mvpBuffer = device.createBuffer({
  size: 64,
  usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});

const computeBindGroup = device.createBindGroup({
  layout: computePipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: { buffer: particleBuffer } },
    { binding: 1, resource: { buffer: velocityBuffer } },
    { binding: 2, resource: { buffer: paramsBuffer } },
  ],
});

const renderBindGroup = device.createBindGroup({
  layout: renderPipeline.getBindGroupLayout(0),
  entries: [
    { binding: 0, resource: { buffer: particleBuffer } },
    { binding: 1, resource: { buffer: mvpBuffer } },
  ],
});

const identity = new Float32Array([
  1, 0, 0, 0,
  0, 1, 0, 0,
  0, 0, 1, 0,
  0, 0, 0, 1,
]);
device.queue.writeBuffer(mvpBuffer, 0, identity);

let time = 0;
function frame() {
  time += 0.016;
  const params = new Float32Array([time, 0.016, gridSize, 1.0]);
  device.queue.writeBuffer(paramsBuffer, 0, params);

  const encoder = device.createCommandEncoder();
  
  // Compute pass
  const computePass = encoder.beginComputePass();
  computePass.setPipeline(computePipeline);
  computePass.setBindGroup(0, computeBindGroup);
  computePass.dispatchWorkgroups(Math.ceil(numParticles / 64));
  computePass.end();

  // Render pass
  const renderPass = encoder.beginRenderPass({
    colorAttachments: [{
      view: context.getCurrentTexture().createView(),
      loadOp: 'clear',
      clearValue: { r: 0, g: 0, b: 0, a: 1 },
      storeOp: 'store',
    }],
  });
  renderPass.setPipeline(renderPipeline);
  renderPass.setBindGroup(0, renderBindGroup);
  renderPass.draw(numParticles);
  renderPass.end();

  device.queue.submit([encoder.finish()]);
  requestAnimationFrame(frame);
}

frame();