import { AnimatedSprite, Application } from 'pixi.js';
import { AnimationConfig } from '../core/AnimationConfig';
import { AnimationUtils } from '../core/AnimationUtils';
import { AssetManager } from '../../AssetManager';

export class CoinAnimator {
    private assetManager: AssetManager;
    private app?: Application;

    constructor(app?: Application) {
        this.assetManager = AssetManager.getInstance();
        this.app = app;
    }

    /**
     * Create Coin Animation (6 frames)
     */
    public async createCoinAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const frames = await AnimationUtils.getCachedFrames('coins', async () => {
            return await this.assetManager.loadCoins();
        });

        return AnimationUtils.createAnimatedSprite(frames, {
            speed: 0.2,
            loop: true,
            autoPlay: true,
            scale: 0.8,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Preload coin animations
     */
    public async preloadAnimations(): Promise<void> {
        console.log('🎬 Preloading coin animations...');
        
        try {
            await AnimationUtils.getCachedFrames('coins', () => this.assetManager.loadCoins());
            console.log('✅ Coin animations preloaded successfully!');
        } catch (error) {
            console.error('❌ Failed to preload coin animations:', error);
            throw error;
        }
    }
} 