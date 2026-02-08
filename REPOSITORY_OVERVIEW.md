# Repository Overview

## 프로젝트 목적
이 레포지토리는 **Analytics 플랫폼**으로, 데이터 분석 및 시각화 도구를 제공합니다.
특히 **4D Flow 시각화** 기능을 중심으로 의료 영상 데이터 분석을 지원합니다.

## 주요 컴포넌트

### 1. Analytics Core (`analytics/`)
- **app.py**: Flask 기반 백엔드 서버
- **index.ts**: TypeScript 프론트엔드 엔트리포인트
- **requirements.txt**: Python 의존성 관리

### 2. 4D Flow Visualization (`analytics/4dflow-visualization/`)
- 의료 영상 데이터의 4차원(3D+시간) 혈류 시각화
- 실시간 렌더링 및 인터랙티브 분석 도구

### 3. CI/CD Pipeline (`.github/workflows/ci.yml`)
- 자동화된 테스트 및 배포 워크플로우
- 코드 품질 검증 및 빌드 프로세스

## 기술 스택
- **Backend**: Python (Flask)
- **Frontend**: TypeScript
- **Visualization**: WebGL/Three.js (추정)
- **CI/CD**: GitHub Actions

## 디렉토리 구조
```
.
├── analytics/
│   ├── app.py              # 메인 서버
│   ├── index.ts            # 프론트엔드 진입점
│   ├── requirements.txt    # Python 패키지
│   └── 4dflow-visualization/
│       └── README.md       # 시각화 모듈 문서
├── .github/workflows/
│   └── ci.yml              # CI/CD 설정
├── CHANGELOG.md            # 변경 이력
└── README.md               # 프로젝트 소개
```

## 시작하기

### 백엔드 실행
```bash
cd analytics
pip install -r requirements.txt
python app.py
```

### 프론트엔드 빌드
```bash
cd analytics
npm install
npm run build
```

## 문서
- 전체 프로젝트: [README.md](./README.md)
- Analytics 모듈: [analytics/README.md](./analytics/README.md)
- 4D Flow 시각화: [analytics/4dflow-visualization/README.md](./analytics/4dflow-visualization/README.md)
- 변경 이력: [CHANGELOG.md](./CHANGELOG.md)
