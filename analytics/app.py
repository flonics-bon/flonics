from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from api.routes import api_bp
import logging

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.register_blueprint(api_bp, url_prefix='/api')

@app.route('/')
def index():
    return jsonify({"status": "ok", "service": "4D Flow Analytics"})

@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def server_error(e):
    logger.error(f"Server error: {str(e)}")
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=Config.DEBUG)