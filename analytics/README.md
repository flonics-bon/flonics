# 4D Flow MRI WebGPU Viewer

4D Flow MRI 데이터를 WebGPU를 사용하여 시각화하는 간단한 애플리케이션입니다.

## 기능

- WebGPU 기반 렌더링
- 4D Flow 데이터 관리 (x, y, z, time)
- 실시간 애니메이션
- 간단한 UI 컨트롤

## 파일 구조

```
analytics/
├── index.html              # 메인 HTML 파일
├── js/
│   ├── main.js            # 애플리케이션 진입점
│   ├── webgpu-renderer.js # WebGPU 렌더링 엔진
│   └── flow-data-manager.js # 4D Flow 데이터 관리
└── README.md              # 문서
```

## 사용 방법

1. WebGPU를 지원하는 브라우저에서 실행 (Chrome 113+, Edge 113+)
2. `index.html` 파일을 로컬 서버로 실행
3. 시작 버튼을 클릭하여 애니메이션 시작

## 요구사항

- WebGPU 지원 브라우저
- 로컬 웹 서버 (CORS 정책으로 인해 file:// 프로토콜로는 실행 불가)

## 개발

이 코드는 기본 구조를 제공합니다. 실제 MRI 데이터를 로드하고 더 복잡한 시각화를 구현하려면 추가 개발이 필요합니다.

### 확장 가능한 기능

- DICOM 파일 로더
- 볼륨 렌더링
- 스트림라인 시각화
- 벡터 필드 시각화
- 인터랙티브 카메라 컨트롤
- 데이터 분석 도구
