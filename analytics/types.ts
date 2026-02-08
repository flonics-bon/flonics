export interface FlowData {
velocity: number;
pressure: number;
diameter: number;
viscosity: number;
}
export interface WSSResult {
value: number;
unit: string;
location: string;
}
export interface VelocityProfile {
radius: number;
velocity: number;
}
export interface FlowMetrics {
reynoldsNumber: number;
flowRate: number;
wss: number;
}