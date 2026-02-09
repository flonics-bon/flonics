# Analytics Module

## Overview
Comprehensive 4D flow analysis and visualization toolkit for cardiovascular hemodynamics.

## Architecture

### Core Components
- **Flow Analysis**: `flow-analyzer.ts`, `flow-analysis.ts`
- **Metrics Calculation**: `metrics.ts`, `flow-metrics.ts`, `velocity-calculator.ts`
- **Wall Shear Stress**: `wall-shear-stress.ts`
- **Visualization**: `visualization.ts`, `webgpu-renderer.js`, `flowVisualization.js`
- **Data Management**: `flow-data-manager.js`, `data-processor.ts`

### Backend
- **Flask Server**: `app.py` - REST API for data processing

## Installation

```bash
npm install
pip install -r requirements.txt
```

## Usage

### TypeScript API

```typescript
import { FlowAnalyzer } from './flow-analyzer';
import { calculateMetrics } from './metrics';
import { visualizeFlow } from './visualization';

const analyzer = new FlowAnalyzer(flowData);
const metrics = calculateMetrics(analyzer.getResults());
visualizeFlow(metrics, canvas);
```

### Python Backend

```bash
python app.py
```

Endpoints:
- `POST /analyze` - Process flow data
- `GET /metrics` - Retrieve calculated metrics

### WebGPU Rendering

```javascript
import { WebGPURenderer } from './js/webgpu-renderer.js';

const renderer = new WebGPURenderer(canvas);
renderer.render(flowData);
```

## API Reference

### FlowAnalyzer
```typescript
class FlowAnalyzer {
  constructor(data: FlowData);
  analyze(): AnalysisResult;
  getVelocityField(): VelocityField;
  calculateWSS(): WSSResult;
}
```

### Metrics
```typescript
interface FlowMetrics {
  peakVelocity: number;
  meanVelocity: number;
  flowRate: number;
  vorticity: number[];
  wss: number[];
}

function calculateMetrics(data: FlowData): FlowMetrics;
```

### Visualization
```typescript
function visualizeFlow(
  metrics: FlowMetrics,
  canvas: HTMLCanvasElement,
  options?: VisualizationOptions
): void;
```

## File Structure

```
analytics/
├── app.py                          # Flask backend
├── index.ts                        # Main entry point
├── types.ts                        # TypeScript type definitions
├── flow-analyzer.ts                # Core flow analysis
├── flow-analysis.ts                # Analysis utilities
├── flow-metrics.ts                 # Metrics calculation
├── metrics.ts                      # Metrics aggregation
├── velocity-calculator.ts          # Velocity field processing
├── wall-shear-stress.ts            # WSS computation
├── visualization.ts                # Visualization logic
├── data-processor.ts               # Data preprocessing
├── js/
│   ├── main.js                     # JavaScript entry
│   ├── flow-data-manager.js        # Data management
│   └── webgpu-renderer.js          # GPU-accelerated rendering
├── static/
│   └── script.js                   # Frontend scripts
└── 4dflow-visualization/
    └── flowVisualization.js        # 4D flow specific viz
```

## Features

- **Real-time Flow Analysis**: High-performance velocity field processing
- **Advanced Metrics**: Peak velocity, flow rate, vorticity, WSS
- **WebGPU Rendering**: Hardware-accelerated 3D/4D visualization
- **Python Integration**: Backend processing with NumPy/SciPy
- **Type Safety**: Full TypeScript support

## Performance

- WebGPU rendering: 60+ FPS for complex flow fields
- Parallel processing: Multi-threaded analysis
- Memory efficient: Streaming data processing

## Dependencies

### TypeScript/JavaScript
- WebGPU API
- Three.js (optional)

### Python
- Flask
- NumPy
- SciPy
- VTK (optional)

## Contributing

Follow TypeScript/Python best practices. Run tests before PR.

## License

MIT
