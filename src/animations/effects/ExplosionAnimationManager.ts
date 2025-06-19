import { AnimatedSprite, Texture, Rectangle } from 'pixi.js';
import { BaseAnimationManager } from '../core/BaseAnimationManager';
import { ExplosionAnimationConfig } from '../core/AnimationConfig';

/**
 * Explosion Animation Manager
 * Chuyên quản lý tất cả effect animations (explosion, hit, etc.)
 */
export class ExplosionAnimationManager extends BaseAnimationManager {
    private static instance: ExplosionAnimationManager;

    private constructor() {
        super();
    }

    public static getInstance(): ExplosionAnimationManager {
        if (!ExplosionAnimationManager.instance) {
            ExplosionAnimationManager.instance = new ExplosionAnimationManager();
        }
        return ExplosionAnimationManager.instance;
    }

    /**
     * Preload explosion animations
     */
    public async preloadAnimations(): Promise<void> {
        console.log('🎬 Preloading explosion animations...');
        await this.assetManager.loadTexture('/assets/textures/animations/anim_hit.jpg');
        console.log('✅ Explosion animations preloaded');
    }

    /**
     * Tạo Hit Effect Animation (4x4 sprite sheet)
     */
    public async createExplosionAnimation(config: ExplosionAnimationConfig = {}): Promise<AnimatedSprite> {
        const cacheKey = 'explosion_frames';
        
        let frames: Texture[];
        if (this.cache.has(cacheKey)) {
            frames = this.cache.get(cacheKey)!;
        } else {
            frames = await this.createExplosionFrames();
            this.cache.set(cacheKey, frames);
        }
        
        // Calculate scale based on entity size if provided
        let explosionScale = config.scale || 1.0;
        if (config.entityWidth && config.entityHeight) {
            // Scale explosion to be slightly larger than the entity
            const entityMaxSize = Math.max(config.entityWidth, config.entityHeight);
            const explosionBaseSize = 64; // Estimated base size for explosion frames
            explosionScale = (entityMaxSize * 2.5) / explosionBaseSize; // 2.5x for visual impact
        }
        
        return this.createAnimatedSprite(frames, {
            speed: 0.4,          // Nhanh hơn để hiệu ứng hit mượt
            loop: false,         // Chỉ chạy 1 lần
            autoPlay: true,
            scale: explosionScale,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Create simple hit effect (without sprite sheet)
     */
    public async createSimpleHitEffect(config: ExplosionAnimationConfig = {}): Promise<AnimatedSprite> {
        // Create a simple 2-frame flashing effect
        const frames: Texture[] = [];
        
        try {
            // Try to use a simple texture for flash effect
            const hitTexture = await this.assetManager.loadTexture('/assets/textures/ui/hit_flash.png');
            frames.push(hitTexture, hitTexture); // Duplicate for flash effect
        } catch (error) {
            // Fallback: reuse explosion frames
            return this.createExplosionAnimation(config);
        }

        return this.createAnimatedSprite(frames, {
            speed: 0.8,          // Very fast flash
            loop: false,
            autoPlay: true,
            scale: config.scale || 1.5,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Create explosion frames from 4x4 sprite sheet
     */
    private async createExplosionFrames(): Promise<Texture[]> {
        const hitTexture = await this.assetManager.loadTexture('/assets/textures/animations/anim_hit.jpg');
        
        // Tạo frames từ sprite sheet 4x4
        const frames: Texture[] = [];
        const frameWidth = hitTexture.width / 4;  // 4 columns
        const frameHeight = hitTexture.height / 4; // 4 rows

        // Đọc frames theo thứ tự từ trái qua phải, trên xuống dưới
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const frame = new Texture(
                    hitTexture.baseTexture,
                    new Rectangle(
                        col * frameWidth,    // x position
                        row * frameHeight,   // y position
                        frameWidth,          // width
                        frameHeight          // height
                    )
                );
                frames.push(frame);
            }
        }

        console.log(`🎆 Created ${frames.length} explosion frames`);
        return frames;
    }

    /**
     * Create multiple explosion animations at once
     */
    public async createMultipleExplosions(
        count: number, 
        config: ExplosionAnimationConfig = {}
    ): Promise<AnimatedSprite[]> {
        const explosions: AnimatedSprite[] = [];
        
        for (let i = 0; i < count; i++) {
            explosions.push(await this.createExplosionAnimation(config));
        }
        
        console.log(`💥 Created ${count} explosion animations`);
        return explosions;
    }
} 