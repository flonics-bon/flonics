import { ProcessedFlowData, FlowMetrics } from '../types/flow-types';

export class MetricsCalculator {
  calculate(data: ProcessedFlowData): FlowMetrics {
    return {
      peakVelocity: this.getPeakVelocity(data.magnitudes),
      meanVelocity: this.getMeanVelocity(data.magnitudes),
      flowVolume: this.calculateFlowVolume(data.magnitudes),
      velocityStd: this.calculateStandardDeviation(data.magnitudes),
      reynoldsNumber: this.estimateReynoldsNumber(data.magnitudes),
      wallShearStress: this.estimateWallShearStress(data.magnitudes)
    };
  }

  private getPeakVelocity(magnitudes: number[]): number {
    return Math.max(...magnitudes);
  }

  private getMeanVelocity(magnitudes: number[]): number {
    return magnitudes.reduce((a, b) => a + b, 0) / magnitudes.length;
  }

  private calculateFlowVolume(magnitudes: number[]): number {
    return magnitudes.reduce((a, b) => a + b, 0);
  }

  private calculateStandardDeviation(magnitudes: number[]): number {
    const mean = this.getMeanVelocity(magnitudes);
    const variance = magnitudes.reduce((sum, v) => sum + (v - mean) ** 2, 0) / magnitudes.length;
    return Math.sqrt(variance);
  }

  private estimateReynoldsNumber(magnitudes: number[]): number {
    const meanVel = this.getMeanVelocity(magnitudes);
    const characteristicLength = 0.01;
    const kinematicViscosity = 0.000004;
    return (meanVel * characteristicLength) / kinematicViscosity;
  }

  private estimateWallShearStress(magnitudes: number[]): number {
    const maxVel = this.getPeakVelocity(magnitudes);
    const density = 1060;
    const viscosity = 0.004;
    return viscosity * maxVel * 0.1;
  }

  calculateTemporalMetrics(timeSeriesData: ProcessedFlowData[]): any {
    const peakVelocities = timeSeriesData.map(d => this.getPeakVelocity(d.magnitudes));
    
    return {
      maxPeak: Math.max(...peakVelocities),
      minPeak: Math.min(...peakVelocities),
      avgPeak: peakVelocities.reduce((a, b) => a + b, 0) / peakVelocities.length,
      peakVariation: this.calculateStandardDeviation(peakVelocities)
    };
  }
}