import { FlowData, FlowMetrics, VelocityField } from '../types/flow-types';
import { MetricsCalculator } from './metrics-calculator';
import { DataProcessor } from './data-processor';

export class FlowAnalyzer {
private processor: DataProcessor;
private calculator: MetricsCalculator;

constructor() {
this.processor = new DataProcessor();
this.calculator = new MetricsCalculator();
}

analyze(data: FlowData): FlowMetrics {
const processed = this.processor.process(data);
const velocity = this.calculateVelocity(processed);
const wss = this.calculator.calculateWSS(velocity);
const vorticity = this.calculator.calculateVorticity(velocity);
const flowRate = this.calculator.calculateFlowRate(velocity);

return {
velocity,
wss,
vorticity,
flowRate,
timestamp: Date.now()
};
}

private calculateVelocity(data: Float32Array): VelocityField {
const size = Math.cbrt(data.length / 3);
const vx = new Float32Array(data.length / 3);
const vy = new Float32Array(data.length / 3);
const vz = new Float32Array(data.length / 3);

for (let i = 0; i < data.length / 3; i++) {
vx[i] = data[i * 3];
vy[i] = data[i * 3 + 1];
vz[i] = data[i * 3 + 2];
}

return { vx, vy, vz, dimensions: [size, size, size] };
}

computeStreamlines(velocity: VelocityField, seeds: number[][]): number[][][] {
const streamlines: number[][][] = [];
for (const seed of seeds) {
const line = this.traceStreamline(velocity, seed);
streamlines.push(line);
}
return streamlines;
}

private traceStreamline(velocity: VelocityField, seed: number[]): number[][] {
const points: number[][] = [seed];
let current = [...seed];
const dt = 0.01;
const maxSteps = 1000;

for (let i = 0; i < maxSteps; i++) {
const v = this.interpolateVelocity(velocity, current);
if (Math.hypot(v[0], v[1], v[2]) < 0.001) break;
current = [current[0] + v[0] * dt, current[1] + v[1] * dt, current[2] + v[2] * dt];
points.push([...current]);
}

return points;
}

private interpolateVelocity(velocity: VelocityField, pos: number[]): number[] {
const [x, y, z] = pos;
const [nx, ny, nz] = velocity.dimensions;
const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);

if (ix < 0 || ix >= nx - 1 || iy < 0 || iy >= ny - 1 || iz < 0 || iz >= nz - 1) {
return [0, 0, 0];
}

const idx = ix + iy * nx + iz * nx * ny;
return [velocity.vx[idx], velocity.vy[idx], velocity.vz[idx]];
}
}