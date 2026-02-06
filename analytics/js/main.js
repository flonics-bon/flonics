import { WebGPURenderer } from './webgpu-renderer.js';
import { FlowDataManager } from './flow-data-manager.js';

class App {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.info = document.getElementById('info');
        this.renderer = null;
        this.dataManager = null;
        this.isRunning = false;
        
        this.init();
    }

    async init() {
        try {
            // WebGPU 지원 확인
            if (!navigator.gpu) {
                throw new Error('WebGPU가 지원되지 않는 브라우저입니다.');
            }

            this.info.textContent = 'WebGPU 초기화 중...';
            
            // WebGPU 렌더러 초기화
            this.renderer = new WebGPURenderer(this.canvas);
            await this.renderer.init();
            
            // Flow 데이터 매니저 초기화
            this.dataManager = new FlowDataManager();
            this.dataManager.generateSampleData();
            
            this.info.textContent = 'WebGPU 초기화 완료 - 준비됨';
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 초기 렌더링
            this.render();
            
        } catch (error) {
            console.error('초기화 오류:', error);
            this.info.textContent = `오류: ${error.message}`;
        }
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.start();
        });
        
        document.getElementById('stopBtn').addEventListener('click', () => {
            this.stop();
        });
        
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.reset();
        });
        
        // 윈도우 리사이즈 처리
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.info.textContent = '실행 중...';
            this.animate();
        }
    }

    stop() {
        this.isRunning = false;
        this.info.textContent = '정지됨';
    }

    reset() {
        this.stop();
        this.dataManager.reset();
        this.renderer.reset();
        this.render();
        this.info.textContent = '리셋 완료';
    }

    animate() {
        if (!this.isRunning) return;
        
        this.dataManager.update();
        this.render();
        
        requestAnimationFrame(() => this.animate());
    }

    render() {
        const flowData = this.dataManager.getCurrentData();
        this.renderer.render(flowData);
    }
}

// 앱 시작
new App();