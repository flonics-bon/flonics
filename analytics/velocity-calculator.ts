import { FlowData, VelocityProfile } from './types';
export function calculateVelocity(flowRate: number, diameter: number): number {
const radius = diameter / 2;
const area = Math.PI * radius * radius;
return flowRate / area;
}
export function calculateVelocityProfile(data: FlowData, points: number = 10): VelocityProfile[] {
const { velocity, diameter } = data;
const radius = diameter / 2;
const maxVelocity = 2 * velocity;
const profile: VelocityProfile[] = [];
for (let i = 0; i <= points; i++) {
const r = (i / points) * radius;
const v = maxVelocity * (1 - Math.pow(r / radius, 2));
profile.push({ radius: r, velocity: v });
}
return profile;
}
export function getPeakVelocity(data: FlowData): number {
return 2 * data.velocity;
}