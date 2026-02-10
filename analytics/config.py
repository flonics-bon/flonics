import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', './uploads')
    ALLOWED_EXTENSIONS = {'nii', 'nii.gz', 'dcm'}
    
    FLOW_ANALYSIS_CONFIG = {
        'velocity_threshold': float(os.getenv('VELOCITY_THRESHOLD', '0.5')),
        'turbulence_threshold': float(os.getenv('TURBULENCE_THRESHOLD', '0.3')),
        'temporal_resolution': int(os.getenv('TEMPORAL_RESOLUTION', '20'))
    }
    
    @staticmethod
    def init_app(app):
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)