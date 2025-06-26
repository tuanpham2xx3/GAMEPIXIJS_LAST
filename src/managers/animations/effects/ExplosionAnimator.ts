import { AnimatedSprite, Texture, Rectangle, Application } from 'pixi.js';
import { AnimationConfig } from '../core/AnimationConfig';
import { AnimationUtils } from '../core/AnimationUtils';
import { AssetManager } from '../../AssetManager';
import { GameConfig } from '../../../core/Config';

export class ExplosionAnimator {
    private assetManager: AssetManager;
    private app?: Application;

    constructor(app?: Application) {
        this.assetManager = AssetManager.getInstance();
        this.app = app;
    }

    /**
     * Create Explosion Animation (4x4 sprite sheet)
     */
    public async createExplosionAnimation(config: AnimationConfig & { entityWidth?: number; entityHeight?: number } = {}): Promise<AnimatedSprite> {
        try {
            const hitTexture = await this.assetManager.loadTexture('assets/textures/animations/anim_hit.jpg');
            
            // Create frames from sprite sheet 4x4
            const frames: Texture[] = [];
            const frameWidth = hitTexture.width / 4;
            const frameHeight = hitTexture.height / 4;

            // Read frames in order: left to right, top to bottom
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const frameRect = new Rectangle(
                        col * frameWidth,
                        row * frameHeight,
                        frameWidth,
                        frameHeight
                    );
                    
                    const frame = new Texture(hitTexture.baseTexture, frameRect);
                    frames.push(frame);
                }
            }
            
            // Calculate scale based on entity size if provided
            let explosionScale = config.scale || 1.0;
            if (config.entityWidth && config.entityHeight) {
                const entityMaxSize = Math.max(config.entityWidth, config.entityHeight);
                const explosionBaseSize = Math.max(frameWidth, frameHeight);
                explosionScale = (entityMaxSize * 1.5) / explosionBaseSize;
            }
            
            console.log(`Creating explosion with ${frames.length} frames, scale: ${explosionScale}`);
            
            return AnimationUtils.createAnimatedSprite(frames, {
                speed: GameConfig.animation.effects.explosionSpeed,
                loop: false,
                autoPlay: true,
                scale: explosionScale,
                anchor: { x: 0.5, y: 0.5 },
                ...config
            });
        } catch (error) {
            console.error('Failed to load explosion texture, creating fallback:', error);
            
            // Fallback: create simple explosion texture
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d')!;
            
            // Draw simple explosion circle
            ctx.fillStyle = '#FF6600';
            ctx.beginPath();
            ctx.arc(32, 32, 30, 0, Math.PI * 2);
            ctx.fill();
            
            const fallbackTexture = Texture.from(canvas);
            const frames = [fallbackTexture];
            
            return AnimationUtils.createAnimatedSprite(frames, {
                speed: GameConfig.animation.effects.uiFadeSpeed,
                loop: false,
                autoPlay: true,
                scale: config.scale || 1.0,
                anchor: { x: 0.5, y: 0.5 },
                ...config
            });
        }
    }

    /**
     * Preload explosion animations
     */
    public async preloadAnimations(): Promise<void> {
        console.log('🎬 Preloading explosion animations...');
        
        try {
            await this.assetManager.loadTexture('assets/textures/animations/anim_hit.jpg');
            console.log('✅ Explosion animations preloaded successfully!');
        } catch (error) {
            console.error('❌ Failed to preload explosion animations:', error);
            throw error;
        }
    }
} 