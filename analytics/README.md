# 4D Flow MRI 분석 웹 애플리케이션

간단한 4D Flow MRI 데이터 분석을 위한 웹 애플리케이션입니다.

## 기능

- 속도 데이터 통계 분석 (평균, 최대, 최소, 표준편차)
- 3D 벡터 유동 메트릭 계산
- 직관적인 웹 인터페이스

## 설치 방법

```bash
pip install -r requirements.txt
```

## 실행 방법

```bash
python app.py
```

브라우저에서 `http://localhost:5000` 접속

## 사용 방법

1. **속도 데이터 분석**: 쉼표로 구분된 속도 값을 입력하고 분석
2. **3D 유동 메트릭**: X, Y, Z 방향의 속도 성분을 입력하여 유동 분석

## 기술 스택

- Backend: Flask (Python)
- Frontend: HTML, CSS, JavaScript
- 데이터 처리: NumPy