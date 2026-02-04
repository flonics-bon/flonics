function printGugudan(dan) {
    let result = [];
    
    for (let i = 1; i <= 9; i++) {
        const product = dan * i;
        result.push(`${dan} x ${i} = ${product}`);
    }
    
    return result.join('\n');
}

function printAllGugudan() {
    for (let dan = 2; dan <= 9; dan++) {
        console.log(`\n=== ${dan}단 ===`);
        console.log(printGugudan(dan));
    }
}

console.log('구구단 프로그램 시작!');
printAllGugudan();
console.log('\n구구단 프로그램 종료!');

function printRangeGugudan(start, end) {
    if (start < 2 || end > 9 || start > end) {
        console.error('유효하지 않은 범위입니다. (2~9 사이의 값을 입력하세요)');
        return;
    }
    
    for (let dan = start; dan <= end; dan++) {
        console.log(`\n=== ${dan}단 ===`);
        console.log(printGugudan(dan));
    }
}
