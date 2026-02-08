import { FlowData, FlowMetrics } from './types';
export function calculateReynoldsNumber(data: FlowData): number {
const { velocity, diameter, viscosity } = data;
const density = 1060;
return (density * velocity * diameter) / viscosity;
}
export function calculateFlowRate(data: FlowData): number {
const { velocity, diameter } = data;
const radius = diameter / 2;
const area = Math.PI * radius * radius;
return velocity * area;
}
export function getFlowMetrics(data: FlowData): FlowMetrics {
const reynoldsNumber = calculateReynoldsNumber(data);
const flowRate = calculateFlowRate(data);
const wss = (4 * data.viscosity * data.velocity) / data.diameter;
return { reynoldsNumber, flowRate, wss };
}