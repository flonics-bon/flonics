export interface FlowData{time:number;velocity:Vector3D;pressure:number;position:Vector3D}
export interface Vector3D{x:number;y:number;z:number}
export interface FlowMetrics{peakVelocity:number;meanVelocity:number;flowRate:number;wallShearStress:number}
export interface AnalysisConfig{timeStep:number;spatialResolution:number;region?:BoundingBox}
export interface BoundingBox{min:Vector3D;max:Vector3D}
export interface VisualizationOptions{colorMap:string;opacity:number;streamlines:boolean}
export type AnalysisResult={metrics:FlowMetrics;timestamp:number;region:string}