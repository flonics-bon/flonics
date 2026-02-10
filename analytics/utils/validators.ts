export function validateFlowData(data: any): boolean {
return data && typeof data === 'object' && 'raw' in data;
}

export function validateDimensions(dims: number[]): boolean {
return Array.isArray(dims) && dims.length === 3 && dims.every(d => d > 0);
}