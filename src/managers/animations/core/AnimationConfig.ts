import { Texture } from 'pixi.js';

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
    enableAnimation?: boolean;
    animationSpeed?: number;
}

export interface CircleAnimationConfig {
    size?: number;
    playerX?: number;
    playerY?: number;
    color?: number;
    alpha?: number;
    speed?: number;
    minScale?: number;
    maxScale?: number;
}

export interface BlinkAnimationConfig {
    speed?: number;
    minAlpha?: number;
    maxAlpha?: number;
}

export interface AnimationCache {
    [key: string]: Texture[];
}

export interface MultipleAnimationConfigs {
    enemy1?: { count: number; config?: AnimationConfig };
    enemy2?: { count: number; config?: AnimationConfig };
    coins?: { count: number; config?: AnimationConfig };
    hits?: { count: number; config?: AnimationConfig };
} 