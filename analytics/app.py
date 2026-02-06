from flask import Flask, render_template, request, jsonify
import numpy as np
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_flow():
    try:
        data = request.json
        velocity_data = np.array(data.get('velocity', []))
        
        # 기본 4D Flow 분석
        mean_velocity = np.mean(velocity_data) if len(velocity_data) > 0 else 0
        max_velocity = np.max(velocity_data) if len(velocity_data) > 0 else 0
        flow_rate = mean_velocity * data.get('area', 1.0)
        
        result = {
            'mean_velocity': float(mean_velocity),
            'max_velocity': float(max_velocity),
            'flow_rate': float(flow_rate),
            'status': 'success'
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': '4D Flow MRI Analytics'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)