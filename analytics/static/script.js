async function analyzeData() {
    const input = document.getElementById('velocityInput').value;
    
    if (!input.trim()) {
        alert('속도 데이터를 입력해주세요.');
        return;
    }
    
    try {
        // 입력 데이터를 배열로 변환
        const velocityArray = input.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        
        if (velocityArray.length === 0) {
            alert('유효한 숫자 데이터를 입력해주세요.');
            return;
        }
        
        // API 호출
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                velocity: velocityArray
            })
        });
        
        if (!response.ok) {
            throw new Error('분석 중 오류가 발생했습니다.');
        }
        
        const result = await response.json();
        
        // 결과 표시
        document.getElementById('meanVelocity').textContent = result.mean_velocity.toFixed(2) + ' m/s';
        document.getElementById('maxVelocity').textContent = result.max_velocity.toFixed(2) + ' m/s';
        document.getElementById('minVelocity').textContent = result.min_velocity.toFixed(2) + ' m/s';
        document.getElementById('stdVelocity').textContent = result.std_velocity.toFixed(2) + ' m/s';
        
        document.getElementById('resultSection').style.display = 'block';
        
    } catch (error) {
        alert('오류: ' + error.message);
    }
}