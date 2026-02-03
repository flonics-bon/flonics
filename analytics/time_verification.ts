/**
 * Time Verification Utility for 4D Flow MRI Data
 * Validates temporal consistency and synchronization
 */

export interface TimeFrame {
  index: number;
  timestamp: number;
  deltaTime: number;
}

export class TimeVerification {
  private frames: TimeFrame[] = [];
  private expectedInterval: number;

  constructor(expectedInterval: number = 50) {
    this.expectedInterval = expectedInterval;
  }

  addFrame(timestamp: number): void {
    const index = this.frames.length;
    const deltaTime = index > 0 ? timestamp - this.frames[index - 1].timestamp : 0;
    
    this.frames.push({
      index,
      timestamp,
      deltaTime
    });
  }

  verify(): {
    isValid: boolean;
    averageDelta: number;
    maxDeviation: number;
    totalFrames: number;
  } {
    if (this.frames.length < 2) {
      return {
        isValid: false,
        averageDelta: 0,
        maxDeviation: 0,
        totalFrames: this.frames.length
      };
    }

    const deltas = this.frames.slice(1).map(f => f.deltaTime);
    const averageDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const deviations = deltas.map(d => Math.abs(d - this.expectedInterval));
    const maxDeviation = Math.max(...deviations);

    return {
      isValid: maxDeviation < this.expectedInterval * 0.1,
      averageDelta,
      maxDeviation,
      totalFrames: this.frames.length
    };
  }

  getCurrentTime(): number {
    return this.frames.length > 0 ? this.frames[this.frames.length - 1].timestamp : 0;
  }

  reset(): void {
    this.frames = [];
  }
}

export function checkTimeSynchronization(timestamps: number[]): boolean {
  const verifier = new TimeVerification();
  timestamps.forEach(ts => verifier.addFrame(ts));
  const result = verifier.verify();
  return result.isValid;
}