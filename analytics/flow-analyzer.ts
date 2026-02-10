export interface FlowData {
  velocity: number[][][][];
  dimensions: { x: number; y: number; z: number; t: number };
  spacing?: { x: number; y: number; z: number };
}

export interface FlowMetrics {
  magnitude: number[][][];
  divergence: number[][][];
  vorticity: number[][][];
  wss: number[][][];
  stats: {
    mean_velocity: number;
    max_velocity: number;
    mean_vorticity: number;
    max_wss: number;
  };
}

export class FlowAnalyzer {
  private data: FlowData;

  constructor(data: FlowData) {
    this.data = data;
  }

  public async analyze(): Promise<FlowMetrics> {
    const { velocity, dimensions } = this.data;
    const { x, y, z, t } = dimensions;

    const magnitude: number[][][] = [];
    const divergence: number[][][] = [];
    const vorticity: number[][][] = [];
    const wss: number[][][] = [];

    for (let i = 0; i < x; i++) {
      magnitude[i] = [];
      divergence[i] = [];
      vorticity[i] = [];
      wss[i] = [];
      for (let j = 0; j < y; j++) {
        magnitude[i][j] = [];
        divergence[i][j] = [];
        vorticity[i][j] = [];
        wss[i][j] = [];
        for (let k = 0; k < z; k++) {
          const vx = velocity[i]?.[j]?.[k]?.[0] || 0;
          const vy = velocity[i]?.[j]?.[k]?.[1] || 0;
          const vz = velocity[i]?.[j]?.[k]?.[2] || 0;

          magnitude[i][j][k] = Math.sqrt(vx * vx + vy * vy + vz * vz);

          const dvx_dx = this.gradient(velocity, i, j, k, 0, 'x');
          const dvy_dy = this.gradient(velocity, i, j, k, 1, 'y');
          const dvz_dz = this.gradient(velocity, i, j, k, 2, 'z');
          divergence[i][j][k] = dvx_dx + dvy_dy + dvz_dz;

          const dvz_dy = this.gradient(velocity, i, j, k, 2, 'y');
          const dvy_dz = this.gradient(velocity, i, j, k, 1, 'z');
          const dvx_dz = this.gradient(velocity, i, j, k, 0, 'z');
          const dvz_dx = this.gradient(velocity, i, j, k, 2, 'x');
          const dvy_dx = this.gradient(velocity, i, j, k, 1, 'x');
          const dvx_dy = this.gradient(velocity, i, j, k, 0, 'y');

          const vort_x = dvz_dy - dvy_dz;
          const vort_y = dvx_dz - dvz_dx;
          const vort_z = dvy_dx - dvx_dy;
          vorticity[i][j][k] = Math.sqrt(vort_x * vort_x + vort_y * vort_y + vort_z * vort_z);

          const mu = 0.004;
          const shear_rate = Math.sqrt(
            2 * (dvx_dx * dvx_dx + dvy_dy * dvy_dy + dvz_dz * dvz_dz +
              0.5 * ((dvy_dx + dvx_dy) ** 2 + (dvz_dx + dvx_dz) ** 2 + (dvy_dz + dvz_dy) ** 2))
          );
          wss[i][j][k] = mu * shear_rate;
        }
      }
    }

    const flatMag = magnitude.flat(2);
    const flatVort = vorticity.flat(2);
    const flatWss = wss.flat(2);

    return {
      magnitude,
      divergence,
      vorticity,
      wss,
      stats: {
        mean_velocity: flatMag.reduce((a, b) => a + b, 0) / flatMag.length,
        max_velocity: Math.max(...flatMag),
        mean_vorticity: flatVort.reduce((a, b) => a + b, 0) / flatVort.length,
        max_wss: Math.max(...flatWss)
      }
    };
  }

  private gradient(vel: number[][][][], i: number, j: number, k: number, comp: number, dir: 'x' | 'y' | 'z'): number {
    const { x, y, z } = this.data.dimensions;
    const spacing = this.data.spacing || { x: 1, y: 1, z: 1 };

    let v1 = 0, v2 = 0, delta = 1;

    if (dir === 'x') {
      v1 = vel[Math.max(i - 1, 0)]?.[j]?.[k]?.[comp] || 0;
      v2 = vel[Math.min(i + 1, x - 1)]?.[j]?.[k]?.[comp] || 0;
      delta = spacing.x;
    } else if (dir === 'y') {
      v1 = vel[i]?.[Math.max(j - 1, 0)]?.[k]?.[comp] || 0;
      v2 = vel[i]?.[Math.min(j + 1, y - 1)]?.[k]?.[comp] || 0;
      delta = spacing.y;
    } else {
      v1 = vel[i]?.[j]?.[Math.max(k - 1, 0)]?.[comp] || 0;
      v2 = vel[i]?.[j]?.[Math.min(k + 1, z - 1)]?.[comp] || 0;
      delta = spacing.z;
    }

    return (v2 - v1) / (2 * delta);
  }
}