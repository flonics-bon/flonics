import { FlowData, Vector3D, TurbulenceMetrics } from './types';

export class TurbulenceAnalyzer {
private data: FlowData;

constructor(flowData: FlowData) {
this.data = flowData;
}

analyze(): TurbulenceMetrics {
const tke = this.calculateTKE();
const intensity = this.calculateIntensity();
const reynoldsStress = this.calculateReynoldsStress();
const enstrophy = this.calculateEnstrophy();

return {
turbulentKineticEnergy: tke,
turbulenceIntensity: intensity,
reynoldsStress,
enstrophy,
kolmogorovScale: this.calculateKolmogorovScale(tke)
};
}

private calculateTKE(): number[] {
const velocities = this.data.velocities;
const meanVel = this.calculateMeanVelocity();
const tke: number[] = [];

for (let i = 0; i < velocities.length; i++) {
const u = velocities[i];
const uPrime = {
x: u.x - meanVel.x,
y: u.y - meanVel.y,
z: u.z - meanVel.z
};
tke.push(0.5 * (uPrime.x ** 2 + uPrime.y ** 2 + uPrime.z ** 2));
}

return tke;
}

private calculateIntensity(): number[] {
const tke = this.calculateTKE();
const meanSpeed = this.calculateMeanSpeed();

return tke.map(k => Math.sqrt(2 * k / 3) / meanSpeed);
}

private calculateReynoldsStress(): number[][] {
const velocities = this.data.velocities;
const meanVel = this.calculateMeanVelocity();
const stress: number[][] = [];

for (let i = 0; i < velocities.length; i++) {
const u = velocities[i];
const uPrime = {
x: u.x - meanVel.x,
y: u.y - meanVel.y,
z: u.z - meanVel.z
};

stress.push([
uPrime.x * uPrime.x,
uPrime.x * uPrime.y,
uPrime.x * uPrime.z,
uPrime.y * uPrime.y,
uPrime.y * uPrime.z,
uPrime.z * uPrime.z
]);
}

return stress;
}

private calculateEnstrophy(): number[] {
const vorticity = this.calculateVorticity();
return vorticity.map(v => 0.5 * (v.x ** 2 + v.y ** 2 + v.z ** 2));
}

private calculateVorticity(): Vector3D[] {
const velocities = this.data.velocities;
const vorticity: Vector3D[] = [];
const dx = this.data.spacing || 1;

for (let i = 1; i < velocities.length - 1; i++) {
const duy_dx = (velocities[i + 1].y - velocities[i - 1].y) / (2 * dx);
const duz_dx = (velocities[i + 1].z - velocities[i - 1].z) / (2 * dx);
const dux_dy = (velocities[i + 1].x - velocities[i - 1].x) / (2 * dx);
const duz_dy = (velocities[i + 1].z - velocities[i - 1].z) / (2 * dx);
const dux_dz = (velocities[i + 1].x - velocities[i - 1].x) / (2 * dx);
const duy_dz = (velocities[i + 1].y - velocities[i - 1].y) / (2 * dx);

vorticity.push({
x: duz_dy - duy_dz,
y: dux_dz - duz_dx,
z: duy_dx - dux_dy
});
}

return vorticity;
}

private calculateMeanVelocity(): Vector3D {
const velocities = this.data.velocities;
const sum = velocities.reduce((acc, v) => ({
x: acc.x + v.x,
y: acc.y + v.y,
z: acc.z + v.z
}), { x: 0, y: 0, z: 0 });

const n = velocities.length;
return { x: sum.x / n, y: sum.y / n, z: sum.z / n };
}

private calculateMeanSpeed(): number {
const meanVel = this.calculateMeanVelocity();
return Math.sqrt(meanVel.x ** 2 + meanVel.y ** 2 + meanVel.z ** 2);
}

private calculateKolmogorovScale(tke: number[]): number {
const meanTKE = tke.reduce((a, b) => a + b, 0) / tke.length;
const nu = 0.0000035;
const epsilon = this.estimateDissipationRate(meanTKE);
return Math.pow(nu ** 3 / epsilon, 0.25);
}

private estimateDissipationRate(tke: number): number {
const lengthScale = this.data.spacing || 1;
return Math.pow(tke, 1.5) / lengthScale;
}
}
