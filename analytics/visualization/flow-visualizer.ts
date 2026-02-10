import { FlowMetrics } from '../types/flow-types';
import { WebGPURenderer } from './webgpu-renderer';

export class FlowVisualizer {
private renderer: WebGPURenderer;
private canvas: HTMLCanvasElement;

constructor(canvas: HTMLCanvasElement) {
this.canvas = canvas;
this.renderer = new WebGPURenderer();
}

async initialize(): Promise<void> {
await this.renderer.initialize(this.canvas);
}

visualize(metrics: FlowMetrics): void {
this.renderer.render(metrics.velocity);
this.drawColorMap(metrics.wss.values);
}

private drawColorMap(data: Float32Array): void {
const ctx = this.canvas.getContext('2d');
if (!ctx) return;

const imageData = ctx.createImageData(this.canvas.width, this.canvas.height);
for (let i = 0; i < data.length; i++) {
const color = this.valueToColor(data[i]);
imageData.data[i * 4] = color[0];
imageData.data[i * 4 + 1] = color[1];
imageData.data[i * 4 + 2] = color[2];
imageData.data[i * 4 + 3] = 255;
}
ctx.putImageData(imageData, 0, 0);
}

private valueToColor(value: number): [number, number, number] {
const r = Math.floor(value * 255);
const b = Math.floor((1 - value) * 255);
return [r, 0, b];
}
}