from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import numpy as np
from api.routes import api_bp
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'version': '2.0.0'})

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'])