# 4D Flow MRI 분석 웹 애플리케이션

간단한 4D Flow MRI 데이터 분석을 위한 웹 애플리케이션입니다.

## 기능

- 속도 데이터 입력 및 분석
- 평균, 최대, 최소, 표준편차 계산
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

1. 속도 데이터를 쉼표로 구분하여 입력 (예: 1.2, 2.3, 3.4, 4.5)
2. "분석 시작" 버튼 클릭
3. 분석 결과 확인

## 기술 스택

- Backend: Flask (Python)
- Frontend: HTML, CSS, JavaScript
- 데이터 처리: NumPy