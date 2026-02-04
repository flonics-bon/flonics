# Analytics 폴더

이 폴더는 분석 및 유틸리티 코드를 포함합니다.

## 파일 목록

### gugudan.js
간단한 구구단 계산 프로그램입니다.

#### 주요 기능
- `calculateGugudan(dan)`: 특정 단의 구구단 계산
- `calculateAllGugudan()`: 전체 구구단(2~9단) 계산
- `printGugudan(dan)`: 구구단을 콘솔에 출력
- `generateGugudanHTML()`: HTML 테이블 형식으로 구구단 생성

#### 사용 방법

**Node.js 환경:**
```bash
node analytics/gugudan.js
```

**프로그래밍 방식:**
```javascript
const gugudan = require('./analytics/gugudan');

// 전체 구구단 출력
gugudan.printGugudan();

// 5단만 출력
gugudan.printGugudan(5);

// 3단 데이터 가져오기
const data = gugudan.calculateGugudan(3);
console.log(data);

// HTML 생성
const html = gugudan.generateGugudanHTML();
```

**브라우저 환경:**
```html
<script src="analytics/gugudan.js"></script>
<script>
    printGugudan(7); // 7단 출력
</script>
```
