import { FlowData } from '../types/flow-types';

export class DataProcessor {
process(data: FlowData): Float32Array {
const normalized = this.normalize(data.raw);
const filtered = this.applyFilter(normalized);
return filtered;
}

private normalize(data: Float32Array): Float32Array {
const result = new Float32Array(data.length);
let max = -Infinity, min = Infinity;

for (let i = 0; i < data.length; i++) {
if (data[i] > max) max = data[i];
if (data[i] < min) min = data[i];
}

const range = max - min;
for (let i = 0; i < data.length; i++) {
result[i] = (data[i] - min) / range;
}

return result;
}

private applyFilter(data: Float32Array): Float32Array {
const result = new Float32Array(data.length);
const kernel = [0.25, 0.5, 0.25];

for (let i = 1; i < data.length - 1; i++) {
result[i] = data[i - 1] * kernel[0] + data[i] * kernel[1] + data[i + 1] * kernel[2];
}

result[0] = data[0];
result[data.length - 1] = data[data.length - 1];

return result;
}
}