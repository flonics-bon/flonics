// Example analytics module
export class DataAnalyzer {
  constructor() {
    this.data = [];
  }

  addData(value) {
    this.data.push(value);
  }

  getMean() {
    if (this.data.length === 0) return 0;
    const sum = this.data.reduce((a, b) => a + b, 0);
    return sum / this.data.length;
  }

  getStandardDeviation() {
    const mean = this.getMean();
    const variance = this.data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.data.length;
    return Math.sqrt(variance);
  }
}
