import { FlowData, MetricsResult } from './types';

export class FlowMetrics {
  calculateVolumetricFlow(velocity: Float32Array, area: number): number {
    const meanVelocity = velocity.reduce((a, b) => a + b, 0) / velocity.length;
    return meanVelocity * area;
  }

  calculateReynoldsNumber(velocity: number, diameter: number, density: number = 1060, viscosity: number = 0.004): number {
    return (density * velocity * diameter) / viscosity;
  }

  calculatePulsatilityIndex(peakVelocity: number, minVelocity: number, meanVelocity: number): number {
    if (meanVelocity === 0) return 0;
    return (peakVelocity - minVelocity) / meanVelocity;
  }

  calculateResistanceIndex(peakVelocity: number, minVelocity: number): number {
    if (peakVelocity === 0) return 0;
    return (peakVelocity - minVelocity) / peakVelocity;
  }

  getStatistics(data: Float32Array): { mean: number; std: number; min: number; max: number } {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    return { mean, std, min, max };
  }
}