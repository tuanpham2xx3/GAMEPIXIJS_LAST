import { Application } from 'pixi.js';
import { AnimationCache } from './core/AnimationCache';
import { EnemyAnimationManager } from './characters/EnemyAnimationManager';
import { BossAnimationManager } from './characters/BossAnimationManager';
import { ExplosionAnimationManager } from './effects/ExplosionAnimationManager';
import { UIAnimationManager } from './ui/UIAnimationManager';
import { ItemAnimationManager } from './items/ItemAnimationManager';
import { 
    AnimationConfig, 
    EnemyPartConfig, 
    CircleAnimationConfig, 
    BlinkAnimationConfig,
    MultipleAnimationsConfig,
    MultipleAnimationsResult,
    AnimationCacheInfo 
} from './core/AnimationConfig';

/**
 * Main Animation Manager
 * Tổng hợp tất cả animation managers và cung cấp interface thống nhất
 */
export class AnimationManager {
    private static instance: AnimationManager;
    
    // Managers
    private enemyManager: EnemyAnimationManager;
    private bossManager: BossAnimationManager;
    private explosionManager: ExplosionAnimationManager;
    private uiManager: UIAnimationManager;
    private itemManager: ItemAnimationManager;
    private cache: AnimationCache;

    private constructor() {
        this.enemyManager = EnemyAnimationManager.getInstance();
        this.bossManager = BossAnimationManager.getInstance();
        this.explosionManager = ExplosionAnimationManager.getInstance();
        this.uiManager = UIAnimationManager.getInstance();
        this.itemManager = ItemAnimationManager.getInstance();
        this.cache = AnimationCache.getInstance();
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
    public initWithApp(app: Application): void {
        this.enemyManager.initWithApp(app);
        this.bossManager.initWithApp(app);
        this.explosionManager.initWithApp(app);
        this.uiManager.initWithApp(app);
        this.itemManager.initWithApp(app);
    }

    /**
     * Preload tất cả animations cần thiết
     */
    public async preloadAllAnimations(): Promise<void> {
        console.log('🎬 Preloading ALL animations...');
        
        try {
            await Promise.all([
                this.enemyManager.preloadAnimations(),
                this.bossManager.preloadAnimations(),
                this.explosionManager.preloadAnimations(),
                this.itemManager.preloadAnimations()
            ]);
            
            console.log('✅ ALL animations preloaded successfully!');
        } catch (error) {
            console.error('❌ Failed to preload animations:', error);
            throw error;
        }
    }

    // ===== ENEMY ANIMATIONS =====
    public async createEnemy1Animation(config?: AnimationConfig) {
        return this.enemyManager.createEnemy1Animation(config);
    }

    public async createEnemy2Animation(config?: AnimationConfig) {
        return this.enemyManager.createEnemy2Animation(config);
    }

    public async createBasicAnimation(config?: AnimationConfig) {
        return this.enemyManager.createBasicAnimation(config);
    }

    public async createSoldierAnimation(config?: EnemyPartConfig) {
        return this.enemyManager.createSoldierAnimation(config);
    }

    public async createSaturationAnimation(config?: EnemyPartConfig) {
        return this.enemyManager.createSaturationAnimation(config);
    }

    public async createGreenAnimation(config?: EnemyPartConfig) {
        return this.enemyManager.createGreenAnimation(config);
    }

    public async createInferiorAnimation(config?: EnemyPartConfig) {
        return this.enemyManager.createInferiorAnimation(config);
    }

    public async createNaAnimation(config?: EnemyPartConfig) {
        return this.enemyManager.createNaAnimation(config);
    }

    public async createDiverAnimation(config?: EnemyPartConfig) {
        return this.enemyManager.createDiverAnimation(config);
    }

    // ===== BOSS ANIMATIONS =====
    public async createBossAnimation(config?: AnimationConfig) {
        return this.bossManager.createBossAnimation(config);
    }

    // ===== EFFECT ANIMATIONS =====
    public async createExplosionAnimation(config?: any) {
        return this.explosionManager.createExplosionAnimation(config);
    }

    // ===== UI ANIMATIONS =====
    public async createCircleAnimation(config?: CircleAnimationConfig) {
        return this.uiManager.createCircleAnimation(config);
    }

    public async createWarningAnimation(config?: BlinkAnimationConfig) {
        return this.uiManager.createWarningAnimation(config);
    }

    public async createTutorialAnimation(config?: BlinkAnimationConfig) {
        return this.uiManager.createTutorialAnimation(config);
    }

    public updateCirclePosition(circleContainer: any, playerX: number, playerY: number): void {
        this.uiManager.updateCirclePosition(circleContainer, playerX, playerY);
    }

    public removeCircleAnimation(circleContainer: any): void {
        this.uiManager.removeCircleAnimation(circleContainer);
    }

    public removeWarningAnimation(warningContainer: any): void {
        this.uiManager.removeWarningAnimation(warningContainer);
    }

    public removeTutorialAnimation(tutorialSprite: any): void {
        this.uiManager.removeTutorialAnimation(tutorialSprite);
    }

    // ===== ITEM ANIMATIONS =====
    public async createCoinAnimation(config?: AnimationConfig) {
        return this.itemManager.createCoinAnimation(config);
    }

    // ===== MULTIPLE ANIMATIONS =====
    public async createMultipleAnimations(configs: MultipleAnimationsConfig): Promise<MultipleAnimationsResult> {
        const result: MultipleAnimationsResult = {
            enemy1: [],
            enemy2: [],
            coins: [],
            hits: []
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
                result.hits.push(await this.createExplosionAnimation(configs.hits.config));
            }
        }

        return result;
    }

