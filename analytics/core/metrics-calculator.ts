import { VelocityField, WSSData, VorticityField } from '../types/flow-types';

export class MetricsCalculator {
calculateWSS(velocity: VelocityField): WSSData {
const [nx, ny, nz] = velocity.dimensions;
const wss = new Float32Array(nx * ny * nz);
const mu = 0.004;

for (let k = 1; k < nz - 1; k++) {
for (let j = 1; j < ny - 1; j++) {
for (let i = 1; i < nx - 1; i++) {
const idx = i + j * nx + k * nx * ny;
const dvx_dy = (velocity.vx[idx + nx] - velocity.vx[idx - nx]) / 2;
const dvy_dx = (velocity.vy[idx + 1] - velocity.vy[idx - 1]) / 2;
const shear = Math.sqrt(dvx_dy ** 2 + dvy_dx ** 2);
wss[idx] = mu * shear;
}
}
}

return { values: wss, dimensions: velocity.dimensions };
}

calculateVorticity(velocity: VelocityField): VorticityField {
const [nx, ny, nz] = velocity.dimensions;
const wx = new Float32Array(nx * ny * nz);
const wy = new Float32Array(nx * ny * nz);
const wz = new Float32Array(nx * ny * nz);

for (let k = 1; k < nz - 1; k++) {
for (let j = 1; j < ny - 1; j++) {
for (let i = 1; i < nx - 1; i++) {
const idx = i + j * nx + k * nx * ny;
const dvy_dz = (velocity.vy[idx + nx * ny] - velocity.vy[idx - nx * ny]) / 2;
const dvz_dy = (velocity.vz[idx + nx] - velocity.vz[idx - nx]) / 2;
const dvz_dx = (velocity.vz[idx + 1] - velocity.vz[idx - 1]) / 2;
const dvx_dz = (velocity.vx[idx + nx * ny] - velocity.vx[idx - nx * ny]) / 2;
const dvx_dy = (velocity.vx[idx + nx] - velocity.vx[idx - nx]) / 2;
const dvy_dx = (velocity.vy[idx + 1] - velocity.vy[idx - 1]) / 2;

wx[idx] = dvy_dz - dvz_dy;
wy[idx] = dvz_dx - dvx_dz;
wz[idx] = dvx_dy - dvy_dx;
}
}
}

return { wx, wy, wz, dimensions: velocity.dimensions };
}

calculateFlowRate(velocity: VelocityField): number {
const [nx, ny, nz] = velocity.dimensions;
let sum = 0;
for (let i = 0; i < nx * ny * nz; i++) {
sum += Math.sqrt(velocity.vx[i] ** 2 + velocity.vy[i] ** 2 + velocity.vz[i] ** 2);
}
return sum / (nx * ny * nz);
}
}