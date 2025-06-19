import { AnimatedSprite } from 'pixi.js';
import { BaseAnimationManager } from '../core/BaseAnimationManager';
import { AnimationConfig } from '../core/AnimationConfig';

/**
 * Item Animation Manager
 * Chuyên quản lý animations cho items (coins, powerups, etc.)
 */
export class ItemAnimationManager extends BaseAnimationManager {
    private static instance: ItemAnimationManager;

    private constructor() {
        super();
    }

    public static getInstance(): ItemAnimationManager {
        if (!ItemAnimationManager.instance) {
            ItemAnimationManager.instance = new ItemAnimationManager();
        }
        return ItemAnimationManager.instance;
    }

    /**
     * Preload item animations
     */
    public async preloadAnimations(): Promise<void> {
        console.log('🎬 Preloading item animations...');
        
        await this.cache.preloadMultiple([
            {
                key: 'coins',
                loader: () => this.assetManager.loadCoins()
            }
        ]);
        
        console.log('✅ Item animations preloaded');
    }

    /**
     * Tạo Coin Animation (6 frames)
     */
    public async createCoinAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const frames = await this.getCoinFrames();
        return this.createAnimatedSprite(frames, {
            speed: 0.2,
            loop: true,
            autoPlay: true,
            scale: 0.8,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Helper: Get coin frames từ cache hoặc load mới
     */
    private async getCoinFrames() {
        const cacheKey = 'coins';
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const frames = await this.assetManager.loadCoins();
        this.cache.set(cacheKey, frames);
        return frames;
    }
} 