# 4D Flow MRI Analytics Module

## Overview
WebGPU 기반 4D Flow MRI 데이터 분석 모듈

## Features
- Flow velocity analysis
- Wall shear stress calculation
- Hemodynamic metrics computation
- GPU-accelerated processing

## Usage
```typescript
import { FlowAnalyzer, VelocityCalculator } from './analytics';

const analyzer = new FlowAnalyzer(device);
const result = await analyzer.analyze(flowData);
```

## Modules
- `flow-analyzer.ts`: 주요 흐름 분석
- `velocity-calculator.ts`: 속도 계산 (WebGPU)
- `wall-shear-stress.ts`: WSS 계산
- `flow-metrics.ts`: 혈류역학 지표