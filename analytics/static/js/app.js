import { FlowAnalyzer } from '../../core/flow-analyzer.js';
import { FlowVisualizer } from '../../visualization/flow-visualizer.js';

class App {
constructor() {
this.analyzer = new FlowAnalyzer();
this.visualizer = null;
this.canvas = document.getElementById('canvas');
}

async initialize() {
this.visualizer = new FlowVisualizer(this.canvas);
await this.visualizer.initialize();
this.setupEventListeners();
}

setupEventListeners() {
document.getElementById('loadBtn').addEventListener('click', () => this.loadData());
document.getElementById('analyzeBtn').addEventListener('click', () => this.analyze());
}

async loadData() {
const response = await fetch('/api/flow/data');
const data = await response.json();
this.currentData = data;
console.log('Data loaded:', data);
}

async analyze() {
if (!this.currentData) return;

const metrics = this.analyzer.analyze(this.currentData);
this.visualizer.visualize(metrics);
this.displayMetrics(metrics);
}

displayMetrics(metrics) {
document.getElementById('flowRate').textContent = metrics.flowRate.toFixed(2);
document.getElementById('maxVelocity').textContent = Math.max(...metrics.velocity.vx).toFixed(2);
}
}

const app = new App();
app.initialize();