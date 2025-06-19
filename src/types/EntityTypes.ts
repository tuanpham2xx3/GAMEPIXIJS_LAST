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

//Enemy types
export type EnemyType = 'diver' | 'green' | 'inferior' | 'na' | 'soldier' | 'boss' | 'enemy1' | 'enemy2';

export type MovementPattern = 'straight' | 'zigzag' | 'sine' | 'circular' | 'boss';

export interface EnemyConfig {
    health: number;
    speed: number;
    scoreValue: number;
    size: { width: number; height: number };
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

//Entity base interface
export interface Entity {
    velocity: Vector2;
    isActive: boolean;
    update(deltaTime: number): void;
    destroy(): void;
    getPosition(): Vector2;
}

// Collision System Types - Simplified Approach
export enum EntityCategory {
  PLAYER = 'player',
  PLAYER_BULLET = 'player_bullet',
  ENEMY = 'enemy',
  ENEMY_BULLET = 'enemy_bullet',
  BOSS = 'boss',
  BOSS_BULLET = 'boss_bullet',
  POWERUP = 'powerup'
}

export interface CollisionResult {
  entityA: any;
  entityB: any;
  categoryA: EntityCategory;
  categoryB: EntityCategory;
  damage?: number; // Kept for backward compatibility
  damageToA?: number;
  damageToB?: number;
  score?: number;
  shouldDestroyA?: boolean;
  shouldDestroyB?: boolean;
  shouldDeactivateA?: boolean;
  shouldDeactivateB?: boolean;
}

export interface CollidableEntity {
  getCategory(): EntityCategory;
  getBounds(): any; // PIXI.Rectangle
  isActive?: boolean;
  takeDamage?(damage: number): boolean | Promise<boolean>; // returns true if destroyed, now supports async
  deactivate?(): void;
  destroy?(): void;
  getScoreValue?(): number;
  getDamage?(): number;
}

export interface CollisionRule {
  categoryA: EntityCategory;
  categoryB: EntityCategory;
  enabled: boolean;
  damageToA?: number;
  damageToB?: number;
  scoreValue?: number;
  destroyA?: boolean;
  destroyB?: boolean;
  deactivateA?: boolean;
  deactivateB?: boolean;
  callback?: (entityA: any, entityB: any) => CollisionResult | null;
}