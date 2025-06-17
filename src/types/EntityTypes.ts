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
