# Analytics Module

## Architecture
```
analytics/
├── app.py              # Flask server
├── index.ts            # TypeScript entry
├── types.ts            # Type definitions
├── flow-analyzer.ts    # Flow analysis logic
├── data-processor.ts   # Data processing
└── 4dflow-visualization/
    ├── index.html
    ├── flowVisualization.js
    └── docker-compose.yml
```

## Setup
```bash
pip install -r requirements.txt
python app.py
```

## API Endpoints
- `GET /` - Main interface
- `POST /analyze` - Flow analysis
- `GET /visualize` - Visualization data

## TypeScript Modules
- **flow-analyzer**: Core flow computation
- **data-processor**: Data transformation pipeline

## Docker Deployment
```bash
cd 4dflow-visualization
docker-compose up -d
```

## Development
```bash
npm install
tsc --watch
```