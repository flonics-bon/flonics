import { DataProcessor } from './core/data-processor';
import { FlowAnalyzer } from './core/flow-analyzer';
import { MetricsCalculator } from './core/metrics-calculator';
import { FlowData, ProcessedFlowData, FlowAnalysisResult, FlowMetrics } from './types/flow-types';

export class FlowAnalytics {
  private processor: DataProcessor;
  private analyzer: FlowAnalyzer;
  private calculator: MetricsCalculator;

  constructor() {
    this.processor = new DataProcessor();
    this.analyzer = new FlowAnalyzer();
    this.calculator = new MetricsCalculator();
  }

  async processAndAnalyze(rawData: FlowData): Promise<{
    processed: ProcessedFlowData;
    analysis: FlowAnalysisResult;
    metrics: FlowMetrics;
  }> {
    const processed = this.processor.processFlowData(rawData);
    const analysis = this.analyzer.analyze(processed);
    const metrics = this.calculator.calculate(processed);

    return { processed, analysis, metrics };
  }

  async batchAnalyze(dataArray: FlowData[]): Promise<FlowAnalysisResult[]> {
    return dataArray.map(data => {
      const processed = this.processor.processFlowData(data);
      return this.analyzer.analyze(processed);
    });
  }

  getProcessor(): DataProcessor {
    return this.processor;
  }

  getAnalyzer(): FlowAnalyzer {
    return this.analyzer;
  }

  getCalculator(): MetricsCalculator {
    return this.calculator;
  }
}

export * from './types/flow-types';
export { DataProcessor } from './core/data-processor';
export { FlowAnalyzer } from './core/flow-analyzer';
export { MetricsCalculator } from './core/metrics-calculator';