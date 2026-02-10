import{FlowData,FlowMetrics,AnalysisConfig}from'./types';
export class FlowAnalyzer{constructor(private config:AnalysisConfig){}
analyze(data:FlowData[]):FlowMetrics{const velocities=data.map(d=>Math.sqrt(d.velocity.x**2+d.velocity.y**2+d.velocity.z**2));
const peakVelocity=Math.max(...velocities);
const meanVelocity=velocities.reduce((a,b)=>a+b,0)/velocities.length;
const flowRate=this.calculateFlowRate(data);
const wallShearStress=this.calculateWSS(data);
return{peakVelocity,meanVelocity,flowRate,wallShearStress}}
private calculateFlowRate(data:FlowData[]):number{return data.reduce((sum,d)=>{const v=Math.sqrt(d.velocity.x**2+d.velocity.y**2+d.velocity.z**2);return sum+v},0)*this.config.spatialResolution}
private calculateWSS(data:FlowData[]):number{const gradients=data.map((d,i)=>{if(i===0)return 0;const prev=data[i-1];const dv=Math.sqrt((d.velocity.x-prev.velocity.x)**2+(d.velocity.y-prev.velocity.y)**2+(d.velocity.z-prev.velocity.z)**2);const dx=Math.sqrt((d.position.x-prev.position.x)**2+(d.position.y-prev.position.y)**2+(d.position.z-prev.position.z)**2);return dx>0?dv/dx:0});return Math.max(...gradients)*0.0035}}