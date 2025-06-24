import { AnimatedSprite, Texture, Rectangle, Application } from 'pixi.js';
import { AnimationConfig } from '../core/AnimationConfig';
import { AnimationUtils } from '../core/AnimationUtils';
import { AssetManager } from '../../AssetManager';
import { GameConfig } from '../../../core/Config';

export class BasicEnemyAnimator {
    private assetManager: AssetManager;
    private app?: Application;

    constructor(app?: Application) {
        this.assetManager = AssetManager.getInstance();
        this.app = app;
    }

    /**
     * Create Enemy 1 Animation (20 frames)
     */
    public async createEnemy1Animation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const frames = await AnimationUtils.getCachedFrames('enemy_1', async () => {
            return await this.assetManager.loadEnemyAnimations(1);
        });

        return AnimationUtils.createAnimatedSprite(frames, {
            speed: GameConfig.animation.defaultSpeeds.enemy,
            loop: true,
            autoPlay: true,
            scale: 0.5,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Create Enemy 2 Animation (13 frames)
     */
    public async createEnemy2Animation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const frames = await AnimationUtils.getCachedFrames('enemy_2', async () => {
            return await this.assetManager.loadEnemyAnimations(2);
        });

        return AnimationUtils.createAnimatedSprite(frames, {
            speed: GameConfig.animation.defaultSpeeds.basic,
            loop: true,
            autoPlay: true,
            scale: 0.5,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Create Basic Animation (4 frames)
     */
    public async createBasicAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const frames = await AnimationUtils.getCachedFrames('basic_enemy', async () => {
            const basicFrames: Texture[] = [];
            for (let i = 0; i < 4; i++) {
                const texture = await this.assetManager.loadTexture(`assets/textures/characters/enemies/basic/enemy_01_${i}.png`);
                basicFrames.push(texture);
            }
            return basicFrames;
        });

        return AnimationUtils.createAnimatedSprite(frames, {
            speed: GameConfig.animation.defaultSpeeds.enemy,
            loop: true,
            autoPlay: true,
            scale: 0.5,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Create Boss Animation (5 frames with pattern 0->4->0)
     */
    public async createBossAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        try {
            const bossTexture = await this.assetManager.loadTexture(AssetManager.paths.BOSS_ANIMATION);
            
            const baseFrames: Texture[] = [];
            const frameWidth = bossTexture.width / 5;
            const frameHeight = bossTexture.height;

            // Extract frames from sprite sheet
            for (let i = 0; i < 5; i++) {
                const frame = new Texture(
                    bossTexture.baseTexture,
                    new Rectangle(
                        i * frameWidth,
                        0,
                        frameWidth,
                        frameHeight
                    )
                );
                baseFrames.push(frame);
            }

            // Create ping-pong animation: 0->4 then 4->0
            const frames: Texture[] = [
                ...baseFrames,
                ...baseFrames.slice(1, -1).reverse()
            ];

            const sprite = AnimationUtils.createAnimatedSprite(frames, {
                speed: GameConfig.animation.defaultSpeeds.basic,
                loop: true,
                autoPlay: true,
                scale: 0.5,
                anchor: { x: 0.5, y: 0.5 },
                ...config
            });
            
            return sprite;
        } catch (error) {
            console.error('❌ Error creating boss animation:', error);
            throw error;
        }
    }

    /**
     * Preload all basic enemy animations
     */
    public async preloadAnimations(): Promise<void> {
        try {
            await Promise.all([
                AnimationUtils.getCachedFrames('enemy_1', () => this.assetManager.loadEnemyAnimations(1)),
                AnimationUtils.getCachedFrames('enemy_2', () => this.assetManager.loadEnemyAnimations(2)),
                this.assetManager.loadTexture(AssetManager.paths.BOSS_ANIMATION)
            ]);
        } catch (error) {
            console.error('❌ Failed to preload basic enemy animations:', error);
            throw error;
        }
    }
} 