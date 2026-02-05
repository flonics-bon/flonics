# 4D Flow MRI Analytics Module

## Overview
This module provides comprehensive analysis and visualization tools for 4D Flow MRI data using WebGPU acceleration.

## Updated Features
- **Enhanced Flow Analysis**: Improved velocity and direction calculations
- **Optimized WebGPU Rendering**: Better performance for real-time visualization
- **Advanced Data Processing**: Noise reduction and temporal filtering
- **Hemodynamic Metrics**: WSS, vorticity, and flow rate calculations

## Modules

### flow-analysis.ts
Core flow analysis with peak velocity detection and point-specific metrics.

### visualization.ts
WebGPU-based rendering pipeline for flow vector visualization.

### data-processor.ts
Data preprocessing with smoothing, noise reduction, and temporal filtering.

### metrics.ts
Comprehensive hemodynamic metrics calculation including WSS and vorticity.

## Usage Example
```typescript
import { FlowAnalyzer } from './flow-analysis';
import { FlowVisualizer } from './visualization';
import { MetricsCalculator } from './metrics';

const analyzer = new FlowAnalyzer(flowData);
const peakVel = analyzer.calculatePeakVelocity();
const metrics = MetricsCalculator.calculateMetrics(flowData);
```

## Requirements
- WebGPU-compatible browser
- 4D Flow MRI data in Float32Array format

## Recent Updates
- Improved calculation accuracy
- Enhanced performance optimization
- Better error handling
- Extended metrics support
