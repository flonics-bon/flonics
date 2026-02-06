async function analyzeFlow() {
    const velocityInput = document.getElementById('velocity').value;
    const areaInput = document.getElementById('area').value;
    
    // 입력 검증
    if (!velocityInput.trim()) {
        alert('속도 데이터를 입력해주세요.');
        return;
    }
    
    // 속도 데이터 파싱
    const velocityData = velocityInput.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    
    if (velocityData.length === 0) {
        alert('유효한 속도 데이터를 입력해주세요.');
        return;
    }
    
    const area = parseFloat(areaInput);
    
    if (isNaN(area) || area <= 0) {
        alert('유효한 단면적을 입력해주세요.');
        return;
    }
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                velocity: velocityData,
                area: area
            })
        });
        
        const result = await response.json();
        
        if (result.status === 'success') {
            displayResults(result);
        } else {
            alert('분석 중 오류가 발생했습니다: ' + result.message);
        }
    } catch (error) {
        alert('서버 통신 중 오류가 발생했습니다: ' + error.message);
    }
}

function displayResults(result) {
    document.getElementById('meanVelocity').textContent = result.mean_velocity.toFixed(2);
    document.getElementById('maxVelocity').textContent = result.max_velocity.toFixed(2);
    document.getElementById('flowRate').textContent = result.flow_rate.toFixed(2);
    
    const resultsSection = document.getElementById('results');
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Enter 키로 분석 실행
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('velocity').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeFlow();
        }
    });
    
    document.getElementById('area').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeFlow();
        }
    });
});