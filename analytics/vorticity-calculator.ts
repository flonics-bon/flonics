import { FlowData, VorticityResult } from './types';

export class VorticityCalculator {
private data: FlowData;

constructor(data: FlowData) {
this.data = data;
}

calculate(): VorticityResult {
const { velocityX, velocityY, velocityZ } = this.data;
const omegaX = this.calculateOmegaX(velocityY, velocityZ);
const omegaY = this.calculateOmegaY(velocityX, velocityZ);
const omegaZ = this.calculateOmegaZ(velocityX, velocityY);

const magnitude = this.calculateMagnitude(omegaX, omegaY, omegaZ);
const helicity = this.calculateHelicity(omegaX, omegaY, omegaZ);
const qCriterion = this.calculateQCriterion(omegaX, omegaY, omegaZ);

return {
omegaX,
omegaY,
omegaZ,
magnitude,
helicity,
qCriterion,
vortexCores: this.detectVortexCores(qCriterion)
};
}

private calculateOmegaX(vy: number[][][], vz: number[][][]): number[][][] {
const omega: number[][][] = [];
for (let i = 0; i < vy.length; i++) {
omega[i] = [];
for (let j = 1; j < vy[i].length - 1; j++) {
omega[i][j] = [];
for (let k = 1; k < vy[i][j].length - 1; k++) {
const dvz_dy = (vz[i][j+1][k] - vz[i][j-1][k]) / 2;
const dvy_dz = (vy[i][j][k+1] - vy[i][j][k-1]) / 2;
omega[i][j][k] = dvz_dy - dvy_dz;
}
}
}
return omega;
}

private calculateOmegaY(vx: number[][][], vz: number[][][]): number[][][] {
const omega: number[][][] = [];
for (let i = 1; i < vx.length - 1; i++) {
omega[i] = [];
for (let j = 0; j < vx[i].length; j++) {
omega[i][j] = [];
for (let k = 1; k < vx[i][j].length - 1; k++) {
const dvx_dz = (vx[i][j][k+1] - vx[i][j][k-1]) / 2;
const dvz_dx = (vz[i+1][j][k] - vz[i-1][j][k]) / 2;
omega[i][j][k] = dvx_dz - dvz_dx;
}
}
}
return omega;
}

private calculateOmegaZ(vx: number[][][], vy: number[][][]): number[][][] {
const omega: number[][][] = [];
for (let i = 1; i < vx.length - 1; i++) {
omega[i] = [];
for (let j = 1; j < vx[i].length - 1; j++) {
omega[i][j] = [];
for (let k = 0; k < vx[i][j].length; k++) {
const dvy_dx = (vy[i+1][j][k] - vy[i-1][j][k]) / 2;
const dvx_dy = (vx[i][j+1][k] - vx[i][j-1][k]) / 2;
omega[i][j][k] = dvy_dx - dvx_dy;
}
}
}
return omega;
}

private calculateMagnitude(ox: number[][][], oy: number[][][], oz: number[][][]): number[][][] {
const mag: number[][][] = [];
for (let i = 0; i < ox.length; i++) {
mag[i] = [];
for (let j = 0; j < (ox[i]?.length || 0); j++) {
mag[i][j] = [];
for (let k = 0; k < (ox[i]?.[j]?.length || 0); k++) {
const x = ox[i]?.[j]?.[k] || 0;
const y = oy[i]?.[j]?.[k] || 0;
const z = oz[i]?.[j]?.[k] || 0;
mag[i][j][k] = Math.sqrt(x*x + y*y + z*z);
}
}
}
return mag;
}

private calculateHelicity(ox: number[][][], oy: number[][][], oz: number[][][]): number[][][] {
const { velocityX, velocityY, velocityZ } = this.data;
const helicity: number[][][] = [];
for (let i = 0; i < ox.length; i++) {
helicity[i] = [];
for (let j = 0; j < (ox[i]?.length || 0); j++) {
helicity[i][j] = [];
for (let k = 0; k < (ox[i]?.[j]?.length || 0); k++) {
const vx = velocityX[i]?.[j]?.[k] || 0;
const vy = velocityY[i]?.[j]?.[k] || 0;
const vz = velocityZ[i]?.[j]?.[k] || 0;
const wx = ox[i]?.[j]?.[k] || 0;
const wy = oy[i]?.[j]?.[k] || 0;
const wz = oz[i]?.[j]?.[k] || 0;
helicity[i][j][k] = vx*wx + vy*wy + vz*wz;
}
}
}
return helicity;
}

private calculateQCriterion(ox: number[][][], oy: number[][][], oz: number[][][]): number[][][] {
const q: number[][][] = [];
for (let i = 0; i < ox.length; i++) {
q[i] = [];
for (let j = 0; j < (ox[i]?.length || 0); j++) {
q[i][j] = [];
for (let k = 0; k < (ox[i]?.[j]?.length || 0); k++) {
const omegaSq = (ox[i]?.[j]?.[k] || 0)**2 + (oy[i]?.[j]?.[k] || 0)**2 + (oz[i]?.[j]?.[k] || 0)**2;
q[i][j][k] = 0.5 * omegaSq;
}
}
}
return q;
}

private detectVortexCores(q: number[][][]): Array<{x: number, y: number, z: number, strength: number}> {
const cores: Array<{x: number, y: number, z: number, strength: number}> = [];
const threshold = this.calculateThreshold(q);
for (let i = 1; i < q.length - 1; i++) {
for (let j = 1; j < q[i].length - 1; j++) {
for (let k = 1; k < q[i][j].length - 1; k++) {
if (q[i][j][k] > threshold) {
cores.push({x: i, y: j, z: k, strength: q[i][j][k]});
}
}
}
}
return cores;
}

private calculateThreshold(q: number[][][]): number {
let sum = 0;
let count = 0;
for (const plane of q) {
for (const row of plane) {
for (const val of row) {
sum += val;
count++;
}
}
}
const mean = sum / count;
return mean * 2;
}
}