/**
 * Vector Math Utilities for 4D Flow MRI Visualization
 * Provides common vector operations for velocity field calculations
 */

export class VectorMath {
  /**
   * Calculate magnitude of a 3D vector
   * @param {number} x - X component
   * @param {number} y - Y component
   * @param {number} z - Z component
   * @returns {number} Vector magnitude
   */
  static magnitude(x, y, z) {
    return Math.sqrt(x * x + y * y + z * z);
  }

  /**
   * Normalize a 3D vector
   * @param {number} x - X component
   * @param {number} y - Y component
   * @param {number} z - Z component
   * @returns {Object} Normalized vector {x, y, z}
   */
  static normalize(x, y, z) {
    const mag = this.magnitude(x, y, z);
    if (mag === 0) return { x: 0, y: 0, z: 0 };
    return {
      x: x / mag,
      y: y / mag,
      z: z / mag
    };
  }

  /**
   * Calculate dot product of two 3D vectors
   * @param {Object} v1 - First vector {x, y, z}
   * @param {Object} v2 - Second vector {x, y, z}
   * @returns {number} Dot product
   */
  static dot(v1, v2) {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  /**
   * Calculate cross product of two 3D vectors
   * @param {Object} v1 - First vector {x, y, z}
   * @param {Object} v2 - Second vector {x, y, z}
   * @returns {Object} Cross product vector {x, y, z}
   */
  static cross(v1, v2) {
    return {
      x: v1.y * v2.z - v1.z * v2.y,
      y: v1.z * v2.x - v1.x * v2.z,
      z: v1.x * v2.y - v1.y * v2.x
    };
  }

  /**
   * Calculate distance between two 3D points
   * @param {Object} p1 - First point {x, y, z}
   * @param {Object} p2 - Second point {x, y, z}
   * @returns {number} Distance
   */
  static distance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Linear interpolation between two vectors
   * @param {Object} v1 - Start vector {x, y, z}
   * @param {Object} v2 - End vector {x, y, z}
   * @param {number} t - Interpolation factor [0, 1]
   * @returns {Object} Interpolated vector {x, y, z}
   */
  static lerp(v1, v2, t) {
    return {
      x: v1.x + (v2.x - v1.x) * t,
      y: v1.y + (v2.y - v1.y) * t,
      z: v1.z + (v2.z - v1.z) * t
    };
  }

  /**
   * Calculate velocity magnitude from flow components
   * Useful for 4D Flow MRI data processing
   * @param {Float32Array} velocityData - Array containing [vx, vy, vz] components
   * @param {number} index - Starting index in the array
   * @returns {number} Velocity magnitude
   */
  static velocityMagnitude(velocityData, index) {
    const vx = velocityData[index];
    const vy = velocityData[index + 1];
    const vz = velocityData[index + 2];
    return this.magnitude(vx, vy, vz);
  }
}
