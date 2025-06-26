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
        config: AnimationConfig & { entityWidth?: number; entityHeight?: number } = {}
    ): Promise<AnimatedSprite> {
        const frames = await AnimationUtils.getCachedFrames('explosion', async () => {
            // Load explosion animation texture (4x4 sprite sheet)
            const explosionTexture = await this.assetManager.loadTexture('assets/textures/animations/anim_hit.jpg');
            
            const explosionFrames: Texture[] = [];
            const frameWidth = explosionTexture.width / 4;
            const frameHeight = explosionTexture.height / 4;

            // Read frames in order: left to right, top to bottom
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const frameRect = new Rectangle(
                        col * frameWidth,
                        row * frameHeight,
                        frameWidth,
                        frameHeight
                    );
                    
                    const frame = new Texture(explosionTexture.baseTexture, frameRect);
                    explosionFrames.push(frame);
                }
            }
            
            return explosionFrames;
        });

        // Calculate scale based on entity size if provided
        let explosionScale = config.scale || 1.0;
        if (config.entityWidth && config.entityHeight) {
            // Scale explosion to be proportional to enemy size
            const avgEntitySize = (config.entityWidth + config.entityHeight) / 2;
            explosionScale = Math.max(0.5, Math.min(2.0, avgEntitySize / 60)); // Clamp between 0.5x and 2x
        }

        const explosion = AnimationUtils.createAnimatedSprite(frames, {
            speed: GameConfig.animation.defaultSpeeds.explosion,
            loop: config.loop !== undefined ? config.loop : false,
            autoPlay: config.autoPlay !== undefined ? config.autoPlay : true,
            scale: explosionScale,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });

        return explosion;
    }

    /**
     * Preload explosion animations
     */
    public async preloadAnimations(): Promise<void> {
        try {
            await AnimationUtils.getCachedFrames('explosion', async () => {
                const explosionTexture = await this.assetManager.loadTexture('assets/textures/animations/anim_hit.jpg');
                
                const explosionFrames: Texture[] = [];
                const frameWidth = explosionTexture.width / 4;
                const frameHeight = explosionTexture.height / 4;

                for (let row = 0; row < 4; row++) {
                    for (let col = 0; col < 4; col++) {
                        const frameRect = new Rectangle(
                            col * frameWidth,
                            row * frameHeight,
                            frameWidth,
                            frameHeight
                        );
                        
                        const frame = new Texture(explosionTexture.baseTexture, frameRect);
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