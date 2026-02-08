import { FlowData, Vector3D, PressureMetrics } from './types';

export class PressureGradientCalculator {
private data: FlowData;
private density: number = 1060;

constructor(flowData: FlowData, density: number = 1060) {
this.data = flowData;
this.density = density;
}

calculate(): PressureMetrics {
const gradient = this.calculateGradient();
const pressure = this.reconstructPressure(gradient);
const adverseGradient = this.detectAdverseGradient(gradient);

return {
pressureField: pressure,
pressureGradient: gradient,
adverseGradientRegions: adverseGradient,
maxPressure: Math.max(...pressure),
minPressure: Math.min(...pressure),
pressureDrop: this.calculatePressureDrop(pressure)
};
}

private calculateGradient(): Vector3D[] {
const velocities = this.data.velocities;
const gradient: Vector3D[] = [];
const dx = this.data.spacing || 1;

for (let i = 1; i < velocities.length - 1; i++) {
const v_next = velocities[i + 1];
const v_prev = velocities[i - 1];
const v_curr = velocities[i];

const du_dt = (this.magnitude(v_next) - this.magnitude(v_prev)) / (2 * dx);
const accel = this.calculateAcceleration(v_prev, v_curr, v_next, dx);

gradient.push({
x: -this.density * accel.x,
y: -this.density * accel.y,
z: -this.density * accel.z
});
}

return gradient;
}

private calculateAcceleration(v_prev: Vector3D, v_curr: Vector3D, v_next: Vector3D, dx: number): Vector3D {
const dvx_dx = (v_next.x - v_prev.x) / (2 * dx);
const dvy_dy = (v_next.y - v_prev.y) / (2 * dx);
const dvz_dz = (v_next.z - v_prev.z) / (2 * dx);

return {
x: v_curr.x * dvx_dx,
y: v_curr.y * dvy_dy,
z: v_curr.z * dvz_dz
};
}

private reconstructPressure(gradient: Vector3D[]): number[] {
const pressure: number[] = [0];
const dx = this.data.spacing || 1;

for (let i = 0; i < gradient.length; i++) {
const dp = -this.magnitude(gradient[i]) * dx;
pressure.push(pressure[pressure.length - 1] + dp);
}

return pressure;
}

private detectAdverseGradient(gradient: Vector3D[]): number[] {
const adverse: number[] = [];
const flowDirection = this.getMainFlowDirection();

for (let i = 0; i < gradient.length; i++) {
const dotProduct = gradient[i].x * flowDirection.x + gradient[i].y * flowDirection.y + gradient[i].z * flowDirection.z;
if (dotProduct > 0) {
adverse.push(i);
}
}

return adverse;
}

private getMainFlowDirection(): Vector3D {
const velocities = this.data.velocities;
const avgVel = velocities.reduce((acc, v) => ({
x: acc.x + v.x,
y: acc.y + v.y,
z: acc.z + v.z
}), { x: 0, y: 0, z: 0 });

const n = velocities.length;
const mag = Math.sqrt(avgVel.x ** 2 + avgVel.y ** 2 + avgVel.z ** 2);

return {
x: avgVel.x / (n * mag),
y: avgVel.y / (n * mag),
z: avgVel.z / (n * mag)
};
}

private calculatePressureDrop(pressure: number[]): number {
return pressure[0] - pressure[pressure.length - 1];
}

private magnitude(v: Vector3D): number {
return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}
}
