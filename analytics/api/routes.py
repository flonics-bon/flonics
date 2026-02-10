from flask import Blueprint, request, jsonify
import numpy as np
import logging

api_bp = Blueprint('api', __name__)
logger = logging.getLogger(__name__)

@api_bp.route('/analyze', methods=['POST'])
def analyze_flow():
    try:
        data = request.get_json()
        if not data or 'flow_data' not in data:
            return jsonify({"error": "Missing flow_data"}), 400
        
        flow_data = np.array(data['flow_data'])
        
        velocity_magnitude = np.sqrt(np.sum(flow_data**2, axis=-1))
        mean_velocity = float(np.mean(velocity_magnitude))
        max_velocity = float(np.max(velocity_magnitude))
        
        turbulence = np.std(velocity_magnitude)
        
        result = {
            "mean_velocity": mean_velocity,
            "max_velocity": max_velocity,
            "turbulence_index": float(turbulence),
            "flow_pattern": "laminar" if turbulence < 0.3 else "turbulent"
        }
        
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Analysis error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@api_bp.route('/metrics', methods=['POST'])
def calculate_metrics():
    try:
        data = request.get_json()
        flow_data = np.array(data['flow_data'])
        
        velocity = np.linalg.norm(flow_data, axis=-1)
        
        metrics = {
            "peak_velocity": float(np.max(velocity)),
            "mean_velocity": float(np.mean(velocity)),
            "flow_volume": float(np.sum(velocity)),
            "velocity_std": float(np.std(velocity))
        }
        
        return jsonify(metrics), 200
    except Exception as e:
        logger.error(f"Metrics error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@api_bp.route('/visualize', methods=['POST'])
def prepare_visualization():
    try:
        data = request.get_json()
        flow_data = np.array(data['flow_data'])
        
        downsampled = flow_data[::2, ::2, ::2]
        
        viz_data = {
            "vectors": downsampled.tolist(),
            "dimensions": list(downsampled.shape),
            "timestamp": data.get('timestamp', 0)
        }
        
        return jsonify(viz_data), 200
    except Exception as e:
        logger.error(f"Visualization error: {str(e)}")
        return jsonify({"error": str(e)}), 500