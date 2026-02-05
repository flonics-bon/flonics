// 4D Flow MRI Analysis Module
// Updated: Enhanced flow velocity calculation

export interface FlowMetrics {
  velocity: number;
  direction: [number, number, number];
  magnitude: number;
  timestamp: number;
}

export class FlowAnalyzer {
  private data: Float32Array;
  
  constructor(flowData: Float32Array) {
    this.data = flowData;
  }
  
  // Calculate peak velocity with improved accuracy
  calculatePeakVelocity(): number {
    let maxVel = 0;
    for (let i = 0; i < this.data.length; i += 3) {
      const vel = Math.sqrt(
        this.data[i] ** 2 + 
        this.data[i + 1] ** 2 + 
        this.data[i + 2] ** 2
      );
      maxVel = Math.max(maxVel, vel);
    }
    return maxVel;
  }
  
  // Get flow metrics at specific point
  getMetricsAtPoint(x: number, y: number, z: number, t: number): FlowMetrics {
    const idx = (x + y * 100 + z * 10000 + t * 1000000) * 3;
    return {
      velocity: Math.sqrt(
        this.data[idx] ** 2 + 
        this.data[idx + 1] ** 2 + 
        this.data[idx + 2] ** 2
      ),
      direction: [this.data[idx], this.data[idx + 1], this.data[idx + 2]],
      magnitude: this.data[idx],
      timestamp: t
    };
  }
}
