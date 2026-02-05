# 4D Flow MRI Visualization

A WebGPU-based real-time visualization system for 4D Flow MRI data using particle-based flow rendering.

## Features

- **Real-time particle simulation** using WebGPU compute shaders
- **Pulsatile flow patterns** simulating cardiac blood flow
- **Interactive controls** for time phase, velocity threshold, particle density, and flow speed
- **Color-coded velocity visualization** using heat map (blue → cyan → green → yellow → red)
- **High performance** rendering with up to 10,000 particles at 60 FPS

## Requirements

- Modern browser with WebGPU support:
  - Chrome 113+ or Chrome Canary
  - Edge 113+ or Edge Canary
  - Safari Technology Preview (macOS)
- GPU with WebGPU support

## Usage

1. Open `index.html` in a WebGPU-enabled browser
2. Use the control panel to adjust visualization parameters:
   - **Time Phase**: Navigate through cardiac cycle (0-20 phases)
   - **Velocity Threshold**: Filter particles by velocity magnitude
   - **Particle Density**: Adjust number of particles (1,000-10,000)
   - **Flow Speed**: Control animation speed
3. Click **Play** to automatically cycle through time phases
4. Click **Reset** to regenerate particle positions

## Technical Details

### Architecture

- **Compute Shader**: Updates particle positions and velocities based on 4D flow field
- **Vertex Shader**: Applies perspective projection and computes color based on velocity
- **Fragment Shader**: Renders particles with velocity-based heat map coloring

### Flow Field Model

The visualization simulates a simplified cardiac flow pattern with:
- Helical flow components (spiral motion)
- Pulsatile temporal variations (systole/diastole)
- Radial and axial velocity components
- Boundary conditions with particle recycling

### Performance

- Uses GPU compute shaders for parallel particle updates
- Optimized buffer management for minimal CPU overhead
- Render pipeline with alpha blending for smooth visualization
- Real-time FPS monitoring

## File Structure

```
analytics/4dflow-visualization/
├── index.html              # Main HTML interface
├── flowVisualization.js    # WebGPU visualization engine
└── README.md              # This file
```

## Customization

### Modifying Flow Patterns

Edit the compute shader in `flowVisualization.js`:

```javascript
// Helical flow pattern
particle.velocity.x = -sin(theta + phase) * cos(z + t) * 0.05;
particle.velocity.y = cos(theta + phase) * cos(z + t) * 0.05;
particle.velocity.z = sin(t + phase) * 0.03;
```

### Adjusting Color Mapping

Modify the vertex shader color calculation:

```javascript
let r = clamp(normalizedSpeed * 2.0, 0.0, 1.0);
let g = clamp(sin(normalizedSpeed * 3.14159), 0.0, 1.0);
let b = clamp(1.0 - normalizedSpeed, 0.0, 1.0);
```

## Future Enhancements

- [ ] Import real 4D Flow MRI DICOM data
- [ ] Add streamline visualization mode
- [ ] Implement vector field glyph rendering
- [ ] Support for multiple vessel regions
- [ ] Export visualization as video/image sequence
- [ ] Wall shear stress calculation and visualization
- [ ] Interactive 3D camera controls (orbit, pan, zoom)

## References

- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [4D Flow MRI Clinical Applications](https://doi.org/10.1007/s00330-015-4119-z)
- [Particle-based Flow Visualization](https://doi.org/10.1109/TVCG.2012.104)

## License

MIT License - See repository root for details