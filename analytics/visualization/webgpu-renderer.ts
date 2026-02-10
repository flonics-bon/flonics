import { VelocityField } from '../types/flow-types';

export class WebGPURenderer {
private device: GPUDevice | null = null;
private context: GPUCanvasContext | null = null;
private pipeline: GPURenderPipeline | null = null;

async initialize(canvas: HTMLCanvasElement): Promise<void> {
if (!navigator.gpu) throw new Error('WebGPU not supported');

const adapter = await navigator.gpu.requestAdapter();
if (!adapter) throw new Error('No GPU adapter');

this.device = await adapter.requestDevice();
this.context = canvas.getContext('webgpu');
if (!this.context) throw new Error('No WebGPU context');

const format = navigator.gpu.getPreferredCanvasFormat();
this.context.configure({ device: this.device, format });

await this.createPipeline(format);
}

private async createPipeline(format: GPUTextureFormat): Promise<void> {
const shaderCode = `
@vertex
fn vs_main(@location(0) pos: vec3<f32>) -> @builtin(position) vec4<f32> {
return vec4<f32>(pos, 1.0);
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}
`;

const shaderModule = this.device!.createShaderModule({ code: shaderCode });

this.pipeline = this.device!.createRenderPipeline({
layout: 'auto',
vertex: { module: shaderModule, entryPoint: 'vs_main', buffers: [] },
fragment: { module: shaderModule, entryPoint: 'fs_main', targets: [{ format }] },
primitive: { topology: 'triangle-list' }
});
}

render(velocity: VelocityField): void {
if (!this.device || !this.context || !this.pipeline) return;

const commandEncoder = this.device.createCommandEncoder();
const textureView = this.context.getCurrentTexture().createView();

const renderPass = commandEncoder.beginRenderPass({
colorAttachments: [{
view: textureView,
loadOp: 'clear',
storeOp: 'store',
clearValue: { r: 0, g: 0, b: 0, a: 1 }
}]
});

renderPass.setPipeline(this.pipeline);
renderPass.draw(3);
renderPass.end();

this.device.queue.submit([commandEncoder.finish()]);
}
}