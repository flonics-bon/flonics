# Analytics Module

## Overview
4D Flow MRI 데이터 분석 및 시각화를 위한 모듈

## Structure
```
analytics/
├── app.py                    # Flask 서버
├── index.ts                  # TypeScript 진입점
├── types.ts                  # 공통 타입 정의
├── metrics.ts                # 메트릭 계산
├── flow-analysis.ts          # 흐름 분석
├── flow-analyzer.ts          # 분석기
├── flow-metrics.ts           # 흐름 메트릭
├── velocity-calculator.ts    # 속도 계산
├── visualization.ts          # 시각화
├── wall-shear-stress.ts      # WSS 계산
├── data-processor.ts         # 데이터 처리
├── js/
│   ├── main.js              # 메인 스크립트
│   ├── flow-data-manager.js # 데이터 관리
│   └── webgpu-renderer.js   # WebGPU 렌더링
├── static/
│   └── script.js            # 정적 스크립트
└── 4dflow-visualization/
    └── flowVisualization.js # 4D Flow 시각화
```

## Features
- 4D Flow MRI 데이터 처리
- 속도장 분석 및 메트릭 계산
- Wall Shear Stress 계산
- WebGPU 기반 실시간 렌더링
- 대화형 시각화

## Usage
### Python Server
```bash
python app.py
```

### TypeScript Build
```bash
tsc
```

## Dependencies
- Python: Flask, NumPy, SciPy
- TypeScript: Three.js, WebGPU API
- JavaScript: ES6+
