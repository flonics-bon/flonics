/**
 * 4D Flow MRI Calculations Utility
 * Provides common calculations for flow velocity and magnitude
 */

export class FlowCalculations {
  /**
   * Calculate flow magnitude from velocity components
   * @param {number} vx - Velocity in x direction
   * @param {number} vy - Velocity in y direction
   * @param {number} vz - Velocity in z direction
   * @returns {number} Flow magnitude
   */
  static calculateMagnitude(vx, vy, vz) {
    return Math.sqrt(vx * vx + vy * vy + vz * vz);
  }

  /**
   * Normalize velocity vector
   * @param {Float32Array} velocity - Velocity components [vx, vy, vz]
   * @returns {Float32Array} Normalized velocity vector
   */
  static normalizeVelocity(velocity) {
    const magnitude = this.calculateMagnitude(velocity[0], velocity[1], velocity[2]);
    if (magnitude === 0) return new Float32Array([0, 0, 0]);
    
    return new Float32Array([
      velocity[0] / magnitude,
      velocity[1] / magnitude,
      velocity[2] / magnitude
    ]);
  }

  /**
   * Calculate wall shear stress (WSS)
   * @param {number} viscosity - Blood viscosity
   * @param {number} velocityGradient - Velocity gradient at wall
   * @returns {number} Wall shear stress
   */
  static calculateWSS(viscosity, velocityGradient) {
    return viscosity * velocityGradient;
  }

  /**
   * Interpolate velocity at a point using trilinear interpolation
   * @param {Object} point - Point coordinates {x, y, z}
   * @param {Float32Array} volumeData - Volume data
   * @param {Object} dimensions - Volume dimensions {width, height, depth}
   * @returns {Float32Array} Interpolated velocity [vx, vy, vz]
   */
  static interpolateVelocity(point, volumeData, dimensions) {
    const { x, y, z } = point;
    const { width, height, depth } = dimensions;
    
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    
    const x1 = Math.min(x0 + 1, width - 1);
    const y1 = Math.min(y0 + 1, height - 1);
    const z1 = Math.min(z0 + 1, depth - 1);
    
    const xd = x - x0;
    const yd = y - y0;
    const zd = z - z0;
    
    // Trilinear interpolation
    const result = new Float32Array(3);
    
    for (let component = 0; component < 3; component++) {
      const c000 = this.getVoxelValue(volumeData, x0, y0, z0, component, dimensions);
      const c001 = this.getVoxelValue(volumeData, x0, y0, z1, component, dimensions);
      const c010 = this.getVoxelValue(volumeData, x0, y1, z0, component, dimensions);
      const c011 = this.getVoxelValue(volumeData, x0, y1, z1, component, dimensions);
      const c100 = this.getVoxelValue(volumeData, x1, y0, z0, component, dimensions);
      const c101 = this.getVoxelValue(volumeData, x1, y0, z1, component, dimensions);
      const c110 = this.getVoxelValue(volumeData, x1, y1, z0, component, dimensions);
      const c111 = this.getVoxelValue(volumeData, x1, y1, z1, component, dimensions);
      
      const c00 = c000 * (1 - xd) + c100 * xd;
      const c01 = c001 * (1 - xd) + c101 * xd;
      const c10 = c010 * (1 - xd) + c110 * xd;
      const c11 = c011 * (1 - xd) + c111 * xd;
      
      const c0 = c00 * (1 - yd) + c10 * yd;
      const c1 = c01 * (1 - yd) + c11 * yd;
      
      result[component] = c0 * (1 - zd) + c1 * zd;
    }
    
    return result;
  }

  /**
   * Get voxel value from volume data
   * @private
   */
  static getVoxelValue(volumeData, x, y, z, component, dimensions) {
    const { width, height, depth } = dimensions;
    const index = (z * width * height + y * width + x) * 3 + component;
    return volumeData[index] || 0;
  }
}
