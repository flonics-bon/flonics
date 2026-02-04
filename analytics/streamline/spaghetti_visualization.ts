/**
 * Spaghetti Visualization for 4D Flow MRI
 * 
 * This module provides streamline visualization that resembles spaghetti strands,
 * representing blood flow paths in 4D Flow MRI data using WebGPU.
 */

import { vec3, mat4 } from 'gl-matrix';

/**
 * Configuration for spaghetti streamline visualization
 */
export interface SpaghettiConfig {
  seedPoints: vec3[];
  stepSize: number;
  maxSteps: number;
  tubeRadius: number;
  colorMode: 'velocity' | 'direction' | 'time';
  minVelocity: number;
}

/**
 * Represents a single streamline path
 */
export interface Streamline {
  points: vec3[];
  velocities: number[];
  directions: vec3[];
}

/**
 * Main class for generating and rendering spaghetti-like streamlines
 */
export class SpaghettiVisualizer {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline | null = null;
  private vertexBuffer: GPUBuffer | null = null;
  private indexBuffer: GPUBuffer | null = null;
  private uniformBuffer: GPUBuffer | null = null;
  private bindGroup: GPUBindGroup | null = null;
  
  constructor(device: GPUDevice) {
    this.device = device;
  }

  /**
   * Generate streamlines from velocity field data
   */
  public generateStreamlines(
    velocityField: Float32Array,
    dimensions: [number, number, number],
    config: SpaghettiConfig
  ): Streamline[] {
    const streamlines: Streamline[] = [];
    
    for (const seedPoint of config.seedPoints) {
      const streamline = this.traceStreamline(
        seedPoint,
        velocityField,
        dimensions,
        config
      );
      
      if (streamline.points.length > 2) {
        streamlines.push(streamline);
      }
    }
    
    return streamlines;
  }

  /**
   * Trace a single streamline using 4th order Runge-Kutta integration
   */
  private traceStreamline(
    seedPoint: vec3,
    velocityField: Float32Array,
    dimensions: [number, number, number],
    config: SpaghettiConfig
  ): Streamline {
    const points: vec3[] = [];
    const velocities: number[] = [];
    const directions: vec3[] = [];
    
    let currentPoint = vec3.clone(seedPoint);
    
    for (let step = 0; step < config.maxSteps; step++) {
      const velocity = this.sampleVelocity(currentPoint, velocityField, dimensions);
      const speed = vec3.length(velocity);
      
      if (speed < config.minVelocity) {
        break;
      }
      
      points.push(vec3.clone(currentPoint));
      velocities.push(speed);
      directions.push(vec3.normalize(vec3.create(), velocity));
      
      // RK4 integration
      const k1 = this.sampleVelocity(currentPoint, velocityField, dimensions);
      
      const temp2 = vec3.create();
      vec3.scaleAndAdd(temp2, currentPoint, k1, config.stepSize * 0.5);
      const k2 = this.sampleVelocity(temp2, velocityField, dimensions);
      
      const temp3 = vec3.create();
      vec3.scaleAndAdd(temp3, currentPoint, k2, config.stepSize * 0.5);
      const k3 = this.sampleVelocity(temp3, velocityField, dimensions);
      
      const temp4 = vec3.create();
      vec3.scaleAndAdd(temp4, currentPoint, k3, config.stepSize);
      const k4 = this.sampleVelocity(temp4, velocityField, dimensions);
      
      const delta = vec3.create();
      vec3.add(delta, k1, k2);
      vec3.scale(k2, k2, 2.0);
      vec3.add(delta, delta, k2);
      vec3.scale(k3, k3, 2.0);
      vec3.add(delta, delta, k3);
      vec3.add(delta, delta, k4);
      vec3.scale(delta, delta, config.stepSize / 6.0);
      
      vec3.add(currentPoint, currentPoint, delta);
      
      // Check bounds
      if (!this.isInBounds(currentPoint, dimensions)) {
        break;
      }
    }
    
    return { points, velocities, directions };
  }

