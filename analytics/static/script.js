let flowData = null;
let analysisResults = null;

document.getElementById('fileInput').addEventListener('change', handleFileUpload);
document.getElementById('analyzeBtn').addEventListener('click', analyzeFlow);
document.getElementById('visualizeBtn').addEventListener('click', visualizeResults);

async function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      flowData = JSON.parse(e.target.result);
      document.getElementById('status').textContent = `Loaded: ${file.name}`;
      document.getElementById('analyzeBtn').disabled = false;
    } catch (err) {
      document.getElementById('status').textContent = 'Error parsing file';
      console.error(err);
    }
  };
  reader.readAsText(file);
}

async function analyzeFlow() {
  if (!flowData) return;

  document.getElementById('status').textContent = 'Analyzing...';
  document.getElementById('analyzeBtn').disabled = true;

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ velocity: flowData.velocity })
    });

    if (!response.ok) throw new Error('Analysis failed');

    analysisResults = await response.json();
    displayResults(analysisResults);
    document.getElementById('visualizeBtn').disabled = false;
    document.getElementById('status').textContent = 'Analysis complete';
  } catch (err) {
    document.getElementById('status').textContent = 'Error during analysis';
    console.error(err);
  } finally {
    document.getElementById('analyzeBtn').disabled = false;
  }
}

function displayResults(results) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = `
    <h3>Flow Analysis Results</h3>
    <p>Mean Velocity: ${results.stats.mean_velocity.toFixed(3)} m/s</p>
    <p>Max Velocity: ${results.stats.max_velocity.toFixed(3)} m/s</p>
    <p>Mean Vorticity: ${results.stats.mean_vorticity.toFixed(3)} 1/s</p>
    <p>Max WSS: ${results.stats.max_wss.toFixed(3)} Pa</p>
  `;
}

function visualizeResults() {
  if (!analysisResults) return;

  const canvas = document.getElementById('visualizationCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 800;
  canvas.height = 600;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const magnitude = analysisResults.magnitude;
  if (!magnitude || magnitude.length === 0) return;

  const slice = magnitude[Math.floor(magnitude.length / 2)];
  const maxVal = analysisResults.stats.max_velocity;

  const cellWidth = canvas.width / slice[0].length;
  const cellHeight = canvas.height / slice.length;

  for (let i = 0; i < slice.length; i++) {
    for (let j = 0; j < slice[i].length; j++) {
      const val = slice[i][j];
      const intensity = Math.floor((val / maxVal) * 255);
      ctx.fillStyle = `rgb(${intensity}, 0, ${255 - intensity})`;
      ctx.fillRect(j * cellWidth, i * cellHeight, cellWidth, cellHeight);
    }
  }

  document.getElementById('status').textContent = 'Visualization rendered';
}