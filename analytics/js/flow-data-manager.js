export class FlowDataManager {
    constructor() {
        this.flowData = null;
        this.currentFrame = 0;
        this.totalFrames = 30;
        this.velocityField = null;
    }

    generateSampleData() {
        // 샘플 4D Flow 데이터 생성 (x, y, z, time)
        const gridSize = 32;
        this.velocityField = {
            dimensions: { x: gridSize, y: gridSize, z: gridSize },
            frames: this.totalFrames,
            data: []
        };

        // 각 프레임에 대한 속도 벡터 생성
        for (let t = 0; t < this.totalFrames; t++) {
            const frameData = [];
            
            for (let z = 0; z < gridSize; z++) {
                for (let y = 0; y < gridSize; y++) {
                    for (let x = 0; x < gridSize; x++) {
                        // 간단한 회전 유동 패턴
                        const cx = gridSize / 2;
                        const cy = gridSize / 2;
                        const cz = gridSize / 2;
                        
                        const dx = x - cx;
                        const dy = y - cy;
                        const dz = z - cz;
                        
                        const phase = (t / this.totalFrames) * Math.PI * 2;
                        
                        const vx = -dy * Math.cos(phase) * 0.1;
                        const vy = dx * Math.cos(phase) * 0.1;
                        const vz = Math.sin(phase) * 0.05;
                        
                        const magnitude = Math.sqrt(vx*vx + vy*vy + vz*vz);
                        
                        frameData.push({
                            position: { x, y, z },
                            velocity: { vx, vy, vz },
                            magnitude: magnitude
                        });
                    }
                }
            }
            
            this.velocityField.data.push(frameData);
        }
    }

    update() {
        this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    }

    getCurrentData() {
        if (!this.velocityField || !this.velocityField.data[this.currentFrame]) {
            return null;
        }
        
        return {
            frame: this.currentFrame,
            totalFrames: this.totalFrames,
            data: this.velocityField.data[this.currentFrame],
            dimensions: this.velocityField.dimensions
        };
    }

    reset() {
        this.currentFrame = 0;
    }

    getFrameData(frameIndex) {
        if (frameIndex >= 0 && frameIndex < this.totalFrames) {
            return this.velocityField.data[frameIndex];
        }
        return null;
    }
}