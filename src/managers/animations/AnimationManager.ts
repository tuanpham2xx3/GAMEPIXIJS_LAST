import { AnimatedSprite, Container, Sprite, Text, Application } from 'pixi.js';
import { 
    AnimationConfig, 
    EnemyPartConfig, 
    CircleAnimationConfig, 
    BlinkAnimationConfig, 
    MultipleAnimationConfigs 
} from './core/AnimationConfig';
import { AnimationUtils } from './core/AnimationUtils';
import { BasicEnemyAnimator } from './enemies/BasicEnemyAnimator';
import { EnemyPartsAnimator } from './enemies/EnemyPartsAnimator';
import { CoinAnimator } from './collectibles/CoinAnimator';
import { ExplosionAnimator } from './effects/ExplosionAnimator';
import { UIAnimator } from './effects/UIAnimator';

// Re-export all interfaces and types for backward compatibility
export type { 
    AnimationConfig, 
    EnemyPartConfig, 
    CircleAnimationConfig, 
    BlinkAnimationConfig, 
    MultipleAnimationConfigs 
} from './core/AnimationConfig';

// Re-export utility class
export { AnimationUtils } from './core/AnimationUtils';

// Re-export individual animators for direct access
export { BasicEnemyAnimator } from './enemies/BasicEnemyAnimator';
export { EnemyPartsAnimator } from './enemies/EnemyPartsAnimator';
export { CoinAnimator } from './collectibles/CoinAnimator';
export { ExplosionAnimator } from './effects/ExplosionAnimator';
export { UIAnimator } from './effects/UIAnimator';

export class AnimationManager {
    private static instance: AnimationManager;
    private app?: Application;

    // Modular animators
    private basicEnemyAnimator: BasicEnemyAnimator;
    private enemyPartsAnimator: EnemyPartsAnimator;
    private coinAnimator: CoinAnimator;
    private explosionAnimator: ExplosionAnimator;
    private uiAnimator: UIAnimator;

    private constructor() {
        this.basicEnemyAnimator = new BasicEnemyAnimator();
        this.enemyPartsAnimator = new EnemyPartsAnimator();
        this.coinAnimator = new CoinAnimator();
        this.explosionAnimator = new ExplosionAnimator();
        this.uiAnimator = new UIAnimator();
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
        this.app = app;
        
        // Initialize all animators with app
        this.basicEnemyAnimator = new BasicEnemyAnimator(app);
        this.enemyPartsAnimator = new EnemyPartsAnimator(app);
        this.coinAnimator = new CoinAnimator(app);
        this.explosionAnimator = new ExplosionAnimator(app);
        this.uiAnimator = new UIAnimator(app);
    }

    // === BASIC ENEMY ANIMATIONS ===
    
