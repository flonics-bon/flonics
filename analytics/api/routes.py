from flask import Blueprint, jsonify, request
import numpy as np

api_bp = Blueprint('api', __name__)

@api_bp.route('/flow/analyze', methods=['POST'])
def analyze_flow():
data = request.get_json()
if not data or 'velocity' not in data:
return jsonify({'error': 'Invalid data'}), 400

velocity = np.array(data['velocity'])
metrics = compute_metrics(velocity)

return jsonify(metrics)

@api_bp.route('/flow/streamlines', methods=['POST'])
def compute_streamlines():
data = request.get_json()
if not data or 'velocity' not in data or 'seeds' not in data:
return jsonify({'error': 'Invalid data'}), 400

velocity = np.array(data['velocity'])
seeds = np.array(data['seeds'])
streamlines = trace_streamlines(velocity, seeds)

return jsonify({'streamlines': streamlines.tolist()})

@api_bp.route('/metrics/wss', methods=['POST'])
def calculate_wss():
data = request.get_json()
if not data or 'velocity' not in data:
return jsonify({'error': 'Invalid data'}), 400

velocity = np.array(data['velocity'])
wss = compute_wss(velocity)

return jsonify({'wss': wss.tolist()})

def compute_metrics(velocity):
return {
'mean_velocity': float(np.mean(velocity)),
'max_velocity': float(np.max(velocity)),
'flow_rate': float(np.sum(velocity))
}

def trace_streamlines(velocity, seeds):
return np.random.rand(len(seeds), 100, 3)

def compute_wss(velocity):
return np.random.rand(*velocity.shape[:3])