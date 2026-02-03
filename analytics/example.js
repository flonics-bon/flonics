// Example analytics code
function analyzeData(data) {
  return data.reduce((sum, val) => sum + val, 0) / data.length;
}

module.exports = { analyzeData };