    // ===== CACHE MANAGEMENT =====
    public clearCache(): void {
        this.cache.clear();
    }

    public getCacheInfo(): AnimationCacheInfo {
        return this.cache.getCacheInfo();
    }

    public getCacheMemoryUsage(): number {
        return this.cache.getMemoryUsage();
    }

    // ===== BACKWARD COMPATIBILITY =====
    // Các method này để maintain backward compatibility với code cũ

    /**
     * @deprecated Use specific managers instead
     */
    public async createEnemyPartsAnimation(enemyType: any, config?: AnimationConfig) {
        console.warn('createEnemyPartsAnimation is deprecated. Use specific enemy animation methods instead.');
        
        switch (enemyType) {
            case 'soldier':
                return this.createSoldierAnimation(config as EnemyPartConfig);
            case 'saturation':
                return this.createSaturationAnimation(config as EnemyPartConfig);
            case 'green':
                return this.createGreenAnimation(config as EnemyPartConfig);
            case 'inferior':
                return this.createInferiorAnimation(config as EnemyPartConfig);
            case 'na':
                return this.createNaAnimation(config as EnemyPartConfig);
            case 'diver':
                return this.createDiverAnimation(config as EnemyPartConfig);
            default:
                throw new Error(`Unknown enemy type: ${enemyType}`);
        }
    }

    /**
     * Remove any animation from target
     */
    public removeAnimation(target: any): void {
        // Try to remove from each manager
        try {
            this.enemyManager.removeAnimation(target);
        } catch (error) {
            // Ignore if not applicable
        }
        
        try {
            this.uiManager.removeCircleAnimation(target);
        } catch (error) {
            // Ignore if not applicable
        }
        
        try {
            this.uiManager.removeWarningAnimation(target);
        } catch (error) {
            // Ignore if not applicable
        }
        
        try {
            this.uiManager.removeTutorialAnimation(target);
        } catch (error) {
            // Ignore if not applicable
        }
    }
}

// Export types for external use
export type {
    AnimationConfig,
    EnemyPartConfig,
    CircleAnimationConfig,
    BlinkAnimationConfig,
    MultipleAnimationsConfig,
    MultipleAnimationsResult,
    AnimationCacheInfo
}; 