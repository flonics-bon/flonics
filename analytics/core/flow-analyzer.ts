import { ProcessedFlowData, FlowAnalysisResult, VelocityVector } from '../types/flow-types';

export class FlowAnalyzer {
  analyze(data: ProcessedFlowData): FlowAnalysisResult {
    const meanVelocity = this.calculateMean(data.magnitudes);
    const maxVelocity = Math.max(...data.magnitudes);
    const turbulenceIndex = this.calculateTurbulence(data.magnitudes);
    const flowPattern = this.classifyFlowPattern(turbulenceIndex);
    const vorticity = this.calculateVorticity(data.vectors);
    
    return {
      meanVelocity,
      maxVelocity,
      turbulenceIndex,
      flowPattern,
      vorticity,
      timestamp: data.timestamp
    };
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateTurbulence(magnitudes: number[]): number {
    const mean = this.calculateMean(magnitudes);
    const variance = magnitudes.reduce((sum, v) => sum + (v - mean) ** 2, 0) / magnitudes.length;
    return Math.sqrt(variance);
  }

  private classifyFlowPattern(turbulence: number): 'laminar' | 'transitional' | 'turbulent' {
    if (turbulence < 0.3) return 'laminar';
    if (turbulence < 0.6) return 'transitional';
    return 'turbulent';
  }

  private calculateVorticity(vectors: VelocityVector[]): number {
    if (vectors.length < 2) return 0;
    
    let totalVorticity = 0;
    for (let i = 1; i < vectors.length; i++) {
      const curl = this.crossProduct(vectors[i - 1], vectors[i]);
      totalVorticity += Math.sqrt(curl.x ** 2 + curl.y ** 2 + curl.z ** 2);
    }
    
    return totalVorticity / vectors.length;
  }

  private crossProduct(a: VelocityVector, b: VelocityVector): VelocityVector {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x
    };
  }

  detectAnomalies(data: ProcessedFlowData, threshold: number): number[] {
    const mean = this.calculateMean(data.magnitudes);
    const std = this.calculateTurbulence(data.magnitudes);
    
    return data.magnitudes
      .map((v, idx) => ({ v, idx }))
      .filter(({ v }) => Math.abs(v - mean) > threshold * std)
      .map(({ idx }) => idx);
  }
}