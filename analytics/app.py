from flask import Flask, render_template, request, jsonify
import numpy as np
from scipy import ndimage
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/analyze', methods=['POST'])
def analyze_flow():
    try:
        data = request.get_json()
        velocity_data = np.array(data.get('velocity', []))
        
        if velocity_data.size == 0:
            return jsonify({'error': 'No velocity data provided'}), 400
        
        vx = velocity_data[:, :, :, 0] if velocity_data.ndim == 4 else velocity_data
        vy = velocity_data[:, :, :, 1] if velocity_data.ndim == 4 else np.zeros_like(vx)
        vz = velocity_data[:, :, :, 2] if velocity_data.ndim == 4 else np.zeros_like(vx)
        
        magnitude = np.sqrt(vx**2 + vy**2 + vz**2)
        
        dvx_dx = np.gradient(vx, axis=0)
        dvy_dy = np.gradient(vy, axis=1)
        dvz_dz = np.gradient(vz, axis=2)
        divergence = dvx_dx + dvy_dy + dvz_dz
        
        dvy_dx = np.gradient(vy, axis=0)
        dvx_dy = np.gradient(vx, axis=1)
        dvz_dx = np.gradient(vz, axis=0)
        dvx_dz = np.gradient(vx, axis=2)
        dvy_dz = np.gradient(vy, axis=2)
        dvz_dy = np.gradient(vz, axis=1)
        
        vorticity_x = dvz_dy - dvy_dz
        vorticity_y = dvx_dz - dvz_dx
        vorticity_z = dvy_dx - dvx_dy
        vorticity_magnitude = np.sqrt(vorticity_x**2 + vorticity_y**2 + vorticity_z**2)
        
        mu = 0.004
        shear_rate = np.sqrt(2 * ((dvx_dx)**2 + (dvy_dy)**2 + (dvz_dz)**2 +
                                  0.5 * ((dvy_dx + dvx_dy)**2 + (dvz_dx + dvx_dz)**2 + (dvy_dz + dvz_dy)**2)))
        wss = mu * shear_rate
        
        result = {
            'magnitude': magnitude.tolist(),
            'divergence': divergence.tolist(),
            'vorticity': vorticity_magnitude.tolist(),
            'wss': wss.tolist(),
            'stats': {
                'mean_velocity': float(np.mean(magnitude)),
                'max_velocity': float(np.max(magnitude)),
                'mean_vorticity': float(np.mean(vorticity_magnitude)),
                'max_wss': float(np.max(wss))
            }
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics', methods=['POST'])
def calculate_metrics():
    try:
        data = request.get_json()
        flow_data = np.array(data.get('flow', []))
        
        if flow_data.size == 0:
            return jsonify({'error': 'No flow data'}), 400
        
        peak_velocity = float(np.max(flow_data))
        mean_velocity = float(np.mean(flow_data))
        std_velocity = float(np.std(flow_data))
        
        temporal_variance = float(np.var(flow_data, axis=-1).mean()) if flow_data.ndim > 3 else 0.0
        
        metrics = {
            'peak_velocity': peak_velocity,
            'mean_velocity': mean_velocity,
            'std_velocity': std_velocity,
            'temporal_variance': temporal_variance,
            'flow_complexity': std_velocity / (mean_velocity + 1e-6)
        }
        
        return jsonify(metrics)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)