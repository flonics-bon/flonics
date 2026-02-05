export interface AnalyticsConfig {
  timeSteps: number;
  spatialResolution: [number, number, number];
  venc: number;
}

export interface FlowData {
  velocity: Float32Array;
  dimensions: [number, number, number];
  timePoint: number;
}

export interface MetricsResult {
  peakVelocity: number;
  meanVelocity: number;
  flowRate: number;
  wss: number;
}