// Export all animation modules
export * from './core/AnimationConfig';
export * from './core/AnimationUtils';

export * from './enemies/BasicEnemyAnimator';
export * from './enemies/EnemyPartsAnimator';

export * from './collectibles/CoinAnimator';

export * from './effects/ExplosionAnimator';
export * from './effects/UIAnimator';
// Main AnimationManager is now in the parent directory
export { AnimationManager } from './AnimationManager'; 