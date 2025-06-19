import { AnimatedSprite, Container, Sprite } from 'pixi.js';
import { BaseAnimationManager } from '../core/BaseAnimationManager';
import { AnimationConfig, EnemyPartConfig, EnemyType } from '../core/AnimationConfig';

/**
 * Enemy Animation Manager
 * Chuyên quản lý tất cả animations cho enemies
 */
export class EnemyAnimationManager extends BaseAnimationManager {
    private static instance: EnemyAnimationManager;

    private constructor() {
        super();
    }

    public static getInstance(): EnemyAnimationManager {
        if (!EnemyAnimationManager.instance) {
            EnemyAnimationManager.instance = new EnemyAnimationManager();
        }
        return EnemyAnimationManager.instance;
    }

    /**
     * Preload enemy animations
     */
    public async preloadAnimations(): Promise<void> {
        console.log('🎬 Preloading enemy animations...');
        
        await this.cache.preloadMultiple([
            {
                key: 'enemy_1',
                loader: () => this.assetManager.loadEnemyAnimations(1)
            },
            {
                key: 'enemy_2',
                loader: () => this.assetManager.loadEnemyAnimations(2)
            }
        ]);
        
        console.log('✅ Enemy animations preloaded');
    }

    /**
     * Tạo Enemy 1 Animation (20 frames)
     */
    public async createEnemy1Animation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const frames = await this.getEnemyFrames(1);
        return this.createAnimatedSprite(frames, {
            speed: 0.1,
            loop: true,
            autoPlay: true,
            scale: 0.5,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Tạo Enemy 2 Animation (13 frames)
     */
    public async createEnemy2Animation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const frames = await this.getEnemyFrames(2);
        return this.createAnimatedSprite(frames, {
            speed: 0.15,
            loop: true,
            autoPlay: true,
            scale: 0.5,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Tạo Basic Enemy Animation (4 frames)
     */
    public async createBasicAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const cacheKey = 'enemy_basic';
        
        let frames;
        if (this.cache.has(cacheKey)) {
            frames = this.cache.get(cacheKey)!;
        } else {
            frames = [];
            for (let i = 0; i < 4; i++) {
                const texture = await this.assetManager.loadTexture(`assets/textures/characters/enemies/basic/enemy_01_${i}.png`);
                frames.push(texture);
            }
            this.cache.set(cacheKey, frames);
        }

        return this.createAnimatedSprite(frames, {
            speed: 0.1,
            loop: true,
            autoPlay: true,
            scale: 0.5,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }

    /**
     * Tạo Soldier Enemy Animation (no wings)
     */
    public async createSoldierAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.createEnemyPartAnimation('soldier', {
            scale: 0.5,
            bodyOffset: { x: 0, y: 0 },
            hornOffset: {
                left: { x: -15, y: 10 },
                right: { x: 15, y: 10 }
            },
            legOffset: {
                left: { x: -15, y: 5 },
                right: { x: 15, y: 5 },
                left1: { x: -10, y: 10 },
                right1: { x: 10, y: 10 }
            },
            rotation: 0,
            enableAnimation: true,
            animationSpeed: 0.02,
            // No wingOffset - soldier doesn't have wings
            ...config
        });
    }

    /**
     * Tạo Saturation Enemy Animation
     */
    public async createSaturationAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.createEnemyPartAnimation('saturation', {
            scale: 0.5,
            bodyOffset: { x: 0, y: 0 },
            wingOffset: {
                left: { x: -10, y: 20 },
                right: { x: 10, y: 20 }
            },
            rotation: 0,
            enableAnimation: true,
            animationSpeed: 0.015,
            ...config
        });
    }

    /**
     * Tạo Green Enemy Animation
     */
    public async createGreenAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.createEnemyPartAnimation('green', {
            scale: 0.5,
            bodyOffset: { x: 0, y: 0 },
            wingOffset: {
                left: { x: -25, y: 40 },
                right: { x: 25, y: 40 }
            },
            legOffset: {
                left: { x: -20, y: 30 },
                right: { x: 20, y: 30 }
            },
            rotation: 0,
            enableAnimation: true,
            animationSpeed: 0.025,
            ...config
        });
    }

    /**
     * Tạo Inferior Enemy Animation
     */
    public async createInferiorAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.createEnemyPartAnimation('inferior', {
            scale: 0.5,
            bodyOffset: { x: 0, y: 0 },
            wingOffset: {
                left: { x: -15, y: 10 },
                right: { x: 15, y: 10 }
            },
            rotation: 0,
            enableAnimation: true,
            animationSpeed: 0.018,
            ...config
        });
    }

    /**
     * Tạo NA Enemy Animation
     */
    public async createNaAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.createEnemyPartAnimation('na', {
            scale: 0.5,
            bodyOffset: { x: 0, y: 0 },
            wingOffset: {
                left: { x: -20, y: 20 },
                right: { x: 20, y: 20 }
            },
            rotation: 0,
            enableAnimation: true,
            animationSpeed: 0.022,
            ...config
        });
    }

