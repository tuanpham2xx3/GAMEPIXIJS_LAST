import * as PIXI from 'pixi.js';
import { AssetManager } from '../../AssetManager';
import { GameConfig } from '../../../core/Config';

export class WarningGlowManager {
    private static instance: WarningGlowManager;
    private glowContainer: PIXI.Container;
    private glowSprites: PIXI.Sprite[] = [];
    private isActive: boolean = false;
    private animationTime: number = 0;
    private app: PIXI.Application;
    
    // Cấu hình hiệu ứng
    private readonly GLOW_DURATION = 1500; // 1.5 giây
    private readonly BLINK_CYCLE_DURATION = 800; // Thời gian 1 cycle (ms): visible + invisible - CHẬM HỚN
    private readonly VISIBLE_DURATION = 300; // Thời gian hiện (ms) - DÀI HỚN
    private readonly INVISIBLE_DURATION = 500; // Thời gian biến mất (ms) - DÀI HỚN
    private readonly GLOW_ALPHA = 0.7; // Alpha khi hiện

    private constructor(app: PIXI.Application) {
        this.app = app;
        this.glowContainer = new PIXI.Container();
        this.glowContainer.name = 'warningGlowContainer';
        this.glowContainer.zIndex = 100; // Đảm bảo hiển thị trên cùng
    }

    public static getInstance(app?: PIXI.Application): WarningGlowManager {
        if (!WarningGlowManager.instance) {
            if (!app) throw new Error('App required for first initialization');
            WarningGlowManager.instance = new WarningGlowManager(app);
        }
        return WarningGlowManager.instance;
    }

    public async initializeGlowSprites(): Promise<void> {
        try {
            // Load texture warning glow với multiple paths
            const assetManager = AssetManager.getInstance();
            let glowTexture;
            
            const texturePaths = [
                'assets/textures/misc/spr_glow_warning.png',
                '/assets/textures/misc/spr_glow_warning.png',
                './assets/textures/misc/spr_glow_warning.png',
                '/public/assets/textures/misc/spr_glow_warning.png'
            ];
            
            for (const path of texturePaths) {
                try {
                    console.log(`Trying to load warning glow texture from: ${path}`);
                    glowTexture = await assetManager.loadTexture(path);
                    console.log(`✅ Successfully loaded warning glow texture from: ${path}`);
                    break;
                } catch (e) {
                    console.log(`❌ Failed to load from: ${path}`);
                    continue;
                }
            }
            
            if (!glowTexture) {
                throw new Error('All texture paths failed');
            }

            // Tính toán số lượng sprite cần thiết để bao phủ màn hình
            const screenWidth = GameConfig.screen.width;
            const screenHeight = GameConfig.screen.height;
            const textureWidth = glowTexture.width;
            const textureHeight = glowTexture.height;

            console.log(`Initializing warning glow: Screen ${screenWidth}x${screenHeight}, Texture ${textureWidth}x${textureHeight}`);

            // Tạo glow sprites cho 4 cạnh màn hình
            this.createEdgeGlowSprites(glowTexture, screenWidth, screenHeight, textureWidth, textureHeight);

        } catch (error) {
            console.error('Failed to load warning glow texture from all paths:', error);
            console.log('Using fallback graphics instead');
            this.createFallbackGlow();
        }
    }

    private createEdgeGlowSprites(texture: PIXI.Texture, screenW: number, screenH: number, texW: number, texH: number): void {
        // Xóa sprites cũ nếu có
        this.glowSprites.forEach(sprite => sprite.destroy());
        this.glowSprites = [];
        this.glowContainer.removeChildren();

        // Tạo 1 sprite duy nhất cho toàn màn hình
        const glowSprite = new PIXI.Sprite(texture);
        
        // Set anchor ở center
        glowSprite.anchor.set(0.5);
        
        // Position ở center màn hình
        glowSprite.x = screenW / 2;
        glowSprite.y = screenH / 2;
        
        // Scale để cover toàn bộ màn hình
        const scaleX = screenW / texW;
        const scaleY = screenH / texH;
        const scale = Math.max(scaleX, scaleY); // Đảm bảo cover hoàn toàn
        
        glowSprite.scale.set(scale);
        
        // Initial state
        glowSprite.alpha = 0;
        glowSprite.visible = false;
        
        // Add to arrays và container
        this.glowSprites.push(glowSprite);
        this.glowContainer.addChild(glowSprite);

        console.log(`Created single warning glow sprite scaled ${scale.toFixed(2)}x (${screenW}x${screenH} screen, ${texW}x${texH} texture)`);
    }

