import { FlowData, PressureGradientResult } from './types';

export class PressureGradientCalculator {
private data: FlowData;
private density: number = 1060;

constructor(data: FlowData, density: number = 1060) {
this.data = data;
this.density = density;
}

calculate(): PressureGradientResult {
const { velocityX, velocityY, velocityZ } = this.data;
const gradX = this.computeGradient(velocityX);
const gradY = this.computeGradient(velocityY);
const gradZ = this.computeGradient(velocityZ);

const pressureField = this.solvePressurePoisson(gradX, gradY, gradZ);
const adversePressureRegions = this.detectAdversePressure(pressureField);

return {
pressureField,
gradientMagnitude: this.calculateGradientMagnitude(pressureField),
adversePressureRegions,
maxPressureGradient: this.findMaxGradient(pressureField)
};
}

private computeGradient(field: number[][][]): number[][][] {
const grad: number[][][] = [];
for (let i = 1; i < field.length - 1; i++) {
grad[i] = [];
for (let j = 1; j < field[i].length - 1; j++) {
grad[i][j] = [];
for (let k = 1; k < field[i][j].length - 1; k++) {
grad[i][j][k] = (field[i+1][j][k] - field[i-1][j][k]) / 2;
}
}
}
return grad;
}

private solvePressurePoisson(gx: number[][][], gy: number[][][], gz: number[][][]): number[][][] {
const nx = gx.length;
const ny = gx[0]?.length || 0;
const nz = gx[0]?.[0]?.length || 0;
const pressure: number[][][] = Array(nx).fill(0).map(() =>
Array(ny).fill(0).map(() => Array(nz).fill(0))
);

for (let iter = 0; iter < 50; iter++) {
for (let i = 1; i < nx - 1; i++) {
for (let j = 1; j < ny - 1; j++) {
for (let k = 1; k < nz - 1; k++) {
const laplacian = (
pressure[i+1][j][k] + pressure[i-1][j][k] +
pressure[i][j+1][k] + pressure[i][j-1][k] +
pressure[i][j][k+1] + pressure[i][j][k-1] - 6 * pressure[i][j][k]
);
const source = -this.density * (
(gx[i]?.[j]?.[k] || 0) +
(gy[i]?.[j]?.[k] || 0) +
(gz[i]?.[j]?.[k] || 0)
);
pressure[i][j][k] += 0.1 * (laplacian - source);
}
}
}
}
return pressure;
}

private calculateGradientMagnitude(pressure: number[][][]): number[][][] {
const mag: number[][][] = [];
for (let i = 1; i < pressure.length - 1; i++) {
mag[i] = [];
for (let j = 1; j < pressure[i].length - 1; j++) {
mag[i][j] = [];
for (let k = 1; k < pressure[i][j].length - 1; k++) {
const dx = (pressure[i+1][j][k] - pressure[i-1][j][k]) / 2;
const dy = (pressure[i][j+1][k] - pressure[i][j-1][k]) / 2;
const dz = (pressure[i][j][k+1] - pressure[i][j][k-1]) / 2;
mag[i][j][k] = Math.sqrt(dx*dx + dy*dy + dz*dz);
}
}
}
return mag;
}

private detectAdversePressure(pressure: number[][][]): Array<{x: number, y: number, z: number}> {
const regions: Array<{x: number, y: number, z: number}> = [];
for (let i = 1; i < pressure.length - 1; i++) {
for (let j = 1; j < pressure[i].length - 1; j++) {
for (let k = 1; k < pressure[i][j].length - 1; k++) {
const grad = (pressure[i+1][j][k] - pressure[i][j][k]);
if (grad > 0) {
regions.push({x: i, y: j, z: k});
}
}
}
}
return regions;
}

private findMaxGradient(pressure: number[][][]): number {
let max = 0;
for (let i = 1; i < pressure.length - 1; i++) {
for (let j = 1; j < pressure[i].length - 1; j++) {
for (let k = 1; k < pressure[i][j].length - 1; k++) {
const dx = Math.abs(pressure[i+1][j][k] - pressure[i-1][j][k]) / 2;
if (dx > max) max = dx;
}
}
}
return max;
}
}