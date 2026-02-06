// Flow Metrics Calculation
// Updated: Added new hemodynamic metrics

export interface HemodynamicMetrics {
  meanVelocity: number;
  peakVelocity: number;
  flowRate: number;
  wallShearStress: number;
  vorticityMagnitude: number;
}

export class MetricsCalculator {
  // Calculate comprehensive hemodynamic metrics
  static calculateMetrics(flowData: Float32Array): HemodynamicMetrics {
    return {
      meanVelocity: this.calculateMeanVelocity(flowData),
      peakVelocity: this.calculatePeakVelocity(flowData),
      flowRate: this.calculateFlowRate(flowData),
      wallShearStress: this.calculateWSS(flowData),
      vorticityMagnitude: this.calculateVorticity(flowData)
    };
  }
  
  private static calculateMeanVelocity(data: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < data.length; i += 3) {
      sum += Math.sqrt(data[i] ** 2 + data[i + 1] ** 2 + data[i + 2] ** 2);
    }
    return sum / (data.length / 3);
  }
  
  private static calculatePeakVelocity(data: Float32Array): number {
    let max = 0;
    for (let i = 0; i < data.length; i += 3) {
      const vel = Math.sqrt(data[i] ** 2 + data[i + 1] ** 2 + data[i + 2] ** 2);
      max = Math.max(max, vel);
    }
    return max;
  }
  
  private static calculateFlowRate(data: Float32Array): number {
    const meanVel = this.calculateMeanVelocity(data);
    const area = 1.0; // Placeholder for cross-sectional area
    return meanVel * area;
  }
  
  private static calculateWSS(data: Float32Array): number {
    // Simplified WSS calculation
    const viscosity = 0.004; // Blood viscosity (Pa·s)
    const gradient = this.calculateVelocityGradient(data);
    return viscosity * gradient;
  }
  
  private static calculateVorticity(data: Float32Array): number {
    // Simplified vorticity magnitude
    let vorticity = 0;
    for (let i = 0; i < Math.min(data.length - 6, 1000); i += 3) {
      const dvx = data[i + 3] - data[i];
      const dvy = data[i + 4] - data[i + 1];
      vorticity += Math.sqrt(dvx ** 2 + dvy ** 2);
    }
    return vorticity / 1000;
  }
  
  private static calculateVelocityGradient(data: Float32Array): number {
    let gradient = 0;
    for (let i = 0; i < Math.min(data.length - 3, 1000); i += 3) {
      gradient += Math.abs(data[i + 3] - data[i]);
    }
    return gradient / 1000;
  }
}
