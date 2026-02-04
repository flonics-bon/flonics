/**
 * 구구단 계산 및 출력 프로그램
 * @description 2단부터 9단까지의 구구단을 계산하고 출력합니다.
 */

/**
 * 특정 단의 구구단을 계산합니다.
 * @param {number} dan - 계산할 단 (2~9)
 * @returns {Array<Object>} 구구단 결과 배열
 */
function calculateGugudan(dan) {
    const results = [];
    for (let i = 1; i <= 9; i++) {
        results.push({
            expression: `${dan} x ${i}`,
            result: dan * i
        });
    }
    return results;
}

/**
 * 전체 구구단(2단~9단)을 계산합니다.
 * @returns {Object} 모든 단의 구구단 결과
 */
function calculateAllGugudan() {
    const allResults = {};
    for (let dan = 2; dan <= 9; dan++) {
        allResults[`${dan}단`] = calculateGugudan(dan);
    }
    return allResults;
}

/**
 * 구구단을 콘솔에 출력합니다.
 * @param {number} dan - 출력할 단 (선택사항, 없으면 전체 출력)
 */
function printGugudan(dan = null) {
    if (dan !== null) {
        console.log(`\n===== ${dan}단 =====`);
        const results = calculateGugudan(dan);
        results.forEach(item => {
            console.log(`${item.expression} = ${item.result}`);
        });
    } else {
        console.log('\n========== 구구단 (2단 ~ 9단) ==========\n');
        for (let d = 2; d <= 9; d++) {
            console.log(`===== ${d}단 =====`);
            const results = calculateGugudan(d);
            results.forEach(item => {
                console.log(`${item.expression} = ${item.result}`);
            });
            console.log('');
        }
    }
}

/**
 * 구구단을 HTML 테이블 형식으로 생성합니다.
 * @returns {string} HTML 테이블 문자열
 */
function generateGugudanHTML() {
    let html = '<div class="gugudan-container">\n';
    html += '  <h2>구구단표</h2>\n';
    html += '  <div class="gugudan-grid">\n';
    
    for (let dan = 2; dan <= 9; dan++) {
        html += `    <div class="gugudan-card">\n`;
        html += `      <h3>${dan}단</h3>\n`;
        html += `      <ul>\n`;
        
        const results = calculateGugudan(dan);
        results.forEach(item => {
            html += `        <li>${item.expression} = ${item.result}</li>\n`;
        });
        
        html += `      </ul>\n`;
        html += `    </div>\n`;
    }
    
    html += '  </div>\n';
    html += '</div>';
    
    return html;
}

// 모듈 exports (Node.js 환경)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateGugudan,
        calculateAllGugudan,
        printGugudan,
        generateGugudanHTML
    };
}

// 브라우저 환경에서 바로 실행
if (typeof window !== 'undefined') {
    console.log('구구단 프로그램이 로드되었습니다.');
    console.log('사용 방법:');
    console.log('- printGugudan() : 전체 구구단 출력');
    console.log('- printGugudan(5) : 5단만 출력');
    console.log('- calculateGugudan(3) : 3단 계산 결과 반환');
    console.log('- calculateAllGugudan() : 전체 구구단 데이터 반환');
    console.log('- generateGugudanHTML() : HTML 테이블 생성');
}

// Node.js 환경에서 직접 실행시 전체 구구단 출력
if (typeof require !== 'undefined' && require.main === module) {
    printGugudan();
}
