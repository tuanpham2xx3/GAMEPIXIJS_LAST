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
    public async createExplosionAnimation(
        x: number, 
        y: number, 
        scale: number = 1.0, 
        config: AnimationConfig = {}
    ): Promise<AnimatedSprite> {
        const frames = await AnimationUtils.getCachedFrames('explosion', async () => {
            // Load hit animation texture (4x4 sprite sheet)
            const hitTexture = await this.assetManager.loadTexture(AssetManager.paths.HIT_ANIMATION);
            
            const explosionFrames: Texture[] = [];
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
                    explosionFrames.push(frame);
                }
            }
            
            return explosionFrames;
        });

        const explosionScale = scale * (config.scale || 1.0);

        const explosion = AnimationUtils.createAnimatedSprite(frames, {
            speed: GameConfig.animation.defaultSpeeds.explosion,
            loop: false,
            autoPlay: true,
            scale: explosionScale,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });

        explosion.x = x;
        explosion.y = y;

        return explosion;
    }

    /**
     * Preload explosion animations
     */
    public async preloadAnimations(): Promise<void> {
        try {
            await AnimationUtils.getCachedFrames('explosion', async () => {
                const hitTexture = await this.assetManager.loadTexture(AssetManager.paths.HIT_ANIMATION);
                
                const explosionFrames: Texture[] = [];
                const frameWidth = hitTexture.width / 4;
                const frameHeight = hitTexture.height / 4;

                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        const frameRect = new Rectangle(
                            col * frameWidth,
                            row * frameHeight,
                            frameWidth,
                            frameHeight
                        );
                        
                        const frame = new Texture(hitTexture.baseTexture, frameRect);
                        explosionFrames.push(frame);
                    }
                }
                
                return explosionFrames;
            });
        } catch (error) {
            console.error('❌ Failed to preload explosion animations:', error);
            throw error;
        }
    }
} 