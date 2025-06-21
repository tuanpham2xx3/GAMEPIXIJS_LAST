import { AnimatedSprite, Texture, Sprite, Container, Application } from 'pixi.js';
import { AnimationConfig, AnimationCache } from './AnimationConfig';
import { AssetManager } from '../../AssetManager';

export class AnimationUtils {
    private static animationCache: AnimationCache = {};
    private static assetManager: AssetManager = AssetManager.getInstance();

    /**
     * Create AnimatedSprite with configuration
     */
    public static createAnimatedSprite(frames: Texture[], config: Required<AnimationConfig>): AnimatedSprite {
        const animatedSprite = new AnimatedSprite(frames);
        
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
    public static setupSprite(
        sprite: Sprite, 
        scale: number, 
        position: { x: number, y: number }, 
        setAnchor: boolean = true
    ): void {
        if (setAnchor) {
            sprite.anchor.set(0.5);
        }
        sprite.scale.set(scale);
        sprite.position.set(position.x, position.y);
    }

    /**
     * Setup animated part with gentle animations
     */
    public static setupAnimatedPart(
        app: Application | undefined,
        container: Container,
        part: Sprite,
        scale: number,
        position: { x: number, y: number },
        animationType: 'wing' | 'horn' | 'leg',
        enableAnimation: boolean,
        speed: number,
        multiplier: number = 1,
        isLeft: boolean = false
    ): void {
        AnimationUtils.setupSprite(part, scale, position, false);
        container.addChild(part);
        
        if (enableAnimation && app) {
            AnimationUtils.addGentleAnimation(app, part, animationType, speed * multiplier, isLeft);
        } else {
            part.anchor.set(0.5);
        }
    }

    /**
     * Add gentle animation to sprite parts
     */
    public static addGentleAnimation(
        app: Application,
        sprite: Sprite, 
        type: 'horn' | 'leg' | 'wing', 
        speed: number = 0.02, 
        isLeft: boolean = false
    ): void {
        // Set anchor points
        switch (type) {
            case 'horn':
                sprite.anchor.set(0.5, 1.0);
                break;
            case 'leg':
                sprite.anchor.set(0.5, 0.0);
                break;
            case 'wing':
                sprite.anchor.set(0.2, 0.5);
                break;
        }

        const originalRotation = sprite.rotation;
        let time = 0;

        const animationFn = () => {
            time += speed;
            const mirrorFactor = isLeft ? -1 : 1;
            
            switch (type) {
                case 'horn':
                    sprite.rotation = originalRotation + Math.sin(time) * 0.08 * mirrorFactor;
                    break;
                case 'leg':
                    sprite.rotation = originalRotation + Math.sin(time * 1.2) * 0.06 * mirrorFactor;
                    break;
                case 'wing':
                    sprite.rotation = originalRotation + Math.sin(time * 2) * 0.12 * mirrorFactor;
                    break;
            }
        };

        app.ticker.add(animationFn);
        (sprite as any)._animationFn = animationFn;
    }

    /**
     * Remove animation from sprite/container
     */
    public static removeAnimation(app: Application | undefined, target: Sprite | Container): void {
        if (!app || !target) return;
        
        const animationFn = (target as any)._animationFn || 
                          (target as any)._circleAnimationFn || 
                          (target as any)._warningAnimationFn || 
                          (target as any)._tutorialAnimationFn;
        
        if (animationFn) {
            app.ticker.remove(animationFn);
            delete (target as any)._animationFn;
            delete (target as any)._circleAnimationFn;
            delete (target as any)._warningAnimationFn;
            delete (target as any)._tutorialAnimationFn;
        }
    }

    /**
     * Get cached animation frames
     */
    public static async getCachedFrames(cacheKey: string, loader: () => Promise<Texture[]>): Promise<Texture[]> {
        if (AnimationUtils.animationCache[cacheKey]) {
            return AnimationUtils.animationCache[cacheKey];
        }

        const frames = await loader();
        AnimationUtils.animationCache[cacheKey] = frames;
        return frames;
    }

    /**
     * Clear animation cache
     */
    public static clearCache(): void {
        AnimationUtils.animationCache = {};
    }

    /**
     * Get cache info
     */
    public static getCacheInfo(): { [key: string]: number } {
        const info: { [key: string]: number } = {};
        Object.entries(AnimationUtils.animationCache).forEach(([key, frames]) => {
            info[key] = frames.length;
        });
        return info;
    }
} 