import { Bullet } from './Bullet';
import { Vector2, EntityCategory } from '../types/EntityTypes';
import { GameConfig } from '../core/Config';
import * as PIXI from 'pixi.js';

export class EnemyBullet extends Bullet {
    private customDamage: number;

    constructor(texture: PIXI.Texture, damage: number = 20) {
        super(texture);
        
        this.customDamage = damage;
        
        // Customize appearance for enemy bullets
        this.tint = 0xFF4444; // Red tint để phân biệt với player bullets
        
        // Use enemy bullet config if available
        if (GameConfig.enemyBullet) {
            this.width = GameConfig.enemyBullet.size.width;
            this.height = GameConfig.enemyBullet.size.height;
        }
    }

    // Override initialize to support both damage and target position
    public initialize(startPosition: Vector2, direction: Vector2, damage: number = 20): void {
        // Call parent initialize with damage
        super.initialize(startPosition, direction, damage);
        
        // Override velocity with enemy bullet speed
        const speed = GameConfig.enemyBullet?.speed || 200;
        this.velocity.x = (this as any).state.direction.x * speed;
        this.velocity.y = (this as any).state.direction.y * speed;
        
        // Set custom damage
        this.customDamage = damage;
    }

    // New method for target-based initialization
    public initializeWithTarget(startPosition: Vector2, direction: Vector2, targetPosition: Vector2, damage: number = 20): void {
        // Calculate direction to target
        const dx = targetPosition.x - startPosition.x;
        const dy = targetPosition.y - startPosition.y;
        const calculatedDirection = this.normalizeVector({ x: dx, y: dy });
        
        // Initialize with calculated direction
        this.initialize(startPosition, calculatedDirection, damage);
    }

    // Override methods
    public getDamage(): number {
        return this.customDamage;
    }

    public getCategory(): EntityCategory {
        return EntityCategory.ENEMY_BULLET;
    }

    // Override normalizeVector for enemy bullets
    protected normalizeVector(vector: Vector2): Vector2 {
        const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
        if (length === 0) return { x: 0, y: 1 }; // Default down for enemy
        return {
            x: vector.x / length,
            y: vector.y / length
        };
    }

    // Set custom damage method
    public setDamage(damage: number): void {
        this.customDamage = damage;
    }
} 