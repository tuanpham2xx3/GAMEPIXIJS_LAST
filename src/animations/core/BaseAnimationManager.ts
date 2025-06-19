import { AnimatedSprite, Texture, Sprite, Application } from 'pixi.js';
import { AnimationConfig, PartType } from './AnimationConfig';
import { AnimationCache } from './AnimationCache';
import { AssetManager } from '../../managers/AssetManager';

/**
 * Base Animation Manager
 * Class cơ sở cho tất cả animation managers
 */
export abstract class BaseAnimationManager {
    protected assetManager: AssetManager;
    protected cache: AnimationCache;
    protected app?: Application;

    constructor() {
        this.assetManager = AssetManager.getInstance();
        this.cache = AnimationCache.getInstance();
    }

    /**
     * Initialize with Application for ticker animations
     */
    public initWithApp(app: Application): void {
        this.app = app;
    }

    /**
     * Create animated sprite with configuration
     */
    protected createAnimatedSprite(frames: Texture[], config: Required<AnimationConfig>): AnimatedSprite {
        const animatedSprite = new AnimatedSprite(frames);
        
        // Apply configuration
        animatedSprite.animationSpeed = config.speed;
        animatedSprite.loop = config.loop;
        animatedSprite.scale.set(config.scale);
        animatedSprite.anchor.set(config.anchor.x, config.anchor.y);
        
        if (config.autoPlay) {
            animatedSprite.play();
        }

        return animatedSprite;
    }

    /**
     * Setup sprite with basic properties
     */
    protected setupSprite(sprite: Sprite, scale: number, position: { x: number, y: number }, setAnchor: boolean = true): void {
        if (setAnchor) {
            sprite.anchor.set(0.5);
        }
        sprite.scale.set(scale);
        sprite.position.set(position.x, position.y);
    }

    /**
     * Add gentle animation to sprite parts with proper anchor points and mirroring
     */
    protected addGentleAnimation(sprite: Sprite, type: PartType, speed: number = 0.02, isLeft: boolean = false): void {
        if (!this.app) return;

        // Set anchor points so base stays fixed and tip moves
        switch (type) {
            case 'horn':
                sprite.anchor.set(0.5, 1.0); // Base at bottom, tip moves
                break;
            case 'leg':
                sprite.anchor.set(0.5, 0.0); // Base at top, tip moves
                break;
            case 'wing':
                sprite.anchor.set(0.2, 0.5); // Base near body, tip moves
                break;
        }

        const originalRotation = sprite.rotation;
        let time = 0; // Start from same phase for synchronization

        const animationFn = () => {
            time += speed;
            
            // Mirror factor: left parts move opposite to right parts
            const mirrorFactor = isLeft ? -1 : 1;
            
            switch (type) {
                case 'horn':
                    // Horns sway gently from base, mirrored
                    sprite.rotation = originalRotation + Math.sin(time) * 0.08 * mirrorFactor;
                    break;
                case 'leg':
                    // Legs swing from top, mirrored
                    sprite.rotation = originalRotation + Math.sin(time * 1.2) * 0.06 * mirrorFactor;
                    break;
                case 'wing':
                    // Wings flap from base near body, mirrored
                    sprite.rotation = originalRotation + Math.sin(time * 2) * 0.12 * mirrorFactor;
                    break;
            }
        };

        this.app.ticker.add(animationFn);
        
        // Store reference to remove later if needed
        (sprite as any)._animationFn = animationFn;
    }

    /**
     * Remove animation from sprite/container
     */
    public removeAnimation(target: Sprite): void {
        if (!this.app || !target) return;
        
        const animationFn = (target as any)._animationFn;
        
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            delete (target as any)._animationFn;
        }
    }

    /**
     * Apply default config values
     */
    protected applyDefaultConfig<T extends AnimationConfig>(config: T, defaults: Required<AnimationConfig>): Required<T> {
        return {
            ...defaults,
            ...config
        } as Required<T>;
    }

    /**
     * Load enemy parts from assets
     */
    protected async loadEnemyParts(enemyType: string): Promise<{ [key: string]: Texture }> {
        console.log(`Loading enemy parts for: ${enemyType}`);
        const basePath = `assets/textures/characters/enemies/${enemyType}/enemy_${enemyType}_`;
        const parts: { [key: string]: Texture } = {};

        // Load body
        try {
            console.log(`Loading body: ${basePath}body.png`);
            parts.body = await this.assetManager.loadTexture(basePath + 'body.png');
            console.log(`Body loaded successfully for ${enemyType}`);
        } catch (error) {
            console.warn(`No body found for ${enemyType}:`, error);
        }

        // Load wings nếu có
        try {
            parts.wing_l = await this.assetManager.loadTexture(basePath + 'wing_l.png');
            parts.wing_r = await this.assetManager.loadTexture(basePath + 'wing_r.png');
            console.log(`✅ Wings loaded for ${enemyType}`);
        } catch (error) {
            console.log(`ℹ️ No wings found for ${enemyType} (this is normal for some enemy types)`);
        }

        // Load horns nếu có
        try {
            parts.horn_l = await this.assetManager.loadTexture(basePath + 'horn_l.png');
            parts.horn_r = await this.assetManager.loadTexture(basePath + 'horn_r.png');
        } catch (error) {
            console.log(`No horns found for ${enemyType}`);
        }

        // Load legs
        try {
            parts.leg_l = await this.assetManager.loadTexture(basePath + 'leg_l.png');
            parts.leg_r = await this.assetManager.loadTexture(basePath + 'leg_r.png');
            
            // Check for additional leg parts
            try {
                parts.leg_1_l = await this.assetManager.loadTexture(basePath + 'leg_1_l.png');
                parts.leg_1_r = await this.assetManager.loadTexture(basePath + 'leg_1_r.png');
            } catch (error) {
                console.log(`No additional leg parts found for ${enemyType}`);
            }
        } catch (error) {
            console.log(`No legs found for ${enemyType}`);
        }

        return parts;
    }
} 