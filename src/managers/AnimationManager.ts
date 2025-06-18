import { AnimatedSprite, Texture, Rectangle, Container, Sprite, Application, Graphics, Text, TextStyle } from 'pixi.js';
import { AssetManager } from './AssetManager';

export interface AnimationConfig {
    speed?: number;
    loop?: boolean;
    autoPlay?: boolean;
    scale?: number;
    anchor?: { x: number; y: number };
}

export interface EnemyPartConfig extends AnimationConfig {
    bodyOffset?: { x: number; y: number };
    wingOffset?: { left: { x: number; y: number }; right: { x: number; y: number } };
    hornOffset?: { left: { x: number; y: number }; right: { x: number; y: number } };
    legOffset?: { 
        left: { x: number; y: number }; 
        right: { x: number; y: number };
        left1?: { x: number; y: number };
        right1?: { x: number; y: number };
    };
    rotation?: number;
    enableAnimation?: boolean; // Bật/tắt animation cho parts
    animationSpeed?: number;   // Tốc độ animation
}

export interface CircleAnimationConfig {
    size?: number;              // Kích thước vòng tròn
    playerX?: number;           // Vị trí X của player
    playerY?: number;           // Vị trí Y của player
    color?: number;             // Màu sắc vòng tròn
    alpha?: number;             // Độ trong suốt
    speed?: number;             // Tốc độ animation
    minScale?: number;          // Scale tối thiểu
    maxScale?: number;          // Scale tối đa
}

export interface BlinkAnimationConfig {
    speed?: number;             // Tốc độ nhấp nháy
    minAlpha?: number;          // Alpha tối thiểu
    maxAlpha?: number;          // Alpha tối đa
}

export class AnimationManager {
    private static instance: AnimationManager;
    private assetManager: AssetManager;
    private animationCache: Map<string, Texture[]> = new Map();
    private app?: Application; // Optional app for ticker animations

    private constructor() {
        this.assetManager = AssetManager.getInstance();
    }

    public static getInstance(): AnimationManager {
        if (!AnimationManager.instance) {
            AnimationManager.instance = new AnimationManager();
        }
        return AnimationManager.instance;
    }

    /**
     * Initialize with Application for ticker animations
     */
    public initWithApp(app: Application) {
        this.app = app;
    }

