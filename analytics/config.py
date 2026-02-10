import os

class Config:
DEBUG = os.getenv('DEBUG', 'False') == 'True'
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
MAX_CONTENT_LENGTH = 100 * 1024 * 1024
JSON_SORT_KEYS = False
CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5000']