  /**
   * Sample velocity at a given point using trilinear interpolation
   */
  private sampleVelocity(
    point: vec3,
    velocityField: Float32Array,
    dimensions: [number, number, number]
  ): vec3 {
    const [nx, ny, nz] = dimensions;
    
    const x = Math.max(0, Math.min(point[0], nx - 1.001));
    const y = Math.max(0, Math.min(point[1], ny - 1.001));
    const z = Math.max(0, Math.min(point[2], nz - 1.001));
    
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const z0 = Math.floor(z);
    const x1 = Math.min(x0 + 1, nx - 1);
    const y1 = Math.min(y0 + 1, ny - 1);
    const z1 = Math.min(z0 + 1, nz - 1);
    
    const fx = x - x0;
    const fy = y - y0;
    const fz = z - z0;
    
    const result = vec3.create();
    
    for (let c = 0; c < 3; c++) {
      const v000 = velocityField[(z0 * ny * nx + y0 * nx + x0) * 3 + c];
      const v001 = velocityField[(z0 * ny * nx + y0 * nx + x1) * 3 + c];
      const v010 = velocityField[(z0 * ny * nx + y1 * nx + x0) * 3 + c];
      const v011 = velocityField[(z0 * ny * nx + y1 * nx + x1) * 3 + c];
      const v100 = velocityField[(z1 * ny * nx + y0 * nx + x0) * 3 + c];
      const v101 = velocityField[(z1 * ny * nx + y0 * nx + x1) * 3 + c];
      const v110 = velocityField[(z1 * ny * nx + y1 * nx + x0) * 3 + c];
      const v111 = velocityField[(z1 * ny * nx + y1 * nx + x1) * 3 + c];
      
      const v00 = v000 * (1 - fx) + v001 * fx;
      const v01 = v010 * (1 - fx) + v011 * fx;
      const v10 = v100 * (1 - fx) + v101 * fx;
      const v11 = v110 * (1 - fx) + v111 * fx;
      
      const v0 = v00 * (1 - fy) + v01 * fy;
      const v1 = v10 * (1 - fy) + v11 * fy;
      
      result[c] = v0 * (1 - fz) + v1 * fz;
    }
    
    return result;
  }

  /**
   * Check if point is within volume bounds
   */
  private isInBounds(point: vec3, dimensions: [number, number, number]): boolean {
    return (
      point[0] >= 0 && point[0] < dimensions[0] &&
      point[1] >= 0 && point[1] < dimensions[1] &&
      point[2] >= 0 && point[2] < dimensions[2]
    );
  }

  /**
   * Generate tube geometry around streamlines for spaghetti appearance
   */
  public generateTubeGeometry(
    streamlines: Streamline[],
    tubeRadius: number,
    radialSegments: number = 8
  ): { vertices: Float32Array; indices: Uint32Array; colors: Float32Array } {
    const vertices: number[] = [];
    const indices: number[] = [];
    const colors: number[] = [];
    
    let vertexOffset = 0;
    
    for (const streamline of streamlines) {
      const { points, velocities } = streamline;
      
      if (points.length < 2) continue;
      
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const tangent = this.computeTangent(points, i);
        const normal = this.computeNormal(tangent);
        const binormal = vec3.cross(vec3.create(), tangent, normal);
        
        // Generate ring of vertices
        for (let j = 0; j < radialSegments; j++) {
          const angle = (j / radialSegments) * Math.PI * 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          
          const offset = vec3.create();
          vec3.scaleAndAdd(offset, offset, normal, cos * tubeRadius);
          vec3.scaleAndAdd(offset, offset, binormal, sin * tubeRadius);
          
          const vertex = vec3.add(vec3.create(), point, offset);
          vertices.push(vertex[0], vertex[1], vertex[2]);
          
          // Color based on velocity
          const color = this.velocityToColor(velocities[i]);
          colors.push(color[0], color[1], color[2], 1.0);
        }
        
        // Generate indices for tube segments
        if (i < points.length - 1) {
          for (let j = 0; j < radialSegments; j++) {
            const current = vertexOffset + i * radialSegments + j;
            const next = vertexOffset + (i + 1) * radialSegments + j;
            const currentNext = vertexOffset + i * radialSegments + ((j + 1) % radialSegments);
            const nextNext = vertexOffset + (i + 1) * radialSegments + ((j + 1) % radialSegments);
            
            indices.push(current, next, currentNext);
            indices.push(currentNext, next, nextNext);
          }
        }
      }
      
      vertexOffset += points.length * radialSegments;
    }
    
