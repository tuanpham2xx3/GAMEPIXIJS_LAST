/**
 * Core Animation Configuration Types & Interfaces
 * Chứa tất cả các interface và type definitions cho animation system
 */

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

export interface ExplosionAnimationConfig extends AnimationConfig {
    entityWidth?: number;       // Width của entity để scale explosion
    entityHeight?: number;      // Height của entity để scale explosion
}

export type EnemyType = 'diver' | 'green' | 'inferior' | 'na' | 'saturation' | 'soldier' | 'basic';
export type PartType = 'horn' | 'leg' | 'wing';

/**
 * Cache info interface
 */
export interface AnimationCacheInfo {
    [key: string]: number;
}

/**
 * Multiple animations config
 */
export interface MultipleAnimationsConfig {
    enemy1?: { count: number; config?: AnimationConfig };
    enemy2?: { count: number; config?: AnimationConfig };
    coins?: { count: number; config?: AnimationConfig };
    hits?: { count: number; config?: AnimationConfig };
}

/**
 * Multiple animations result
 */
export interface MultipleAnimationsResult {
    enemy1: import('pixi.js').AnimatedSprite[];
    enemy2: import('pixi.js').AnimatedSprite[];
    coins: import('pixi.js').AnimatedSprite[];
    hits: import('pixi.js').AnimatedSprite[];
} 