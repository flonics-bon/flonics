export interface FlowData {
raw: Float32Array;
timestamp: number;
metadata?: Record<string, any>;
}

export interface VelocityField {
vx: Float32Array;
vy: Float32Array;
vz: Float32Array;
dimensions: [number, number, number];
}

export interface WSSData {
values: Float32Array;
dimensions: [number, number, number];
}

export interface VorticityField {
wx: Float32Array;
wy: Float32Array;
wz: Float32Array;
dimensions: [number, number, number];
}

export interface FlowMetrics {
velocity: VelocityField;
wss: WSSData;
vorticity: VorticityField;
flowRate: number;
timestamp: number;
}