    private createFallbackGlow(): void {
        // Tạo fallback glow bằng 1 graphics overlay duy nhất cho toàn màn hình
        const screenW = GameConfig.screen.width;
        const screenH = GameConfig.screen.height;

        // Tạo 1 overlay duy nhất với gradient from edges
        const overlay = new PIXI.Graphics();
        
        // Background với gradient red glow từ edges
        overlay.beginFill(0xFF3333, 0.6);
        overlay.drawRect(0, 0, screenW, screenH);
        overlay.endFill();
        
        // Add stronger glow ở edges
        const borderSize = 60;
        
        // Top edge glow
        overlay.beginFill(0xFF6666, 0.8);
        overlay.drawRect(0, 0, screenW, borderSize);
        overlay.endFill();
        
        // Bottom edge glow  
        overlay.beginFill(0xFF6666, 0.8);
        overlay.drawRect(0, screenH - borderSize, screenW, borderSize);
        overlay.endFill();
        
        // Left edge glow
        overlay.beginFill(0xFF6666, 0.8);
        overlay.drawRect(0, 0, borderSize, screenH);
        overlay.endFill();
        
        // Right edge glow
        overlay.beginFill(0xFF6666, 0.8);
        overlay.drawRect(screenW - borderSize, 0, borderSize, screenH);
        overlay.endFill();
        
        // Position và state
        overlay.x = 0;
        overlay.y = 0;
        overlay.alpha = 0;
        overlay.visible = false;
        
        this.glowContainer.addChild(overlay);

        console.log('Created single fallback warning glow overlay');
    }

    public startWarningGlow(): void {
        if (this.isActive) return;
        
        this.isActive = true;
        this.animationTime = 0;
        
        // Reset và show single sprite/graphic
        if (this.glowContainer.children.length > 0) {
            const glowElement = this.glowContainer.children[0] as any;
            glowElement.alpha = this.GLOW_ALPHA;
            glowElement.visible = true;
        }

        console.log('Warning glow started');
    }

    public stopWarningGlow(): void {
        this.isActive = false;
        
        // Hide single sprite/graphic
        if (this.glowContainer.children.length > 0) {
            const glowElement = this.glowContainer.children[0] as any;
            glowElement.alpha = 0;
            glowElement.visible = false;
        }

        console.log('Warning glow stopped');
    }

    public update(deltaTime: number): void {
        if (!this.isActive) return;

        this.animationTime += deltaTime * 1000; // Convert to milliseconds

        // Discrete blinking pattern: visible -> invisible -> pause -> repeat
        const cycleProgress = this.animationTime % this.BLINK_CYCLE_DURATION;
        
        let alpha = 0;
        if (cycleProgress < this.VISIBLE_DURATION) {
            // Visible phase
            alpha = this.GLOW_ALPHA;
        } else {
            // Invisible phase (includes pause)
            alpha = 0;
        }

        // Áp dụng alpha cho single sprite/graphic
        if (this.glowContainer.children.length > 0) {
            const glowElement = this.glowContainer.children[0] as any;
            glowElement.alpha = alpha;
        }
    }

    public getContainer(): PIXI.Container {
        return this.glowContainer;
    }

    public isGlowActive(): boolean {
        return this.isActive;
    }

    // Method để resize khi màn hình thay đổi kích thước
    public async onResize(newWidth: number, newHeight: number): Promise<void> {
        GameConfig.screen.width = newWidth;
        GameConfig.screen.height = newHeight;
        
        // Tái tạo glow sprites với kích thước mới
        if (this.glowSprites.length > 0) {
            await this.initializeGlowSprites();
        }
    }

    public destroy(): void {
        this.stopWarningGlow();
        this.glowSprites.forEach(sprite => sprite.destroy());
        this.glowSprites = [];
        this.glowContainer.destroy();
    }
} 