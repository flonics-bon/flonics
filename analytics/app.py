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
        data = request.json
        velocity_data = np.array(data.get('velocity', []))
        
        # 기본 4D Flow MRI 분석
        result = {
            'mean_velocity': float(np.mean(velocity_data)) if len(velocity_data) > 0 else 0,
            'max_velocity': float(np.max(velocity_data)) if len(velocity_data) > 0 else 0,
            'min_velocity': float(np.min(velocity_data)) if len(velocity_data) > 0 else 0,
            'std_velocity': float(np.std(velocity_data)) if len(velocity_data) > 0 else 0
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)