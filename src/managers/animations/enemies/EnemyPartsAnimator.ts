import { Container, Sprite, Texture, Application } from 'pixi.js';
import { EnemyPartConfig } from '../core/AnimationConfig';
import { AnimationUtils } from '../core/AnimationUtils';
import { AssetManager } from '../../AssetManager';
import { GameConfig } from '../../../core/Config';

export class EnemyPartsAnimator {
    private assetManager: AssetManager;
    private app?: Application;

    constructor(app?: Application) {
        this.assetManager = AssetManager.getInstance();
        this.app = app;
    }

    /**
     * Load enemy parts from assets
     */
    private async loadEnemyParts(enemyType: string): Promise<{ [key: string]: Texture }> {
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

        // Load wings
        try {
            parts.wing_l = await this.assetManager.loadTexture(basePath + 'wing_l.png');
            parts.wing_r = await this.assetManager.loadTexture(basePath + 'wing_r.png');
        } catch (error) {
            console.log(`No wings found for ${enemyType}`);
        }

        // Load horns
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
     * Create Soldier Animation
     */
    public async createSoldierAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        const parts = await this.loadEnemyParts('soldier');
        const container = new Container();

        const finalConfig = {
            scale: 0.5,
            bodyOffset: { x: 0, y: 0 },
            hornOffset: {
                left: { x: -12, y: -20 },
                right: { x: 12, y: -20 }
            },
            legOffset: {
                left: { x: -15, y: 5 },
                right: { x: 15, y: 5 },
                left1: { x: -10, y: 10 },
                right1: { x: 10, y: 10 }
            },
            rotation: 0,
            enableAnimation: true,
            animationSpeed: GameConfig.enemies.soldier.animationSpeed,
            ...config
        };

        const scale = finalConfig.scale || 0.5;

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            AnimationUtils.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        // Horns
        if (parts.horn_l && parts.horn_r && finalConfig.hornOffset) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.horn_l), scale, finalConfig.hornOffset.left,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.horn_r), scale, finalConfig.hornOffset.right,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, false
            );
        }

        // Legs
        if (parts.leg_l && parts.leg_r && finalConfig.legOffset) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.leg_l), scale, finalConfig.legOffset.left,
                'leg', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.leg_r), scale, finalConfig.legOffset.right,
                'leg', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, false
            );
        }

        // Additional legs
        if (parts.leg_1_l && parts.leg_1_r && finalConfig.legOffset?.left1 && finalConfig.legOffset?.right1) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.leg_1_l), scale, finalConfig.legOffset.left1,
                'leg', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.leg_1_r), scale, finalConfig.legOffset.right1,
                'leg', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, false
            );
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Create Diver Animation
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
            animationSpeed: GameConfig.enemies.diver.animationSpeed,
            ...config
        };

        const scale = finalConfig.scale || 0.5;

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            AnimationUtils.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        // Wings
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, false
            );
        }

        // Legs (angled)
        if (parts.leg_l && parts.leg_r && finalConfig.legOffset) {
            const legL = new Sprite(parts.leg_l);
            const legR = new Sprite(parts.leg_r);
            
            legL.rotation = -0.3;
            legR.rotation = 0.3;
            
            AnimationUtils.setupAnimatedPart(
                this.app, container, legL, scale, finalConfig.legOffset.left,
                'leg', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, legR, scale, finalConfig.legOffset.right,
                'leg', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, false
            );
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Create Green Animation
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
            animationSpeed: GameConfig.enemies.green.animationSpeed,
            ...config
        };

        const scale = finalConfig.scale || 0.5;

        // Legs first
        if (parts.leg_l && parts.leg_r && finalConfig.legOffset) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.leg_l), scale, finalConfig.legOffset.left,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.leg_r), scale, finalConfig.legOffset.right,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.025, 1, false
            );
        }

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            AnimationUtils.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        // Wings
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.025, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.025, 1, false
            );
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Create Inferior Animation
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
            animationSpeed: GameConfig.enemies.inferior.animationSpeed,
            ...config
        };

        const scale = finalConfig.scale || 0.5;

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            AnimationUtils.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        // Wings
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.018, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.018, 1, false
            );
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Create NA Animation
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
            animationSpeed: GameConfig.enemies.na.animationSpeed,
            ...config
        };

        const scale = finalConfig.scale || 0.5;

        // Wings first
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.022, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.022, 1, false
            );
        }

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            AnimationUtils.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Create Saturation Animation
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
            animationSpeed: GameConfig.enemies.boss.animationSpeed,
            ...config
        };

        const scale = finalConfig.scale || 0.5;

        // Wings first
        if (parts.wing_l && parts.wing_r && finalConfig.wingOffset) {
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_l), scale, finalConfig.wingOffset.left,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.015, 1, true
            );
            AnimationUtils.setupAnimatedPart(
                this.app, container, new Sprite(parts.wing_r), scale, finalConfig.wingOffset.right,
                'horn', finalConfig.enableAnimation || false, finalConfig.animationSpeed || 0.015, 1, false
            );
        }

        // Body
        if (parts.body) {
            const body = new Sprite(parts.body);
            AnimationUtils.setupSprite(body, scale, { 
                x: finalConfig.bodyOffset?.x || 0, 
                y: finalConfig.bodyOffset?.y || 0 
            });
            container.addChild(body);
        }

        container.rotation = finalConfig.rotation || 0;
        return container;
    }

    /**
     * Preload all enemy parts animations
     */
    public async preloadAnimations(): Promise<void> {
        console.log('🎬 Preloading enemy parts animations...');
        
        const enemyTypes = ['soldier', 'diver', 'green', 'inferior', 'na', 'saturation'];
        
        try {
            await Promise.all(
                enemyTypes.map(type => this.loadEnemyParts(type))
            );
            
            console.log('✅ Enemy parts animations preloaded successfully!');
        } catch (error) {
            console.error('❌ Failed to preload enemy parts animations:', error);
            throw error;
        }
    }
} 