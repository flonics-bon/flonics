class FlowVisualization {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.container.appendChild(this.renderer.domElement);

    this.camera.position.z = 5;
    this.flowData = null;
    this.particles = null;
    this.timeStep = 0;

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    window.addEventListener('resize', () => this.onResize());
  }

  loadFlowData(data) {
    this.flowData = data;
    this.createParticles();
  }

  createParticles() {
    if (!this.flowData) return;

    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const { velocity, dimensions } = this.flowData;
    const { x, y, z } = dimensions;

    for (let i = 0; i < x; i += 2) {
      for (let j = 0; j < y; j += 2) {
        for (let k = 0; k < z; k += 2) {
          positions.push(i - x / 2, j - y / 2, k - z / 2);

          const vx = velocity[i]?.[j]?.[k]?.[0] || 0;
          const vy = velocity[i]?.[j]?.[k]?.[1] || 0;
          const vz = velocity[i]?.[j]?.[k]?.[2] || 0;
          const mag = Math.sqrt(vx * vx + vy * vy + vz * vz);

          const normalized = Math.min(mag / 2.0, 1.0);
          colors.push(normalized, 0, 1 - normalized);
        }
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 0.1, vertexColors: true });
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.particles) {
      this.particles.rotation.y += 0.005;
      this.timeStep = (this.timeStep + 1) % 100;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    this.animate();
  }
}

const viz = new FlowVisualization('visualization-container');

fetch('/data/sample-flow.json')
  .then(res => res.json())
  .then(data => {
    viz.loadFlowData(data);
    viz.start();
  })
  .catch(err => console.error('Failed to load flow data:', err));