    return {
      vertices: new Float32Array(vertices),
      indices: new Uint32Array(indices),
      colors: new Float32Array(colors)
    };
  }

  /**
   * Compute tangent vector at a point along the streamline
   */
  private computeTangent(points: vec3[], index: number): vec3 {
    if (index === 0) {
      return vec3.normalize(vec3.create(), vec3.sub(vec3.create(), points[1], points[0]));
    } else if (index === points.length - 1) {
      return vec3.normalize(vec3.create(), vec3.sub(vec3.create(), points[index], points[index - 1]));
    } else {
      const tangent = vec3.sub(vec3.create(), points[index + 1], points[index - 1]);
      return vec3.normalize(vec3.create(), tangent);
    }
  }

  /**
   * Compute a normal vector perpendicular to tangent
   */
  private computeNormal(tangent: vec3): vec3 {
    const up = vec3.fromValues(0, 1, 0);
    let normal = vec3.cross(vec3.create(), tangent, up);
    
    if (vec3.length(normal) < 0.001) {
      const right = vec3.fromValues(1, 0, 0);
      normal = vec3.cross(vec3.create(), tangent, right);
    }
    
    return vec3.normalize(vec3.create(), normal);
  }

  /**
   * Convert velocity magnitude to color (rainbow colormap)
   */
  private velocityToColor(velocity: number, maxVelocity: number = 1.0): vec3 {
    const normalized = Math.min(velocity / maxVelocity, 1.0);
    const hue = (1.0 - normalized) * 240.0; // Blue to red
    
    return this.hsvToRgb(hue, 1.0, 1.0);
  }

  /**
   * Convert HSV to RGB color space
   */
  private hsvToRgb(h: number, s: number, v: number): vec3 {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    
    let r = 0, g = 0, b = 0;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    return vec3.fromValues(r + m, g + m, b + m);
  }

  /**
   * Initialize WebGPU rendering pipeline
   */
  public async initializePipeline(format: GPUTextureFormat): Promise<void> {
    const shaderModule = this.device.createShaderModule({
      code: this.getShaderCode()
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [this.createBindGroupLayout()]
    });

    this.pipeline = this.device.createRenderPipeline({
      layout: pipelineLayout,
      vertex: {
        module: shaderModule,
        entryPoint: 'vertexMain',
        buffers: [
          {
            arrayStride: 12,
            attributes: [{ shaderLocation: 0, offset: 0, format: 'float32x3' }]
          },
          {
            arrayStride: 16,
            attributes: [{ shaderLocation: 1, offset: 0, format: 'float32x4' }]
          }
        ]
      },
      fragment: {
        module: shaderModule,
        entryPoint: 'fragmentMain',
        targets: [{ format }]
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back'
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus'
      }
    });
  }

  /**
   * Create bind group layout for uniforms
   */
  private createBindGroupLayout(): GPUBindGroupLayout {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: 'uniform' }
        }
      ]
    });
  }

  /**
   * Get WGSL shader code for rendering
   */
  private getShaderCode(): string {
    return `
      struct Uniforms {
        modelViewProjection: mat4x4<f32>,
      };
      
      @group(0) @binding(0) var<uniform> uniforms: Uniforms;
      
      struct VertexInput {
        @location(0) position: vec3<f32>,
        @location(1) color: vec4<f32>,
      };
      
      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) color: vec4<f32>,
      };
      
      @vertex
      fn vertexMain(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        output.position = uniforms.modelViewProjection * vec4<f32>(input.position, 1.0);
        output.color = input.color;
        return output;
      }
      
      @fragment
      fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
        return input.color;
      }
    `;
  }

  /**
   * Render streamlines
   */
  public render(
    passEncoder: GPURenderPassEncoder,
    viewProjectionMatrix: mat4
  ): void {
    if (!this.pipeline || !this.vertexBuffer || !this.indexBuffer) {
      return;
    }

    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup!);
    passEncoder.setVertexBuffer(0, this.vertexBuffer);
    passEncoder.setIndexBuffer(this.indexBuffer, 'uint32');
    passEncoder.drawIndexed(this.indexBuffer.size / 4);
  }

  /**
   * Clean up GPU resources
   */
  public destroy(): void {
    this.vertexBuffer?.destroy();
    this.indexBuffer?.destroy();
    this.uniformBuffer?.destroy();
  }
}

/**
 * Utility function to generate seed points in a regular grid
 */
export function generateGridSeedPoints(
  bounds: { min: vec3; max: vec3 },
  spacing: number
): vec3[] {
  const seedPoints: vec3[] = [];
  
  for (let x = bounds.min[0]; x <= bounds.max[0]; x += spacing) {
    for (let y = bounds.min[1]; y <= bounds.max[1]; y += spacing) {
      for (let z = bounds.min[2]; z <= bounds.max[2]; z += spacing) {
        seedPoints.push(vec3.fromValues(x, y, z));
      }
    }
  }
  
  return seedPoints;
}

/**
 * Utility function to generate seed points on a plane
 */
export function generatePlaneSeedPoints(
  center: vec3,
  normal: vec3,
  size: number,
  density: number
): vec3[] {
  const seedPoints: vec3[] = [];
  const tangent = vec3.create();
  const binormal = vec3.create();
  
  // Create orthogonal basis
  const up = vec3.fromValues(0, 1, 0);
  vec3.cross(tangent, normal, up);
  if (vec3.length(tangent) < 0.001) {
    const right = vec3.fromValues(1, 0, 0);
    vec3.cross(tangent, normal, right);
  }
  vec3.normalize(tangent, tangent);
  vec3.cross(binormal, normal, tangent);
  
  const step = size / density;
  for (let i = -density / 2; i <= density / 2; i++) {
    for (let j = -density / 2; j <= density / 2; j++) {
      const point = vec3.clone(center);
      vec3.scaleAndAdd(point, point, tangent, i * step);
      vec3.scaleAndAdd(point, point, binormal, j * step);
      seedPoints.push(point);
    }
  }
  
  return seedPoints;
}