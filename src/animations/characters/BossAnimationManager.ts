import { AnimatedSprite, Texture, Rectangle } from 'pixi.js';
import { BaseAnimationManager } from '../core/BaseAnimationManager';
import { AnimationConfig } from '../core/AnimationConfig';
import { AssetManager } from '../../managers/AssetManager';

/**
 * Boss Animation Manager
 * Chuyên quản lý animations cho boss
 */
export class BossAnimationManager extends BaseAnimationManager {
    private static instance: BossAnimationManager;

    private constructor() {
        super();
    }

    public static getInstance(): BossAnimationManager {
        if (!BossAnimationManager.instance) {
            BossAnimationManager.instance = new BossAnimationManager();
        }
        return BossAnimationManager.instance;
    }

    /**
     * Preload boss animations
     */
    public async preloadAnimations(): Promise<void> {
        console.log('🎬 Preloading boss animations...');
        await this.assetManager.loadTexture(AssetManager.paths.BOSS_ANIMATION);
        console.log('✅ Boss animations preloaded');
    }

    /**
     * Tạo Boss Animation (5 frames với pattern 0->4->0)
     */
    public async createBossAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        try {
            console.log('Loading boss animation...');
            const cacheKey = 'boss_animation';
            
            let frames: Texture[];
            if (this.cache.has(cacheKey)) {
                frames = this.cache.get(cacheKey)!;
            } else {
                frames = await this.createBossFrames();
                this.cache.set(cacheKey, frames);
            }

            const sprite = this.createAnimatedSprite(frames, {
                speed: 0.15,
                loop: true,
                autoPlay: true,
                scale: 0.5,
                anchor: { x: 0.5, y: 0.5 },
                ...config
            });
            
            console.log('✨ Boss animation created successfully!');
            return sprite;
        } catch (error) {
            console.error('❌ Error creating boss animation:', error);
            throw error;
        }
    }

    /**
     * Create boss frames from sprite sheet
     */
    private async createBossFrames(): Promise<Texture[]> {
        // Load boss sprite sheet
        const bossTexture = await this.assetManager.loadTexture(AssetManager.paths.BOSS_ANIMATION);
        console.log('Loaded boss texture:', bossTexture.width, 'x', bossTexture.height);
        
        // Create frames from sprite sheet (5 frames horizontally)
        const baseFrames: Texture[] = [];
        const frameWidth = bossTexture.width / 5;  // 5 frames
        const frameHeight = bossTexture.height;
        console.log('Frame dimensions:', frameWidth, 'x', frameHeight);

        // Extract each frame from the sprite sheet
        for (let i = 0; i < 5; i++) {
            const frame = new Texture(
                bossTexture.baseTexture,
                new Rectangle(
                    i * frameWidth,     // x position
                    0,                  // y position
                    frameWidth,         // width
                    frameHeight         // height
                )
            );
            baseFrames.push(frame);
            console.log(`✂️ Created frame ${i}:`, i * frameWidth, 0, frameWidth, frameHeight);
        }

        // Create the full animation sequence: 0->4 then 4->0
        const frames: Texture[] = [
            ...baseFrames,                    // Forward sequence (0->4)
            ...baseFrames.slice(1, -1).reverse()  // Reverse sequence without duplicating endpoints (3->1)
        ];
        console.log('🎞️ Total frames in sequence:', frames.length);

        return frames;
    }
} 