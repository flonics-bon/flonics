export interface Vector3D {
x: number;
y: number;
z: number;
}

export interface FlowData {
velocities: Vector3D[];
pressure?: number[];
wallShearStress?: Vector3D[];
timestamps?: number[];
spacing?: number;
}

export interface FlowMetrics {
velocityMagnitude: number[];
speed: number[];
reynoldsNumber: number;
flowRate: number;
}

export interface WallShearStress {
values: Vector3D[];
magnitude: number[];
maxWSS: number;
minWSS: number;
averageWSS: number;
}

export interface TurbulenceMetrics {
turbulentKineticEnergy: number[];
turbulenceIntensity: number[];
reynoldsStress: number[][];
enstrophy: number[];
kolmogorovScale: number;
}

export interface PressureMetrics {
pressureField: number[];
pressureGradient: Vector3D[];
adverseGradientRegions: number[];
maxPressure: number;
minPressure: number;
pressureDrop: number;
}

export interface VorticityMetrics {
vorticity: Vector3D[];
vorticityMagnitude: number[];
helicity: number[];
qCriterion: number[];
vortexCores: number[];
maxVorticity: number;
}

export interface HemodynamicIndices {
oscillatoryShearIndex: number[];
relativeResidenceTime: number[];
endothelialCellActivationPotential: number[];
transverseWallShearStress: number[];
wallShearStressGradient: number[];
}

export interface AnalysisResult {
flowMetrics: FlowMetrics;
wallShearStress: WallShearStress;
turbulence?: TurbulenceMetrics;
pressure?: PressureMetrics;
vorticity?: VorticityMetrics;
hemodynamicIndices?: HemodynamicIndices;
}