    /**
     * Create Enemy 1 Animation (20 frames)
     */
    public async createEnemy1Animation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        return this.basicEnemyAnimator.createEnemy1Animation(config);
    }

    /**
     * Create Enemy 2 Animation (13 frames)
     */
    public async createEnemy2Animation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        return this.basicEnemyAnimator.createEnemy2Animation(config);
    }

    /**
     * Create Basic Animation (4 frames)
     */
    public async createBasicAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        return this.basicEnemyAnimator.createBasicAnimation(config);
    }

    /**
     * Create Boss Animation (5 frames with pattern 0->4->0)
     */
    public async createBossAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        return this.basicEnemyAnimator.createBossAnimation(config);
    }

    // === ENEMY PARTS ANIMATIONS ===

    /**
     * Create Soldier Animation
     */
    public async createSoldierAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.enemyPartsAnimator.createSoldierAnimation(config);
    }

    /**
     * Create Diver Animation
     */
    public async createDiverAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.enemyPartsAnimator.createDiverAnimation(config);
    }

    /**
     * Create Green Animation
     */
    public async createGreenAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.enemyPartsAnimator.createGreenAnimation(config);
    }

    /**
     * Create Inferior Animation
     */
    public async createInferiorAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.enemyPartsAnimator.createInferiorAnimation(config);
    }

    /**
     * Create NA Animation
     */
    public async createNaAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.enemyPartsAnimator.createNaAnimation(config);
    }

    /**
     * Create Saturation Animation
     */
    public async createSaturationAnimation(config: EnemyPartConfig = {}): Promise<Container> {
        return this.enemyPartsAnimator.createSaturationAnimation(config);
    }

    /**
     * Create custom animation from enemy parts (for boss or special enemies)
     */
    public async createEnemyPartsAnimation(
        enemyType: 'diver' | 'green' | 'inferior' | 'na' | 'saturation' | 'soldier',
        config: AnimationConfig = {}
    ): Promise<{ [partName: string]: AnimatedSprite }> {
        // For backward compatibility, create a simple wrapper
        const container = await this.enemyPartsAnimator.createSoldierAnimation(config);
        return { combined: container as any };
    }

    // === COIN ANIMATIONS ===

    /**
     * Create Coin Animation (6 frames)
     */
    public async createCoinAnimation(config: AnimationConfig = {}): Promise<AnimatedSprite> {
        return this.coinAnimator.createCoinAnimation(config);
    }

    // === EXPLOSION ANIMATIONS ===

    /**
     * Create Explosion Animation (4x4 sprite sheet)
     */
    public async createExplosionAnimation(config: AnimationConfig & { entityWidth?: number; entityHeight?: number } = {}): Promise<AnimatedSprite> {
        return this.explosionAnimator.createExplosionAnimation(config);
    }

    // === UI ANIMATIONS ===

    /**
     * Create Circle Animation - 2 circles scaling in/out around player
     */
    public async createCircleAnimation(config: CircleAnimationConfig = {}): Promise<Container> {
        return this.uiAnimator.createCircleAnimation(config);
    }

    /**
     * Update Circle Animation position to follow player
     */
    public updateCirclePosition(circleContainer: Container, playerX: number, playerY: number): void {
        this.uiAnimator.updateCirclePosition(circleContainer, playerX, playerY);
    }

    /**
     * Create Warning Animation - warning_bg and txt_warning blinking
     */
    public async createWarningAnimation(config: BlinkAnimationConfig = {}): Promise<Container> {
        return this.uiAnimator.createWarningAnimation(config);
    }

    /**
     * Create Tutorial Animation - txt_tutorial blinking
     */
    public async createTutorialAnimation(config: BlinkAnimationConfig = {}): Promise<Sprite | Text> {
        return this.uiAnimator.createTutorialAnimation(config);
    }

    // === ANIMATION REMOVAL ===

    /**
     * Remove Circle Animation
     */
    public removeCircleAnimation(circleContainer: Container): void {
        this.uiAnimator.removeCircleAnimation(circleContainer);
    }

    /**
     * Remove Warning Animation
     */
    public removeWarningAnimation(warningContainer: Container): void {
        this.uiAnimator.removeWarningAnimation(warningContainer);
    }

    /**
     * Remove Tutorial Animation
     */
    public removeTutorialAnimation(tutorialSprite: Sprite): void {
        this.uiAnimator.removeTutorialAnimation(tutorialSprite);
    }

    /**
     * Remove animation from sprite/container
     */
    public removeAnimation(target: Sprite | Container): void {
        AnimationUtils.removeAnimation(this.app, target);
    }

    // === BULK OPERATIONS ===

    /**
     * Create multiple animations at once
     */
    public async createMultipleAnimations(configs: MultipleAnimationConfigs): Promise<{
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

        // Create enemy1 animations
        if (configs.enemy1) {
            const promises = Array(configs.enemy1.count).fill(null).map(() => 
                this.createEnemy1Animation(configs.enemy1!.config)
            );
            result.enemy1 = await Promise.all(promises);
        }

        // Create enemy2 animations
        if (configs.enemy2) {
            const promises = Array(configs.enemy2.count).fill(null).map(() => 
                this.createEnemy2Animation(configs.enemy2!.config)
            );
            result.enemy2 = await Promise.all(promises);
        }

        // Create coin animations
        if (configs.coins) {
            const promises = Array(configs.coins.count).fill(null).map(() => 
                this.createCoinAnimation(configs.coins!.config)
            );
            result.coins = await Promise.all(promises);
        }

        // Create hit animations
        if (configs.hits) {
            const promises = Array(configs.hits.count).fill(null).map(() => 
                this.createExplosionAnimation(configs.hits!.config)
            );
            result.hits = await Promise.all(promises);
        }

        return result;
    }

    /**
     * Preload all animations
     */
    public async preloadAllAnimations(): Promise<void> {
        console.log('🎬 Preloading all animations...');
        
        try {
            await Promise.all([
                this.basicEnemyAnimator.preloadAnimations(),
                this.enemyPartsAnimator.preloadAnimations(),
                this.coinAnimator.preloadAnimations(),
                this.explosionAnimator.preloadAnimations(),
                this.uiAnimator.preloadAnimations()
            ]);
            
            console.log('✅ All animations preloaded successfully!');
        } catch (error) {
            console.error('❌ Failed to preload animations:', error);
            throw error;
        }
    }

    // === CACHE MANAGEMENT ===

    /**
     * Clear animation cache
     */
    public clearCache(): void {
        AnimationUtils.clearCache();
        console.log('Animation cache cleared');
    }

    /**
     * Get cache info
     */
    public getCacheInfo(): { [key: string]: number } {
        return AnimationUtils.getCacheInfo();
    }

    // === INDIVIDUAL ANIMATOR ACCESS ===

    /**
     * Get individual animators for advanced usage
     */
    public getAnimators() {
        return {
            basicEnemy: this.basicEnemyAnimator,
            enemyParts: this.enemyPartsAnimator,
            coin: this.coinAnimator,
            explosion: this.explosionAnimator,
            ui: this.uiAnimator
        };
    }

    // === PERFORMANCE METRICS ===

    /**
     * Get performance metrics
     */
    public getMetrics() {
        return {
            cacheSize: Object.keys(this.getCacheInfo()).length,
            totalCachedFrames: Object.values(this.getCacheInfo()).reduce((sum, count) => sum + count, 0),
            appInitialized: !!this.app,
            availableAnimators: ['basicEnemy', 'enemyParts', 'coin', 'explosion', 'ui']
        };
    }
} 