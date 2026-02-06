from flask import Flask, render_template, request, jsonify
import numpy as np
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze():
    try:
        data = request.get_json()
        velocity_data = np.array(data.get('velocity', []))
        
        # 기본 4D Flow MRI 분석
        results = {
            'mean_velocity': float(np.mean(velocity_data)) if len(velocity_data) > 0 else 0,
            'max_velocity': float(np.max(velocity_data)) if len(velocity_data) > 0 else 0,
            'min_velocity': float(np.min(velocity_data)) if len(velocity_data) > 0 else 0,
            'std_velocity': float(np.std(velocity_data)) if len(velocity_data) > 0 else 0
        }
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/flow-metrics', methods=['POST'])
def flow_metrics():
    try:
        data = request.get_json()
        vx = np.array(data.get('vx', []))
        vy = np.array(data.get('vy', []))
        vz = np.array(data.get('vz', []))
        
        # 속도 크기 계산
        velocity_magnitude = np.sqrt(vx**2 + vy**2 + vz**2)
        
        results = {
            'velocity_magnitude': velocity_magnitude.tolist(),
            'mean_flow': float(np.mean(velocity_magnitude)),
            'peak_flow': float(np.max(velocity_magnitude))
        }
        
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)