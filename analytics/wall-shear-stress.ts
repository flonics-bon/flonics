export class WallShearStress {
  private viscosity: number = 0.004; // Pa·s for blood

  calculate(velocity: Float32Array, distance: number): number {
    if (distance === 0) return 0;
    
    const velocityGradient = velocity[0] / distance;
    return this.viscosity * velocityGradient;
  }

  calculateWSS(velocityField: Float32Array, wallNormals: Float32Array): Float32Array {
    const wssValues = new Float32Array(wallNormals.length / 3);
    
    for (let i = 0; i < wssValues.length; i++) {
      const idx = i * 3;
      const vx = velocityField[idx];
      const vy = velocityField[idx + 1];
      const vz = velocityField[idx + 2];
      
      const nx = wallNormals[idx];
      const ny = wallNormals[idx + 1];
      const nz = wallNormals[idx + 2];
      
      const tangentialVelocity = Math.sqrt(vx * vx + vy * vy + vz * vz);
      wssValues[i] = this.viscosity * tangentialVelocity / 0.001;
    }
    
    return wssValues;
  }
}