import { FlowData, Vector3D, VorticityMetrics } from './types';

export class VorticityCalculator {
private data: FlowData;

constructor(flowData: FlowData) {
this.data = flowData;
}

calculate(): VorticityMetrics {
const vorticity = this.calculateVorticity();
const magnitude = vorticity.map(v => this.magnitude(v));
const helicity = this.calculateHelicity(vorticity);
const qCriterion = this.calculateQCriterion();

return {
vorticity,
vorticityMagnitude: magnitude,
helicity,
qCriterion,
vortexCores: this.detectVortexCores(qCriterion),
maxVorticity: Math.max(...magnitude)
};
}

private calculateVorticity(): Vector3D[] {
const velocities = this.data.velocities;
const vorticity: Vector3D[] = [];
const dx = this.data.spacing || 1;

for (let i = 1; i < velocities.length - 1; i++) {
const v_next = velocities[i + 1];
const v_prev = velocities[i - 1];

const duy_dx = (v_next.y - v_prev.y) / (2 * dx);
const duz_dx = (v_next.z - v_prev.z) / (2 * dx);
const dux_dy = (v_next.x - v_prev.x) / (2 * dx);
const duz_dy = (v_next.z - v_prev.z) / (2 * dx);
const dux_dz = (v_next.x - v_prev.x) / (2 * dx);
const duy_dz = (v_next.y - v_prev.y) / (2 * dx);

vorticity.push({
x: duz_dy - duy_dz,
y: dux_dz - duz_dx,
z: duy_dx - dux_dy
});
}

return vorticity;
}

private calculateHelicity(vorticity: Vector3D[]): number[] {
const velocities = this.data.velocities;
const helicity: number[] = [];

for (let i = 0; i < vorticity.length; i++) {
const v = velocities[i + 1];
const w = vorticity[i];
helicity.push(v.x * w.x + v.y * w.y + v.z * w.z);
}

return helicity;
}

private calculateQCriterion(): number[] {
const velocities = this.data.velocities;
const qCriterion: number[] = [];
const dx = this.data.spacing || 1;

for (let i = 1; i < velocities.length - 1; i++) {
const v_next = velocities[i + 1];
const v_prev = velocities[i - 1];

const dux_dx = (v_next.x - v_prev.x) / (2 * dx);
const duy_dy = (v_next.y - v_prev.y) / (2 * dx);
const duz_dz = (v_next.z - v_prev.z) / (2 * dx);
const duy_dx = (v_next.y - v_prev.y) / (2 * dx);
const dux_dy = (v_next.x - v_prev.x) / (2 * dx);
const duz_dx = (v_next.z - v_prev.z) / (2 * dx);
const dux_dz = (v_next.x - v_prev.x) / (2 * dx);
const duy_dz = (v_next.y - v_prev.y) / (2 * dx);
const duz_dy = (v_next.z - v_prev.z) / (2 * dx);

const omega11 = 0;
const omega12 = 0.5 * (duy_dx - dux_dy);
const omega13 = 0.5 * (duz_dx - dux_dz);
const omega22 = 0;
const omega23 = 0.5 * (duz_dy - duy_dz);
const omega33 = 0;

const s11 = dux_dx;
const s12 = 0.5 * (duy_dx + dux_dy);
const s13 = 0.5 * (duz_dx + dux_dz);
const s22 = duy_dy;
const s23 = 0.5 * (duz_dy + duy_dz);
const s33 = duz_dz;

const omegaNorm = omega12 ** 2 + omega13 ** 2 + omega23 ** 2;
const sNorm = s11 ** 2 + s22 ** 2 + s33 ** 2 + 2 * (s12 ** 2 + s13 ** 2 + s23 ** 2);

qCriterion.push(0.5 * (omegaNorm - sNorm));
}

return qCriterion;
}

private detectVortexCores(qCriterion: number[]): number[] {
const threshold = this.calculateThreshold(qCriterion);
const cores: number[] = [];

for (let i = 0; i < qCriterion.length; i++) {
if (qCriterion[i] > threshold) {
cores.push(i);
}
}

return cores;
}

private calculateThreshold(qCriterion: number[]): number {
const sorted = [...qCriterion].sort((a, b) => b - a);
const percentile95 = Math.floor(sorted.length * 0.05);
return sorted[percentile95];
}

private magnitude(v: Vector3D): number {
return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}
}
