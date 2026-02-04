// 4D Flow MRI Visualization - WebGPU Implementation

class MRIVisualization {
    constructor() {
        this.canvas = document.getElementById('webgpu-canvas');
        this.device = null;
        this.context = null;
        this.isPlaying = false;
        this.animationFrame = null;
        
        this.init();
    }
    
    async init() {
        // WebGPU 지원 체크
        if (!navigator.gpu) {
            console.error('WebGPU not supported');
            alert('이 브라우저는 WebGPU를 지원하지 않습니다. Chrome Canary 또는 최신 브라우저를 사용해주세요.');
            return;
        }
        
        try {
            // GPU 어댑터 및 디바이스 초기화
            const adapter = await navigator.gpu.requestAdapter();
            this.device = await adapter.requestDevice();
            
            this.context = this.canvas.getContext('webgpu');
            const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
            
            this.context.configure({
                device: this.device,
                format: canvasFormat,
            });
            
            console.log('WebGPU initialized successfully');
            this.setupEventListeners();
            this.render();
            
        } catch (error) {
            console.error('Failed to initialize WebGPU:', error);
        }
    }
    
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.start();
        });
        
        document.getElementById('playBtn').addEventListener('click', () => {
            this.play();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pause();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });
    }
    
    start() {
        console.log('Starting visualization...');
        this.play();
        // 시작 섹션으로 스크롤
        document.querySelector('.demo').scrollIntoView({ behavior: 'smooth' });
    }
    
    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.animate();
            console.log('Playing...');
        }
    }
    
    pause() {
        this.isPlaying = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        console.log('Paused');
    }
    
    reset() {
        this.pause();
        this.render();
        console.log('Reset');
    }
    
    render() {
        if (!this.device) return;
        
        const encoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();
        
        const renderPass = encoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store',
            }]
        });
        
        renderPass.end();
        
        const commandBuffer = encoder.finish();
        this.device.queue.submit([commandBuffer]);
    }
    
    animate() {
        if (!this.isPlaying) return;
        
        this.render();
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
}

// DOM 로드 완료 후 초기화
document.addEventListener('DOMContentLoaded', () => {
    const visualization = new MRIVisualization();
    console.log('4D Flow MRI Visualization loaded');
});
