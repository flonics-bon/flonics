export interface FlowData {
velocityX: number[][][];
velocityY: number[][][];
velocityZ: number[][][];
timestamps?: number[];
resolution?: { x: number; y: number; z: number };
}

export interface TurbulenceMetrics {
turbulentKineticEnergy: number[][][];
reynoldsStress: number;
turbulenceIntensity: number;
eddyViscosity: number[][][];
}

export interface PressureGradientResult {
pressureField: number[][][];
gradientMagnitude: number[][][];
adversePressureRegions: Array<{x: number; y: number; z: number}>;
maxPressureGradient: number;
}

export interface VorticityResult {
omegaX: number[][][];
omegaY: number[][][];
omegaZ: number[][][];
magnitude: number[][][];
helicity: number[][][];
qCriterion: number[][][];
vortexCores: Array<{x: number; y: number; z: number; strength: number}>;
}

export interface AnalysisResult {
flowMetrics?: any;
turbulence?: TurbulenceMetrics;
pressureGradient?: PressureGradientResult;
vorticity?: VorticityResult;
}