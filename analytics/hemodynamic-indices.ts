import { FlowData, HemodynamicIndices } from './types';

export class HemodynamicIndexCalculator {
private data: FlowData;
private density: number = 1060;
private viscosity: number = 0.0035;

constructor(flowData: FlowData) {
this.data = flowData;
}

calculate(): HemodynamicIndices {
return {
oscillatoryShearIndex: this.calculateOSI(),
relativeResidenceTime: this.calculateRRT(),
endothelialCellActivationPotential: this.calculateECAP(),
transverseWallShearStress: this.calculateTransWSS(),
wallShearStressGradient: this.calculateWSSGradient()
};
}

private calculateOSI(): number[] {
const wss = this.data.wallShearStress || [];
const osi: number[] = [];

for (let i = 0; i < wss.length; i++) {
const timeAvgWSS = this.calculateTimeAveragedWSS(i);
const wssVector = wss[i];
const wssMag = Math.sqrt(wssVector.x ** 2 + wssVector.y ** 2 + wssVector.z ** 2);

osi.push(0.5 * (1 - timeAvgWSS / wssMag));
}

return osi;
}

private calculateRRT(): number[] {
const wss = this.data.wallShearStress || [];
const osi = this.calculateOSI();
const rrt: number[] = [];

for (let i = 0; i < wss.length; i++) {
const wssMag = Math.sqrt(wss[i].x ** 2 + wss[i].y ** 2 + wss[i].z ** 2);
rrt.push(1 / ((1 - 2 * osi[i]) * wssMag));
}

return rrt;
}

private calculateECAP(): number[] {
const osi = this.calculateOSI();
const wss = this.data.wallShearStress || [];
const ecap: number[] = [];

for (let i = 0; i < wss.length; i++) {
const wssMag = Math.sqrt(wss[i].x ** 2 + wss[i].y ** 2 + wss[i].z ** 2);
ecap.push(osi[i] / wssMag);
}

return ecap;
}

private calculateTransWSS(): number[] {
const wss = this.data.wallShearStress || [];
const transWSS: number[] = [];
const mainFlow = this.getMainFlowDirection();

for (let i = 0; i < wss.length; i++) {
const wssVec = wss[i];
const dotProduct = wssVec.x * mainFlow.x + wssVec.y * mainFlow.y + wssVec.z * mainFlow.z;
const parallelComponent = {
x: dotProduct * mainFlow.x,
y: dotProduct * mainFlow.y,
z: dotProduct * mainFlow.z
};

const transComponent = {
x: wssVec.x - parallelComponent.x,
y: wssVec.y - parallelComponent.y,
z: wssVec.z - parallelComponent.z
};

transWSS.push(Math.sqrt(transComponent.x ** 2 + transComponent.y ** 2 + transComponent.z ** 2));
}

return transWSS;
}

private calculateWSSGradient(): number[] {
const wss = this.data.wallShearStress || [];
const gradient: number[] = [];
const dx = this.data.spacing || 1;

for (let i = 1; i < wss.length - 1; i++) {
const wss_next = Math.sqrt(wss[i + 1].x ** 2 + wss[i + 1].y ** 2 + wss[i + 1].z ** 2);
const wss_prev = Math.sqrt(wss[i - 1].x ** 2 + wss[i - 1].y ** 2 + wss[i - 1].z ** 2);

gradient.push((wss_next - wss_prev) / (2 * dx));
}

return gradient;
}

private calculateTimeAveragedWSS(index: number): number {
const wss = this.data.wallShearStress || [];
if (index >= wss.length) return 0;

const wssVec = wss[index];
return Math.sqrt(wssVec.x ** 2 + wssVec.y ** 2 + wssVec.z ** 2);
}

private getMainFlowDirection() {
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
}
