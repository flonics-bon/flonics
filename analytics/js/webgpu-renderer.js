export class WebGPURenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.device = null;
        this.context = null;
        this.pipeline = null;
        this.time = 0;
    }

    async init() {
        // GPU 어댑터 요청
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('GPU 어댑터를 찾을 수 없습니다.');
        }

        // GPU 디바이스 요청
        this.device = await adapter.requestDevice();
        
        // 캔버스 컨텍스트 설정
        this.context = this.canvas.getContext('webgpu');
        const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        
        this.context.configure({
            device: this.device,
            format: canvasFormat,
            alphaMode: 'opaque'
        });

        // 렌더 파이프라인 생성
        await this.createPipeline(canvasFormat);
        
        // 초기 리사이즈
        this.resize();
    }

    async createPipeline(format) {
        // 셰이더 코드
        const shaderCode = `
            struct VertexOutput {
                @builtin(position) position: vec4<f32>,
                @location(0) color: vec4<f32>,
            }

            @vertex
            fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
                var pos = array<vec2<f32>, 3>(
                    vec2<f32>(0.0, 0.5),
                    vec2<f32>(-0.5, -0.5),
                    vec2<f32>(0.5, -0.5)
                );
                
                var colors = array<vec4<f32>, 3>(
                    vec4<f32>(1.0, 0.0, 0.0, 1.0),
                    vec4<f32>(0.0, 1.0, 0.0, 1.0),
                    vec4<f32>(0.0, 0.0, 1.0, 1.0)
                );

                var output: VertexOutput;
                output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                output.color = colors[vertexIndex];
                return output;
            }

            @fragment
            fn fragmentMain(input: VertexOutput) -> @location(0) vec4<f32> {
                return input.color;
            }
        `;

        const shaderModule = this.device.createShaderModule({
            code: shaderCode
        });

        this.pipeline = this.device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: shaderModule,
                entryPoint: 'vertexMain'
            },
            fragment: {
                module: shaderModule,
                entryPoint: 'fragmentMain',
                targets: [{ format: format }]
            },
            primitive: {
                topology: 'triangle-list'
            }
        });
    }

    render(flowData) {
        const commandEncoder = this.device.createCommandEncoder();
        const textureView = this.context.getCurrentTexture().createView();

        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: textureView,
                clearValue: { r: 0.1, g: 0.1, b: 0.15, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });

        renderPass.setPipeline(this.pipeline);
        renderPass.draw(3);
        renderPass.end();

        this.device.queue.submit([commandEncoder.finish()]);
        
        this.time += 0.016;
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.canvas.clientWidth * dpr;
        this.canvas.height = this.canvas.clientHeight * dpr;
    }

    reset() {
        this.time = 0;
    }
}