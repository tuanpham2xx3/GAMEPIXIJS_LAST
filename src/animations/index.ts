/**
 * Animation System Index
 * Export point cho tất cả animation modules
 */

// Main manager
export { AnimationManager } from './AnimationManager';

// Core modules
export { AnimationCache } from './core/AnimationCache';
export { BaseAnimationManager } from './core/BaseAnimationManager';

// Specialized managers
export { EnemyAnimationManager } from './characters/EnemyAnimationManager';
export { BossAnimationManager } from './characters/BossAnimationManager';
export { ExplosionAnimationManager } from './effects/ExplosionAnimationManager';
export { UIAnimationManager } from './ui/UIAnimationManager';
export { ItemAnimationManager } from './items/ItemAnimationManager';

// Types and interfaces
export type {
    AnimationConfig,
    EnemyPartConfig,
    CircleAnimationConfig,
    BlinkAnimationConfig,
    ExplosionAnimationConfig,
    MultipleAnimationsConfig,
    MultipleAnimationsResult,
    AnimationCacheInfo,
    EnemyType,
    PartType
} from './core/AnimationConfig'; 