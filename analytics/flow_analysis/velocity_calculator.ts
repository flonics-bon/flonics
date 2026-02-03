/**
 * 4D Flow MRI Velocity Calculator
 * Calculates velocity vectors and magnitude from 4D flow data
 */

export interface VelocityVector {
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

export interface FlowDataPoint {
  position: [number, number, number];
  velocity: VelocityVector;
  timeFrame: number;
}

export class VelocityCalculator {
  /**
   * Calculate velocity magnitude from velocity components
   */
  static calculateMagnitude(vx: number, vy: number, vz: number): number {
    return Math.sqrt(vx * vx + vy * vy + vz * vz);
  }

  /**
   * Normalize velocity vector
   */
  static normalizeVelocity(velocity: VelocityVector): VelocityVector {
    const mag = velocity.magnitude;
    if (mag === 0) {
      return { x: 0, y: 0, z: 0, magnitude: 0 };
    }
    return {
      x: velocity.x / mag,
      y: velocity.y / mag,
      z: velocity.z / mag,
      magnitude: 1
    };
  }

  /**
   * Calculate mean velocity from flow data points
   */
  static calculateMeanVelocity(dataPoints: FlowDataPoint[]): VelocityVector {
    if (dataPoints.length === 0) {
      return { x: 0, y: 0, z: 0, magnitude: 0 };
    }

    const sum = dataPoints.reduce(
      (acc, point) => ({
        x: acc.x + point.velocity.x,
        y: acc.y + point.velocity.y,
        z: acc.z + point.velocity.z
      }),
      { x: 0, y: 0, z: 0 }
    );

    const count = dataPoints.length;
    const meanX = sum.x / count;
    const meanY = sum.y / count;
    const meanZ = sum.z / count;

    return {
      x: meanX,
      y: meanY,
      z: meanZ,
      magnitude: this.calculateMagnitude(meanX, meanY, meanZ)
    };
  }

  /**
   * Filter flow data by velocity threshold
   */
  static filterByVelocityThreshold(
    dataPoints: FlowDataPoint[],
    minThreshold: number,
    maxThreshold: number = Infinity
  ): FlowDataPoint[] {
    return dataPoints.filter(
      point => point.velocity.magnitude >= minThreshold &&
               point.velocity.magnitude <= maxThreshold
    );
  }

  /**
   * Calculate flow rate through a cross-sectional area
   */
  static calculateFlowRate(
    dataPoints: FlowDataPoint[],
    normalVector: [number, number, number],
    voxelSize: number
  ): number {
    const [nx, ny, nz] = normalVector;
    const normMag = Math.sqrt(nx * nx + ny * ny + nz * nz);
    
    if (normMag === 0) return 0;

    const flowRate = dataPoints.reduce((acc, point) => {
      const dotProduct = 
        (point.velocity.x * nx +
         point.velocity.y * ny +
         point.velocity.z * nz) / normMag;
      return acc + dotProduct;
    }, 0);

    return flowRate * voxelSize * voxelSize;
  }
}