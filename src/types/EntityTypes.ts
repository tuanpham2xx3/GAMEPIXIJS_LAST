//Vector and Transform types
export interface Vector2 {
    x: number;
    y: number;
}

export interface Transform {
    position : Vector2;
    rotation: number;
    scale: Vector2;
}

//Input type
export interface InputState {
    isPointerDown: boolean;
    previousPosition: Vector2;
    currentPosition: Vector2;
    frameMovement: Vector2; //Movement in current frame
}

//Player type
export interface PlayerConfig {
    speed: number;
    shootingRate: number; //bullets per secon
    size: { width: number; height: number};
}

export interface PlayerState {
    isMoving: boolean;
    isShooting: boolean;
    health: number;
    maxHealth: number;
}

//Bullet types
export interface BulletConfig {
    speed: number;
    damage: number;
    size: { width: number; height: number};
}

export interface BulletState {
    isActive: boolean;
    direction: Vector2;
}

//Entity base interface
export interface Entity {
    velocity: Vector2;
    isActive: boolean;
    update(deltaTime: number): void;
    destroy(): void;
    getPosition(): Vector2;
}

// Enemy types
export type EnemyType = 'diver' | 'green' | 'inferior' | 'na' | 'soldier' | 'boss';

export type MovementPattern = 'straight' | 'zigzag' | 'sine' | 'circular' | 'boss';

export interface EnemyConfig {
    health: number;
    speed: number;
    scoreValue: number;
    size: {width: number; height: number};
    movementPattern: MovementPattern;
}

export interface EnemyState {
    isActive: boolean;
    health: number;
    maxHealth: number;
    movementPhase: number;
}

export interface LevelConfig {
    level: number;
    enemies: Array<{
        type: EnemyType;
        count: number;
        spawnDelay: number;
        spawnStartDelay?: number;
    }>;
    duration: number;
    isBossLevel?: boolean;
}
