import { FlowData, WSSResult } from './types';
export function calculateWSS(data: FlowData): number {
const { velocity, diameter, viscosity } = data;
return (4 * viscosity * velocity) / diameter;
}
export function calculateWSSDistribution(data: FlowData, points: number = 8): WSSResult[] {
const baseWSS = calculateWSS(data);
const results: WSSResult[] = [];
for (let i = 0; i < points; i++) {
const angle = (i * 360) / points;
const variation = 1 + 0.1 * Math.sin((angle * Math.PI) / 180);
results.push({
value: baseWSS * variation,
unit: 'Pa',
location: `${angle}°`
});
}
return results;
}
export function getWSSCategory(wss: number): string {
if (wss < 0.4) return 'Low';
if (wss < 1.5) return 'Normal';
if (wss < 2.5) return 'Elevated';
return 'High';
}