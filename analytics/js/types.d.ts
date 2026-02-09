interface FlowData{
velocity:Float32Array;
pressure:Float32Array;
timesteps:number;
dimensions:{x:number;y:number;z:number};
}
interface FlowMetrics{
peakVelocity:number;
meanVelocity:number;
wallShearStress:number[];
regurgitantFraction?:number;
}
interface VisualizationConfig{
colormap:string;
opacity:number;
threshold:number;
streamlineCount?:number;
}
interface WebGPUContext{
device:GPUDevice;
canvas:HTMLCanvasElement;
context:GPUCanvasContext;
}
declare class FlowDataManager{
loadData(file:File):Promise<FlowData>;
getMetrics():FlowMetrics;
exportResults():Blob;
}
declare class WebGPURenderer{
initialize(canvas:HTMLCanvasElement):Promise<void>;
render(data:FlowData,config:VisualizationConfig):void;
destroy():void;
}