    /**
     * Add gentle animation to sprite parts with proper anchor points and mirroring
     */
    private addGentleAnimation(sprite: Sprite, type: 'horn' | 'leg' | 'wing', speed: number = 0.02, isLeft: boolean = false) {
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
     * Preload tất cả animations cần thiết
     */
    public async preloadAllAnimations(): Promise<void> {
        console.log('Preloading all animations...');
        
        try {
            const assetManager = AssetManager.getInstance();
            
            // Load enemy animations
            await this.preloadEnemyAnimations();
            
            // Load coin animations  
            await this.preloadCoinAnimations();
            
            // Load animation assets through AssetManager
            await assetManager.loadAnimationAssets();
            
            console.log('All animations preloaded successfully!');
        } catch (error) {
            console.error('Failed to preload animations:', error);
            throw error;
        }
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
     * Tạo Hit Effect Animation (4x4 sprite sheet)
     */
    public async createHitAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        const hitTexture = await this.assetManager.loadTexture('assets/textures/animations/anim_hit.jpg');
        
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
        
        return this.createAnimatedSprite(frames, {
            speed: 0.4,          // Nhanh hơn để hiệu ứng hit mượt
            loop: false,         // Chỉ chạy 1 lần
            autoPlay: true,
            scale: 1.0,
            anchor: { x: 0.5, y: 0.5 },
            ...config
        });
    }
    /**
     * Tạo custom animation từ enemy parts (cho boss hoặc special enemies)
     */
    public async createEnemyPartsAnimation(
        enemyType: 'diver' | 'green' | 'inferior' | 'na' | 'saturation' | 'soldier',
        config: AnimationConfig = {}
    ): Promise<{ [partName: string]: AnimatedSprite }> {
        const parts = await this.loadEnemyParts(enemyType);
        const animatedParts: { [partName: string]: AnimatedSprite } = {};

        Object.entries(parts).forEach(([partName, texture]) => {
            const frames = [texture];
            const animatedSprite = this.createAnimatedSprite(frames, {
                speed: 0.05,
                loop: true,
                autoPlay: true,
                scale: 0.5,
                anchor: { x: 0.5, y: 0.5 },
                ...config
            });
            
            animatedParts[partName] = animatedSprite;
        });

        return animatedParts;
    }

    /**
     * Load các phần của enemy từ thư mục characters/enemies
     */
    private async loadEnemyParts(enemyType: string): Promise<{ [key: string]: Texture }> {
        const basePath = `assets/textures/characters/enemies/${enemyType}/enemy_${enemyType}_`;
        const parts: { [key: string]: Texture } = {};

        // Load body
        try {
            parts.body = await this.assetManager.loadTexture(basePath + 'body.png');
        } catch (error) {
            console.log(`No body found for ${enemyType}`);
        }

        // Load wings nếu có
        try {
            parts.wing_l = await this.assetManager.loadTexture(basePath + 'wing_l.png');
            parts.wing_r = await this.assetManager.loadTexture(basePath + 'wing_r.png');
        } catch (error) {
            console.log(`No wings found for ${enemyType}`);
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

    /**
     * Utility: Lấy enemy frames với cache
     */
    private async getEnemyFrames(enemyType: 1 | 2): Promise<Texture[]> {
        const cacheKey = `enemy_${enemyType}`;
        
        if (this.animationCache.has(cacheKey)) {
            return this.animationCache.get(cacheKey)!;
        }

        const frames = await this.assetManager.loadEnemyAnimations(enemyType);
        this.animationCache.set(cacheKey, frames);
        return frames;
    }

    /**
     * Utility: Lấy coin frames với cache
     */
    private async getCoinFrames(): Promise<Texture[]> {
        const cacheKey = 'coins';
        
        if (this.animationCache.has(cacheKey)) {
            return this.animationCache.get(cacheKey)!;
        }

        const frames = await this.assetManager.loadCoins();
        this.animationCache.set(cacheKey, frames);
        return frames;
    }

    /**
     * Utility: Tạo AnimatedSprite với config
     */
    private createAnimatedSprite(frames: Texture[], config: Required<AnimationConfig>): AnimatedSprite {
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
     * Preload enemy animations
     */
    private async preloadEnemyAnimations(): Promise<void> {
        await this.getEnemyFrames(1);
        await this.getEnemyFrames(2);
        console.log('Enemy animations preloaded');
    }

    /**
     * Preload coin animations
     */
    private async preloadCoinAnimations(): Promise<void> {
        await this.getCoinFrames();
        console.log('Coin animations preloaded');
    }

    /**
     * Preload hit animation
     */
    private async preloadHitAnimation(): Promise<void> {
        await this.assetManager.loadTexture('/assets/textures/animations/anim_hit.jpg');
        console.log('Hit animation preloaded');
    }

    /**
     * Tạo nhiều animations cùng lúc
     */
    public async createMultipleAnimations(configs: {
        enemy1?: { count: number; config?: AnimationConfig };
        enemy2?: { count: number; config?: AnimationConfig };
        coins?: { count: number; config?: AnimationConfig };
        hits?: { count: number; config?: AnimationConfig };
    }): Promise<{
        enemy1: AnimatedSprite[];
        enemy2: AnimatedSprite[];
        coins: AnimatedSprite[];
        hits: AnimatedSprite[];
    }> {
        const result = {
            enemy1: [] as AnimatedSprite[],
            enemy2: [] as AnimatedSprite[],
            coins: [] as AnimatedSprite[],
            hits: [] as AnimatedSprite[]
        };

        // Tạo enemy1 animations
        if (configs.enemy1) {
            for (let i = 0; i < configs.enemy1.count; i++) {
                result.enemy1.push(await this.createEnemy1Animation(configs.enemy1.config));
            }
        }

        // Tạo enemy2 animations
        if (configs.enemy2) {
            for (let i = 0; i < configs.enemy2.count; i++) {
                result.enemy2.push(await this.createEnemy2Animation(configs.enemy2.config));
            }
        }

        // Tạo coin animations
        if (configs.coins) {
            for (let i = 0; i < configs.coins.count; i++) {
                result.coins.push(await this.createCoinAnimation(configs.coins.config));
            }
        }

        // Tạo hit animations
        if (configs.hits) {
            for (let i = 0; i < configs.hits.count; i++) {
                result.hits.push(await this.createHitAnimation(configs.hits.config));
            }
        }

        return result;
    }

    /**
     * Clear animation cache
     */
    public clearCache(): void {
        this.animationCache.clear();
        console.log('Animation cache cleared');
    }

    /**
     * Get cache info
     */
    public getCacheInfo(): { [key: string]: number } {
        const info: { [key: string]: number } = {};
        this.animationCache.forEach((frames, key) => {
            info[key] = frames.length;
        });
        return info;
    }

    /**
     * Helper method to setup sprite with basic properties
     */
    private setupSprite(sprite: Sprite, scale: number, position: { x: number, y: number }, setAnchor: boolean = true): void {
        if (setAnchor) {
            sprite.anchor.set(0.5);
        }
        sprite.scale.set(scale);
        sprite.position.set(position.x, position.y);
    }

    /**
     * Helper method to setup animated parts
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
        // Don't set anchor here, let addGentleAnimation handle it
        this.setupSprite(part, scale, position, false);
        container.addChild(part);
        if (enableAnimation) {
            this.addGentleAnimation(part, animationType, speed * multiplier, isLeft);
        } else {
            // Set default anchor if no animation
            part.anchor.set(0.5);
        }
    }

    /**
     * Tạo animation cho Soldier Enemy
     */
    public async createSoldierAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        const parts = await this.loadEnemyParts('soldier');
        const container = new Container();

        const finalConfig = {
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
            ...config
        };

        const scale = finalConfig.scale || 0.5;

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            this.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }
        // Horns
        if (parts.horn_l && parts.horn_r && finalConfig.hornOffset) {
            this.setupAnimatedPart(
                container,
                new Sprite(parts.horn_l),
                scale,
                finalConfig.hornOffset.left,
                'horn',
                finalConfig.enableAnimation || false,
                finalConfig.animationSpeed || 0.02,
                1,
                true // isLeft
            );
            this.setupAnimatedPart(
                container,
                new Sprite(parts.horn_r),
                scale,
                finalConfig.hornOffset.right,
                'horn',
                finalConfig.enableAnimation || false,
                finalConfig.animationSpeed || 0.02,
                1,
                false // isRight
            );
        }

        // Legs
        if (parts.leg_l && parts.leg_r && finalConfig.legOffset) {
            this.setupAnimatedPart(
                container,
                new Sprite(parts.leg_l),
                scale,
                finalConfig.legOffset.left,
                'leg',
                finalConfig.enableAnimation || false,
                finalConfig.animationSpeed || 0.02,
                1,
                true // isLeft
            );
            this.setupAnimatedPart(
                container,
                new Sprite(parts.leg_r),
                scale,
                finalConfig.legOffset.right,
                'leg',
                finalConfig.enableAnimation || false,
                finalConfig.animationSpeed || 0.02,
                1,
                false // isRight
            );
        }

        // Additional legs
        if (parts.leg_1_l && parts.leg_1_r && finalConfig.legOffset?.left1 && finalConfig.legOffset?.right1) {
            this.setupAnimatedPart(
                container,
                new Sprite(parts.leg_1_l),
                scale,
                finalConfig.legOffset.left1,
                'leg',
                finalConfig.enableAnimation || false,
                finalConfig.animationSpeed || 0.02,
                1,
                true // isLeft
            );
            this.setupAnimatedPart(
                container,
                new Sprite(parts.leg_1_r),
                scale,
                finalConfig.legOffset.right1,
                'leg',
                finalConfig.enableAnimation || false,
                finalConfig.animationSpeed || 0.02,
                1,
                false // isRight
            );
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Tạo animation cho Basic Enemy
     * - Sử dụng enemy_01 frames thay vì parts
     */
    public async createBasicAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        // Load basic enemy frames
        const frames: Texture[] = [];
        for (let i = 0; i < 4; i++) {
            const texture = await this.assetManager.loadTexture(`assets/textures/characters/enemies/basic/enemy_01_${i}.png`);
            frames.push(texture);
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
     * Tạo animation cho Saturation Enemy
     */
    public async createSaturationAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        const parts = await this.loadEnemyParts('saturation');
        const container = new Container();

        const finalConfig = {
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
        };

        const scale = finalConfig.scale || 0.5;
        // Wings
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            this.setupAnimatedPart(container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.015, 1, true);
            this.setupAnimatedPart(container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.015, 1, false);
        }
        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            this.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Tạo animation cho Green Enemy
     */
    public async createGreenAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        const parts = await this.loadEnemyParts('green');
        const container = new Container();

        const finalConfig = {
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
        };

        const scale = finalConfig.scale || 0.5;
        // Legs
        if (parts.leg_l && parts.leg_r && finalConfig.legOffset) {
            this.setupAnimatedPart(container, new Sprite(parts.leg_l), scale, finalConfig.legOffset.left, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.025, 1, true);
            this.setupAnimatedPart(container, new Sprite(parts.leg_r), scale, finalConfig.legOffset.right, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.025, 1, false);
        }
        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            this.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }
        // Wings
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            this.setupAnimatedPart(container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.025, 1, true);
            this.setupAnimatedPart(container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.025, 1, false);
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Tạo animation cho Inferior Enemy
     */
    public async createInferiorAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        const parts = await this.loadEnemyParts('inferior');
        const container = new Container();

        const finalConfig = {
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
        };

        const scale = finalConfig.scale || 0.5;

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            this.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        // Wings
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            this.setupAnimatedPart(container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.018, 1, true);
            this.setupAnimatedPart(container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.018, 1, false);
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Tạo animation cho NA Enemy
     */
    public async createNaAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        const parts = await this.loadEnemyParts('na');
        const container = new Container();

        const finalConfig = {
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
        };

        const scale = finalConfig.scale || 0.5;
        // Wings
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            this.setupAnimatedPart(container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.022, 1, true);
            this.setupAnimatedPart(container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.022, 1, false);
        }
        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            this.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }
        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Tạo animation cho Diver Enemy
     */
    public async createDiverAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        const parts = await this.loadEnemyParts('diver');
        const container = new Container();

        const finalConfig = {
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
        };

        const scale = finalConfig.scale || 0.5;

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            this.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        // Wings
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            this.setupAnimatedPart(container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.028, 1, true);
            this.setupAnimatedPart(container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right, 'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.028, 1, false);
        }
        // Legs (angled)
        if (parts.leg_l && parts.leg_r && finalConfig.legOffset) {
            const legL = new Sprite(parts.leg_l);
            const legR = new Sprite(parts.leg_r);
            
            // Set angles before setup
            legL.rotation = -0.3;
            legR.rotation = 0.3;
            
            this.setupAnimatedPart(container, legL, scale, finalConfig.legOffset.left, 'leg', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.028, 1, true);
            this.setupAnimatedPart(container, legR, scale, finalConfig.legOffset.right, 'leg', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.028, 1, false);
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Tạo animation cho Boss (5 frames với pattern 0->4->0)
     */
    public async createBossAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        try {
            console.log('🎬 Loading boss animation...');
            // Load boss sprite sheet
            const bossTexture = await this.assetManager.loadTexture(AssetManager.paths.BOSS_ANIMATION);
            console.log('✅ Loaded boss texture:', bossTexture.width, 'x', bossTexture.height);
            
            // Create frames from sprite sheet (5 frames horizontally)
            const baseFrames: Texture[] = [];
            const frameWidth = bossTexture.width / 5;  // 5 frames
            const frameHeight = bossTexture.height;
            console.log('📐 Frame dimensions:', frameWidth, 'x', frameHeight);

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
     * Tạo Circle Animation - 2 vòng tròn phóng to thu nhỏ theo player
     */
    public async createCircleAnimation(config: CircleAnimationConfig = {}): Promise<Container> {
        if (!this.app) {
            console.warn('App not initialized for circle animation');
            return new Container();
        }

        const container = new Container();
        
        const finalConfig = {
            size: config.size || 100,
            playerX: config.playerX || 0,
            playerY: config.playerY || 0,
            color: config.color || 0xFFFFFF,
            alpha: config.alpha || 0.5,
            speed: config.speed || 0.05,
            minScale: config.minScale || 0.8,
            maxScale: config.maxScale || 1.2,
        };

        try {
            // Load circle texture từ assets
            const circleTexture = await this.assetManager.loadTexture('/assets/textures/backgrounds/circle.png');

            // Tạo 2 vòng tròn từ texture
            const circle1 = new Sprite(circleTexture);
            const circle2 = new Sprite(circleTexture);

            // Setup circle 1
            circle1.anchor.set(0.5);
            circle1.position.set(finalConfig.playerX, finalConfig.playerY);
            circle1.tint = finalConfig.color;
            circle1.alpha = finalConfig.alpha;
            circle1.width = finalConfig.size;
            circle1.height = finalConfig.size;

            // Setup circle 2 (smaller, offset animation phase)
            circle2.anchor.set(0.5);
            circle2.position.set(finalConfig.playerX, finalConfig.playerY);
            circle2.tint = finalConfig.color;
            circle2.alpha = finalConfig.alpha * 0.7; // Slightly more transparent
            circle2.width = finalConfig.size * 0.8;
            circle2.height = finalConfig.size * 0.8;

            container.addChild(circle1, circle2);

            // Animation variables
            let time1 = 0;
            let time2 = Math.PI; // Offset phase

            const animationFn = () => {
                time1 += finalConfig.speed;
                time2 += finalConfig.speed;

                // Circle 1 animation
                const scale1 = finalConfig.minScale + (finalConfig.maxScale - finalConfig.minScale) * 
                              (Math.sin(time1) * 0.5 + 0.5);
                circle1.scale.set(scale1);

                // Circle 2 animation (offset phase)
                const scale2 = finalConfig.minScale + (finalConfig.maxScale - finalConfig.minScale) * 
                              (Math.sin(time2) * 0.5 + 0.5);
                circle2.scale.set(scale2);

                // Update position to follow player if needed
                if (config.playerX !== undefined && config.playerY !== undefined) {
                    circle1.position.set(config.playerX, config.playerY);
                    circle2.position.set(config.playerX, config.playerY);
                }
            };

            this.app.ticker.add(animationFn);
            
            // Store reference to remove later
            (container as any)._circleAnimationFn = animationFn;

        } catch (error) {
            console.error('Error loading circle texture:', error);
            // Fallback to graphics if texture loading fails
            const fallbackCircle = new Graphics();
            fallbackCircle.beginFill(finalConfig.color, finalConfig.alpha);
            fallbackCircle.drawCircle(0, 0, finalConfig.size / 2);
            fallbackCircle.endFill();
            container.addChild(fallbackCircle);
        }

        return container;
    }

    /**
     * Update Circle Animation position theo player
     */
    public updateCirclePosition(circleContainer: Container, playerX: number, playerY: number): void {
        if (circleContainer.children.length >= 2) {
            circleContainer.children[0].position.set(playerX, playerY);
            circleContainer.children[1].position.set(playerX, playerY);
        }
    }

    /**
     * Tạo Warning Animation - warning_bg và txt_warning nhấp nháy
     */
    public async createWarningAnimation(config: BlinkAnimationConfig = {}): Promise<Container> {
        if (!this.app) {
            console.warn('App not initialized for warning animation');
            return new Container();
        }

        const container = new Container();
        
        const finalConfig = {
            speed: config.speed || 0.1,
            minAlpha: config.minAlpha || 0.3,
            maxAlpha: config.maxAlpha || 1.0,
        };

        try {
            // Load warning background và text
            const warningBgTexture = await this.assetManager.loadTexture('/assets/textures/ui/icons/warning_bg.png');
            const txtWarningTexture = await this.assetManager.loadTexture('/assets/textures/ui/icons/txt_warning.png');

            // Tạo sprites
            const warningBg = new Sprite(warningBgTexture);
            const txtWarning = new Sprite(txtWarningTexture);

            // Setup sprites
            warningBg.anchor.set(0.5);
            txtWarning.anchor.set(0.5);

            container.addChild(warningBg, txtWarning);

            // Animation variables
            let time = 0;

            const animationFn = () => {
                time += finalConfig.speed;
                
                // Nhấp nháy alpha
                const alpha = finalConfig.minAlpha + (finalConfig.maxAlpha - finalConfig.minAlpha) * 
                             (Math.sin(time) * 0.5 + 0.5);
                
                warningBg.alpha = alpha;
                txtWarning.alpha = alpha;
            };

            this.app.ticker.add(animationFn);
            
            // Store reference to remove later
            (container as any)._warningAnimationFn = animationFn;

        } catch (error) {
            console.error('Error loading warning assets:', error);
            
            // Fallback: Create simple graphics warning
            const fallbackWarning = new Graphics();
            fallbackWarning.beginFill(0xFF0000, 0.8);
            fallbackWarning.drawRoundedRect(-50, -25, 100, 50, 5);
            fallbackWarning.endFill();
            
            const warningText = new Text('⚠️ WARNING', new TextStyle({
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xFFFFFF,
                fontWeight: 'bold'
            }));
            warningText.anchor.set(0.5);
            
            container.addChild(fallbackWarning, warningText);
            
            // Animation for fallback
            let time = 0;
            const animationFn = () => {
                time += finalConfig.speed;
                const alpha = finalConfig.minAlpha + (finalConfig.maxAlpha - finalConfig.minAlpha) * 
                             (Math.sin(time) * 0.5 + 0.5);
                fallbackWarning.alpha = alpha;
                warningText.alpha = alpha;
            };
            
            this.app.ticker.add(animationFn);
            (container as any)._warningAnimationFn = animationFn;
        }

        return container;
    }

    /**
     * Tạo Tutorial Animation - txt_tutorial nhấp nháy
     */
    public async createTutorialAnimation(config: BlinkAnimationConfig = {}): Promise<Sprite | Text> {
        if (!this.app) {
            console.warn('App not initialized for tutorial animation');
            return new Text('Tutorial', new TextStyle({ fontSize: 16, fill: 0xffffff }));
        }
        
        const finalConfig = {
            speed: config.speed || 0.08,
            minAlpha: config.minAlpha || 0.4,
            maxAlpha: config.maxAlpha || 1.0,
        };

        try {
            // Load tutorial text
            const txtTutorialTexture = await this.assetManager.loadTexture('/assets/textures/ui/icons/txt_tutorial.png');
            
            const txtTutorial = new Sprite(txtTutorialTexture);
            txtTutorial.anchor.set(0.5);

            // Animation variables
            let time = 0;

            const animationFn = () => {
                time += finalConfig.speed;
                
                // Nhấp nháy alpha
                const alpha = finalConfig.minAlpha + (finalConfig.maxAlpha - finalConfig.minAlpha) * 
                             (Math.sin(time) * 0.5 + 0.5);
                
                txtTutorial.alpha = alpha;
            };

            this.app.ticker.add(animationFn);
            
            // Store reference to remove later
            (txtTutorial as any)._tutorialAnimationFn = animationFn;

            return txtTutorial;

        } catch (error) {
            console.error('Error loading tutorial assets:', error);
            
            // Fallback: Create simple graphics tutorial
            const fallbackTutorial = new Text('📚 TUTORIAL', new TextStyle({
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0x00AAFF,
                fontWeight: 'bold',
                stroke: 0x000000,
                strokeThickness: 2
            }));
            fallbackTutorial.anchor.set(0.5);
            
            // Animation for fallback
            let time = 0;
            const animationFn = () => {
                time += finalConfig.speed;
                const alpha = finalConfig.minAlpha + (finalConfig.maxAlpha - finalConfig.minAlpha) * 
                             (Math.sin(time) * 0.5 + 0.5);
                fallbackTutorial.alpha = alpha;
            };
            
            this.app.ticker.add(animationFn);
            (fallbackTutorial as any)._tutorialAnimationFn = animationFn;
            
            return fallbackTutorial;
        }
    }

    /**
     * Remove Circle Animation
     */
    public removeCircleAnimation(circleContainer: Container): void {
        if (!this.app || !circleContainer) return;
        
        const animationFn = (circleContainer as any)._circleAnimationFn;
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            delete (circleContainer as any)._circleAnimationFn;
        }
    }

    /**
     * Remove Warning Animation
     */
    public removeWarningAnimation(warningContainer: Container): void {
        if (!this.app || !warningContainer) return;
        
        const animationFn = (warningContainer as any)._warningAnimationFn;
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            delete (warningContainer as any)._warningAnimationFn;
        }
    }

    /**
     * Remove Tutorial Animation
     */
    public removeTutorialAnimation(tutorialSprite: Sprite): void {
        if (!this.app || !tutorialSprite) return;
        
        const animationFn = (tutorialSprite as any)._tutorialAnimationFn;
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            delete (tutorialSprite as any)._tutorialAnimationFn;
        }
    }

    /**
     * Remove animation từ sprite/container
     */
    public removeAnimation(target: Sprite | Container): void {
        if (!this.app || !target) return;
        
        const animationFn = (target as any)._animationFn || 
                          (target as any)._circleAnimationFn || 
                          (target as any)._warningAnimationFn || 
                          (target as any)._tutorialAnimationFn;
        
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            // Clean up all animation references
            delete (target as any)._animationFn;
            delete (target as any)._circleAnimationFn;
            delete (target as any)._warningAnimationFn;
            delete (target as any)._tutorialAnimationFn;
        }
    }
} 