    /**
     * Tạo Diver Enemy Animation
     */
    public async createDiverAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.createEnemyPartAnimation('diver', {
            scale: 0.5,
            bodyOffset: { x: 0, y: 0 },
            wingOffset: {
                left: { x: -25, y: 25 },
                right: { x: 25, y: 25 }
            },
            legOffset: {
                left: { x: -15, y: 25 },
                right: { x: 15, y: 25 }
            },
            rotation: 0,
            enableAnimation: true,
            animationSpeed: 0.028,
            ...config
        }, true); // true = has angled legs
    }

    /**
     * Helper: Get enemy frames từ cache hoặc load mới
     */
    private async getEnemyFrames(enemyType: 1 | 2) {
        const cacheKey = `enemy_${enemyType}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)!;
        }

        const frames = await this.assetManager.loadEnemyAnimations(enemyType);
        this.cache.set(cacheKey, frames);
        return frames;
    }

    /**
     * Helper: Setup animated parts
     */
    private setupAnimatedPart(
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
        this.setupSprite(part, scale, position, false);
        container.addChild(part);
        if (enableAnimation) {
            this.addGentleAnimation(part, animationType, speed * multiplier, isLeft);
        } else {
            part.anchor.set(0.5);
        }
    }

    /**
     * Generic enemy part animation creator
     */
    private async createEnemyPartAnimation(
        enemyType: EnemyType,
        config: EnemyPartConfig & { scale: number; bodyOffset: { x: number; y: number }; enableAnimation: boolean; animationSpeed: number; rotation: number },
        hasAngledLegs: boolean = false
    ): Promise<Container> {
        const parts = await this.loadEnemyParts(enemyType);
        const container = new Container();
        const scale = config.scale;

        // Add body first (background layer)
        if (parts.body) {
            const body = new Sprite(parts.body);
            this.setupSprite(body, scale, { 
                x: config.bodyOffset.x, 
                y: config.bodyOffset.y 
            });
            container.addChild(body);
        }

        // Add wings (only if they exist)
        if (parts.wing_l && parts.wing_r && config.wingOffset) {
            this.setupAnimatedPart(
                container, new Sprite(parts.wing_l), scale, config.wingOffset.left,
                'wing', config.enableAnimation, config.animationSpeed, 1, true
            );
            this.setupAnimatedPart(
                container, new Sprite(parts.wing_r), scale, config.wingOffset.right,
                'wing', config.enableAnimation, config.animationSpeed, 1, false
            );
        } else if (config.wingOffset) {
            console.log(`ℹ️ Wings not available for this enemy type`);
        }

        // Add horns
        if (parts.horn_l && parts.horn_r && config.hornOffset) {
            this.setupAnimatedPart(
                container, new Sprite(parts.horn_l), scale, config.hornOffset.left,
                'horn', config.enableAnimation, config.animationSpeed, 1, true
            );
            this.setupAnimatedPart(
                container, new Sprite(parts.horn_r), scale, config.hornOffset.right,
                'horn', config.enableAnimation, config.animationSpeed, 1, false
            );
        }

        // Add legs (with special handling for angled legs)
        if (parts.leg_l && parts.leg_r && config.legOffset) {
            if (hasAngledLegs) {
                const legL = new Sprite(parts.leg_l);
                const legR = new Sprite(parts.leg_r);
                legL.rotation = -0.3;
                legR.rotation = 0.3;
                
                this.setupAnimatedPart(
                    container, legL, scale, config.legOffset.left,
                    'leg', config.enableAnimation, config.animationSpeed, 1, true
                );
                this.setupAnimatedPart(
                    container, legR, scale, config.legOffset.right,
                    'leg', config.enableAnimation, config.animationSpeed, 1, false
                );
            } else {
                this.setupAnimatedPart(
                    container, new Sprite(parts.leg_l), scale, config.legOffset.left,
                    'leg', config.enableAnimation, config.animationSpeed, 1, true
                );
                this.setupAnimatedPart(
                    container, new Sprite(parts.leg_r), scale, config.legOffset.right,
                    'leg', config.enableAnimation, config.animationSpeed, 1, false
                );
            }

            // Additional legs if available
            if (parts.leg_1_l && parts.leg_1_r && config.legOffset.left1 && config.legOffset.right1) {
                this.setupAnimatedPart(
                    container, new Sprite(parts.leg_1_l), scale, config.legOffset.left1,
                    'leg', config.enableAnimation, config.animationSpeed, 1, true
                );
                this.setupAnimatedPart(
                    container, new Sprite(parts.leg_1_r), scale, config.legOffset.right1,
                    'leg', config.enableAnimation, config.animationSpeed, 1, false
                );
            }
        }

        container.rotation = config.rotation;
        return container;
    }
} 