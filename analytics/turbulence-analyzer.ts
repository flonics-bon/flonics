import { FlowData, TurbulenceMetrics } from './types';

export class TurbulenceAnalyzer {
private data: FlowData;

constructor(data: FlowData) {
this.data = data;
}

analyze(): TurbulenceMetrics {
const velocityFluctuations = this.calculateVelocityFluctuations();
const turbulentKineticEnergy = this.calculateTKE(velocityFluctuations);
const reynoldsStress = this.calculateReynoldsStress(velocityFluctuations);
const turbulenceIntensity = this.calculateTurbulenceIntensity(velocityFluctuations);

return {
turbulentKineticEnergy,
reynoldsStress,
turbulenceIntensity,
eddyViscosity: this.calculateEddyViscosity(turbulentKineticEnergy)
};
}

private calculateVelocityFluctuations(): number[][][] {
const { velocityX, velocityY, velocityZ } = this.data;
const meanVx = this.calculateMean(velocityX);
const meanVy = this.calculateMean(velocityY);
const meanVz = this.calculateMean(velocityZ);

const fluctuations: number[][][] = [];
for (let i = 0; i < velocityX.length; i++) {
for (let j = 0; j < velocityX[i].length; j++) {
for (let k = 0; k < velocityX[i][j].length; k++) {
if (!fluctuations[i]) fluctuations[i] = [];
if (!fluctuations[i][j]) fluctuations[i][j] = [];
fluctuations[i][j][k] = Math.sqrt(
Math.pow(velocityX[i][j][k] - meanVx, 2) +
Math.pow(velocityY[i][j][k] - meanVy, 2) +
Math.pow(velocityZ[i][j][k] - meanVz, 2)
);
}
}
}
return fluctuations;
}

private calculateTKE(fluctuations: number[][][]): number[][][] {
return fluctuations.map(plane =>
plane.map(row =>
row.map(val => 0.5 * val * val)
)
);
}

private calculateReynoldsStress(fluctuations: number[][][]): number {
let sum = 0;
let count = 0;
for (const plane of fluctuations) {
for (const row of plane) {
for (const val of row) {
sum += val * val;
count++;
}
}
}
return sum / count;
}

private calculateTurbulenceIntensity(fluctuations: number[][][]): number {
const rms = Math.sqrt(this.calculateReynoldsStress(fluctuations));
const meanVelocity = this.calculateMeanVelocityMagnitude();
return (rms / meanVelocity) * 100;
}

private calculateEddyViscosity(tke: number[][][]): number[][][] {
const Cmu = 0.09;
const epsilon = 0.001;
return tke.map(plane =>
plane.map(row =>
row.map(k => Cmu * k * k / epsilon)
)
);
}

private calculateMean(data: number[][][]): number {
let sum = 0;
let count = 0;
for (const plane of data) {
for (const row of plane) {
for (const val of row) {
sum += val;
count++;
}
}
}
return sum / count;
}

private calculateMeanVelocityMagnitude(): number {
const { velocityX, velocityY, velocityZ } = this.data;
let sum = 0;
let count = 0;
for (let i = 0; i < velocityX.length; i++) {
for (let j = 0; j < velocityX[i].length; j++) {
for (let k = 0; k < velocityX[i][j].length; k++) {
sum += Math.sqrt(
velocityX[i][j][k] ** 2 +
velocityY[i][j][k] ** 2 +
velocityZ[i][j][k] ** 2
);
count++;
}
}
}
return sum / count;
}
}