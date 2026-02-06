# 4D Flow MRI Analytics

4D Flow MRI 데이터를 분석하는 간단한 웹 애플리케이션입니다.

## 기능

- 혈류 속도 데이터 입력 및 분석
- 평균 속도 계산
- 최대 속도 계산
- 유량 계산
- 실시간 결과 표시

## 설치 방법

```bash
# 의존성 설치
pip install -r requirements.txt
```

## 실행 방법

```bash
# 애플리케이션 실행
python app.py
```

브라우저에서 `http://localhost:5000` 접속

## 사용 방법

1. 속도 데이터를 쉼표로 구분하여 입력 (예: 1.2, 1.5, 1.8, 2.0)
2. 혈관 단면적을 입력 (cm²)
3. "분석 시작" 버튼 클릭
4. 결과 확인

## API 엔드포인트

### POST /api/analyze
혈류 데이터 분석

**요청:**
```json
{
  "velocity": [1.2, 1.5, 1.8, 2.0],
  "area": 1.0
}
```

**응답:**
```json
{
  "mean_velocity": 1.625,
  "max_velocity": 2.0,
  "flow_rate": 1.625,
  "status": "success"
}
```

### GET /api/health
서비스 상태 확인

## 기술 스택

- Backend: Flask (Python)
- Frontend: HTML, CSS, JavaScript
- 데이터 처리: NumPy