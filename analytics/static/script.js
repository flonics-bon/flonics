async function analyzeVelocity() {
    const input = document.getElementById('velocityInput').value;
    const resultsDiv = document.getElementById('velocityResults');
    
    try {
        const velocity = input.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        
        if (velocity.length === 0) {
            resultsDiv.innerHTML = '<p class="error">유효한 속도 데이터를 입력해주세요.</p>';
            return;
        }
        
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ velocity })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultsDiv.innerHTML = `<p class="error">오류: ${data.error}</p>`;
            return;
        }
        
        resultsDiv.innerHTML = `
            <h3>분석 결과</h3>
            <p><strong>평균 속도:</strong> ${data.mean_velocity.toFixed(2)} cm/s</p>
            <p><strong>최대 속도:</strong> ${data.max_velocity.toFixed(2)} cm/s</p>
            <p><strong>최소 속도:</strong> ${data.min_velocity.toFixed(2)} cm/s</p>
            <p><strong>표준 편차:</strong> ${data.std_velocity.toFixed(2)} cm/s</p>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `<p class="error">오류: ${error.message}</p>`;
    }
}

async function analyzeFlow() {
    const vxInput = document.getElementById('vxInput').value;
    const vyInput = document.getElementById('vyInput').value;
    const vzInput = document.getElementById('vzInput').value;
    const resultsDiv = document.getElementById('flowResults');
    
    try {
        const vx = vxInput.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        const vy = vyInput.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        const vz = vzInput.split(',').map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        
        if (vx.length === 0 || vy.length === 0 || vz.length === 0) {
            resultsDiv.innerHTML = '<p class="error">모든 방향의 속도 데이터를 입력해주세요.</p>';
            return;
        }
        
        if (vx.length !== vy.length || vy.length !== vz.length) {
            resultsDiv.innerHTML = '<p class="error">모든 방향의 데이터 개수가 같아야 합니다.</p>';
            return;
        }
        
        const response = await fetch('/api/flow-metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ vx, vy, vz })
        });
        
        const data = await response.json();
        
        if (data.error) {
            resultsDiv.innerHTML = `<p class="error">오류: ${data.error}</p>`;
            return;
        }
        
        resultsDiv.innerHTML = `
            <h3>유동 분석 결과</h3>
            <p><strong>평균 유속:</strong> ${data.mean_flow.toFixed(2)} cm/s</p>
            <p><strong>최대 유속:</strong> ${data.peak_flow.toFixed(2)} cm/s</p>
            <p><strong>데이터 포인트:</strong> ${data.velocity_magnitude.length}개</p>
        `;
    } catch (error) {
        resultsDiv.innerHTML = `<p class="error">오류: ${error.message}</p>`;
    }
}