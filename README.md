# 4D Flow MRI Analysis Platform

Comprehensive platform for 4D Flow MRI data analysis, visualization, and hemodynamic metrics calculation.

## Features

- **Flow Analysis**: Velocity field processing, wall shear stress calculation
- **Visualization**: WebGPU-accelerated 3D/4D rendering with streamlines
- **Metrics**: Peak velocity, regurgitant fraction, flow patterns
- **Web Interface**: Interactive dashboard for data exploration

## Project Structure

```
analytics/
├── app.py                 # Flask backend
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript config
├── *.ts                  # TypeScript modules
├── templates/            # HTML templates
├── static/              # CSS/JS assets
├── js/                  # JavaScript modules
└── 4dflow-visualization/ # WebGPU visualization
```

## Setup

### Prerequisites

- Python 3.8+
- Node.js 18+
- Modern browser with WebGPU support

### Installation

```bash
# Install Python dependencies
cd analytics
pip install -r requirements.txt

# Install Node.js dependencies
npm install

# Build TypeScript
npm run build
```

### Running

```bash
# Start Flask server
npm start
# or
python app.py

# Development mode (TypeScript watch)
npm run dev
```

### Docker (4D Flow Visualization)

```bash
cd analytics/4dflow-visualization
docker-compose up -d
```

Access at `http://localhost:8080`

## Usage

1. Upload 4D Flow MRI data (DICOM/NIfTI)
2. Configure analysis parameters
3. View real-time metrics and visualizations
4. Export results (CSV/JSON)

## Development

```bash
# Lint code
npm run lint

# Run tests
pytest

# Type checking
npx tsc --noEmit
```

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs:
- Linting
- Type checking
- Unit tests
- Build verification

## License

MIT

## Contributing

Pull requests welcome. See CHANGELOG.md for version history.
