import { FlowAnalyzer } from './flow-analyzer';
import { VelocityCalculator } from './velocity-calculator';
import { WallShearStressCalculator } from './wall-shear-stress';
import { FlowMetricsCalculator } from './flow-metrics';
import { TurbulenceAnalyzer } from './turbulence-analyzer';
import { PressureGradientCalculator } from './pressure-gradient';
import { VorticityCalculator } from './vorticity-calculator';
import { HemodynamicIndexCalculator } from './hemodynamic-indices';
import { FlowData, AnalysisResult } from './types';

export class ComprehensiveFlowAnalyzer {
private flowData: FlowData;

constructor(flowData: FlowData) {
this.flowData = flowData;
}

analyze(options: {
includeTurbulence?: boolean;
includePressure?: boolean;
includeVorticity?: boolean;
includeHemodynamic?: boolean;
} = {}): AnalysisResult {
const flowAnalyzer = new FlowAnalyzer(this.flowData);
const wssCalculator = new WallShearStressCalculator(this.flowData);
const metricsCalculator = new FlowMetricsCalculator(this.flowData);

const result: AnalysisResult = {
flowMetrics: metricsCalculator.calculate(),
wallShearStress: wssCalculator.calculate()
};

if (options.includeTurbulence) {
const turbulenceAnalyzer = new TurbulenceAnalyzer(this.flowData);
result.turbulence = turbulenceAnalyzer.analyze();
}

if (options.includePressure) {
const pressureCalculator = new PressureGradientCalculator(this.flowData);
result.pressure = pressureCalculator.calculate();
}

if (options.includeVorticity) {
const vorticityCalculator = new VorticityCalculator(this.flowData);
result.vorticity = vorticityCalculator.calculate();
}

if (options.includeHemodynamic) {
const hemodynamicCalculator = new HemodynamicIndexCalculator(this.flowData);
result.hemodynamicIndices = hemodynamicCalculator.calculate();
}

return result;
}

exportResults(result: AnalysisResult, format: 'json' | 'csv' = 'json'): string {
if (format === 'json') {
return JSON.stringify(result, null, 2);
}

let csv = 'Metric,Value\n';
csv += `Max WSS,${result.wallShearStress.maxWSS}\n`;
csv += `Min WSS,${result.wallShearStress.minWSS}\n`;
csv += `Avg WSS,${result.wallShearStress.averageWSS}\n`;
csv += `Reynolds Number,${result.flowMetrics.reynoldsNumber}\n`;
csv += `Flow Rate,${result.flowMetrics.flowRate}\n`;

if (result.turbulence) {
csv += `Kolmogorov Scale,${result.turbulence.kolmogorovScale}\n`;
}

if (result.pressure) {
csv += `Max Pressure,${result.pressure.maxPressure}\n`;
csv += `Min Pressure,${result.pressure.minPressure}\n`;
csv += `Pressure Drop,${result.pressure.pressureDrop}\n`;
}

if (result.vorticity) {
csv += `Max Vorticity,${result.vorticity.maxVorticity}\n`;
csv += `Vortex Cores Count,${result.vorticity.vortexCores.length}\n`;
}

return csv;
}
}

export * from './types';
export { FlowAnalyzer } from './flow-analyzer';
export { VelocityCalculator } from './velocity-calculator';
export { WallShearStressCalculator } from './wall-shear-stress';
export { FlowMetricsCalculator } from './flow-metrics';
export { TurbulenceAnalyzer } from './turbulence-analyzer';
export { PressureGradientCalculator } from './pressure-gradient';
export { VorticityCalculator } from './vorticity-calculator';
export { HemodynamicIndexCalculator } from './hemodynamic-indices';
