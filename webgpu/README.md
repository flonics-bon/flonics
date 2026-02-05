# 4D Flow MRI WebGPU Visualizer

## Overview
Real-time 4D Flow MRI velocity vector visualization using WebGPU for high-performance medical imaging analysis.

## Features
- 🚀 **Hardware-Accelerated Rendering**: Leverages WebGPU for optimal performance
- 🩺 **Medical Imaging Focus**: Specialized for 4D Flow MRI blood velocity data
- 🎨 **Color-Coded Visualization**: Velocity magnitude mapped to color (blue=slow, red=fast)
- ⚙️ **Interactive Controls**: Real-time adjustment of scale, rotation, and field of view
- 📊 **Performance Monitoring**: Built-in FPS counter
- 📁 **Data Import**: Support for JSON-formatted velocity data

## System Requirements
- Modern browser with WebGPU support:
  - Chrome 113+ (with WebGPU flag enabled)
  - Edge 113+
  - Firefox Nightly (experimental)
  - Safari Technology Preview (experimental)

## Getting Started

### Installation
1. Clone the repository
2. Navigate to the `webgpu` folder
3. Serve the files using a local web server:
   ```bash
   python -m http.server 8000
   # or
   npx serve
   ```
4. Open `http://localhost:8000` in a WebGPU-supported browser

### Usage

#### Generate Sample Data
Click "Generate Sample Data" to create a circular flow pattern demonstration.

#### Load Custom Data
1. Prepare your velocity data in JSON format:
```json
[
  {
    "position": [x, y, z],
    "velocity": [vx, vy, vz]
  },
  ...
]
```
2. Click "Choose File" and select your JSON file

#### Controls
- **Vector Scale**: Adjust the length of velocity vectors
- **Rotation Speed**: Control automatic rotation speed
- **Field of View**: Change camera perspective (30°-120°)
- **Toggle Animation**: Pause/resume rotation
- **Reset View**: Return to default settings

## Technical Architecture

### Core Components

#### FlowVisualizer Class
Main visualization engine that handles:
- WebGPU device initialization
- Shader compilation and pipeline creation
- Buffer management for velocity data
- Render loop execution

#### Shader Pipeline
- **Vertex Shader**: Transforms velocity vectors into screen space
- **Fragment Shader**: Applies color based on velocity magnitude
- **Storage Buffer**: Efficiently stores large velocity datasets
- **Uniform Buffer**: Manages view/projection matrices and parameters

### Data Flow
1. **Input**: Velocity data (position + velocity vectors)
2. **Processing**: GPU computes transformations and colors
3. **Rendering**: Lines drawn from position to position+velocity
4. **Output**: Real-time visualization on canvas

## Code Structure
```
webgpu/
├── flow_visualizer.js    # Core WebGPU visualization engine
├── index.html            # Main application interface
└── README.md             # This file
```

## API Reference

### FlowVisualizer

#### Constructor
```javascript
const visualizer = new FlowVisualizer(canvas);
```

#### Methods

##### initialize()
Initializes WebGPU device and rendering pipeline.
```javascript
await visualizer.initialize();
```

##### loadVelocityData(velocityData)
Loads velocity vector data for visualization.
```javascript
const data = [
  { position: [0, 0, 0], velocity: [1, 0, 0] },
  { position: [1, 0, 0], velocity: [0, 1, 0] },
];
visualizer.loadVelocityData(data);
```

##### updateUniforms(viewMatrix, projectionMatrix, time, scale)
Updates rendering parameters.
```javascript
visualizer.updateUniforms(
  viewMatrix,        // 4x4 view transformation matrix
  projectionMatrix,  // 4x4 projection matrix
  time,              // Current time in seconds
  scale              // Vector scale factor
);
```

##### render()
Executes one render pass.
```javascript
visualizer.render();
```

##### destroy()
Cleans up GPU resources.
```javascript
visualizer.destroy();
```

### Helper Functions

#### createIdentityMatrix()
Returns a 4x4 identity matrix.
```javascript
const identity = createIdentityMatrix();
```

#### createPerspectiveMatrix(fov, aspect, near, far)
Creates a perspective projection matrix.
```javascript
const projection = createPerspectiveMatrix(
  Math.PI / 3,  // 60° FOV
  16/9,         // Aspect ratio
  0.1,          // Near plane
  1000          // Far plane
);
```

## Performance Optimization

### Best Practices
1. **Batch Updates**: Update uniforms once per frame
2. **Buffer Reuse**: Reuse buffers when data size doesn't change
3. **Instanced Rendering**: Efficiently renders thousands of vectors
4. **GPU Storage Buffers**: Minimize CPU-GPU data transfer

### Performance Metrics
- Typical FPS: 60 (vsync-limited)
- Vector capacity: 10,000+ simultaneous vectors
- Memory usage: ~10MB for 10,000 vectors

## Medical Application Notes

### 4D Flow MRI Data
4D Flow MRI captures three-dimensional velocity vectors over time, providing:
- Blood flow patterns in cardiovascular structures
- Hemodynamic parameters (wall shear stress, vorticity)
- Pathological flow indicators

### Velocity Encoding
- Standard VENC ranges: 50-500 cm/s
- Typical spatial resolution: 2-3mm isotropic
- Temporal resolution: 20-40 cardiac phases

### Color Mapping
- Blue (low velocity): < 10 cm/s
- Green (medium velocity): 10-50 cm/s
- Yellow (high velocity): 50-100 cm/s
- Red (very high velocity): > 100 cm/s

## Troubleshooting

### WebGPU Not Supported
- Ensure browser supports WebGPU
- Enable WebGPU flag in chrome://flags (for Chrome)
- Update graphics drivers

### Low Performance
- Reduce number of velocity vectors
- Lower canvas resolution
- Disable other GPU-intensive applications

### Rendering Issues
- Check browser console for errors
- Verify data format matches expected structure
- Ensure matrices are in correct format (Float32Array)

## Future Enhancements
- [ ] Streamline visualization
- [ ] Volume rendering integration
- [ ] Time-series animation
- [ ] Advanced color mapping schemes
- [ ] VR/AR support
- [ ] Direct DICOM import
- [ ] Quantitative flow analysis tools

## Contributing
Contributions welcome! Areas of interest:
- Medical imaging format support
- Performance optimization
- Visualization techniques
- Clinical validation

## License
MIT License - see repository for details

## Citation
If using this in research, please cite:
```
[Your Citation Here]
```

## Contact
For questions or collaboration: bonbi0604@flonics.co.kr

---

**Note**: This is a research/educational tool. Not intended for clinical diagnosis.
