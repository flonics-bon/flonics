export interface VelocityVector {
  x: number;
  y: number;
  z: number;
}

export interface FlowData {
  vectors: VelocityVector[];
  dimensions: [number, number, number];
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ProcessedFlowData extends FlowData {
  magnitudes: number[];
}

export interface FlowAnalysisResult {
  meanVelocity: number;
  maxVelocity: number;
  turbulenceIndex: number;
  flowPattern: 'laminar' | 'transitional' | 'turbulent';
  vorticity: number;
  timestamp: number;
}

export interface FlowMetrics {
  peakVelocity: number;
  meanVelocity: number;
  flowVolume: number;
  velocityStd: number;
  reynoldsNumber: number;
  wallShearStress: number;
}

export interface VisualizationConfig {
  colorScheme: 'velocity' | 'turbulence' | 'vorticity';
  vectorScale: number;
  threshold: number;
  downsampleFactor: number;
}

export interface AnalysisConfig {
  velocityThreshold: number;
  turbulenceThreshold: number;
  temporalResolution: number;
}