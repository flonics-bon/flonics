import { FlowData, ProcessedFlowData, VelocityVector } from '../types/flow-types';

export class DataProcessor {
  processFlowData(rawData: FlowData): ProcessedFlowData {
    const velocityMagnitudes = this.calculateVelocityMagnitudes(rawData.vectors);
    const normalized = this.normalizeVectors(rawData.vectors);
    
    return {
      vectors: normalized,
      magnitudes: velocityMagnitudes,
      dimensions: rawData.dimensions,
      timestamp: rawData.timestamp,
      metadata: rawData.metadata
    };
  }

  private calculateVelocityMagnitudes(vectors: VelocityVector[]): number[] {
    return vectors.map(v => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2));
  }

  private normalizeVectors(vectors: VelocityVector[]): VelocityVector[] {
    const magnitudes = this.calculateVelocityMagnitudes(vectors);
    const maxMag = Math.max(...magnitudes);
    
    if (maxMag === 0) return vectors;
    
    return vectors.map(v => ({
      x: v.x / maxMag,
      y: v.y / maxMag,
      z: v.z / maxMag
    }));
  }

  filterByThreshold(data: ProcessedFlowData, threshold: number): ProcessedFlowData {
    const filtered = data.vectors.filter((_, idx) => data.magnitudes[idx] >= threshold);
    const filteredMags = data.magnitudes.filter(m => m >= threshold);
    
    return {
      ...data,
      vectors: filtered,
      magnitudes: filteredMags
    };
  }

  downsample(data: ProcessedFlowData, factor: number): ProcessedFlowData {
    const sampled = data.vectors.filter((_, idx) => idx % factor === 0);
    const sampledMags = data.magnitudes.filter((_, idx) => idx % factor === 0);
    
    return {
      ...data,
      vectors: sampled,
      magnitudes: sampledMags
    };
  }
}