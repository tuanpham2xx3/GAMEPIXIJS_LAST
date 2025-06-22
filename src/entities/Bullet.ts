import * as PIXI from 'pixi.js';
import { Vector2, BulletState, Entity, CollidableEntity, EntityCategory } from '../types/EntityTypes';
import { GameConfig } from '../core/Config';

export class Bullet extends PIXI.Sprite implements Entity, CollidableEntity {
  public velocity: Vector2;
  public isActive: boolean;
  private state: BulletState;
  private bulletDamage: number = 10; // Add dynamic damage property

  constructor(texture: PIXI.Texture) {
    super(texture);
    
    this.velocity = { x: 0, y: 0 };
    this.isActive = false;
    this.bulletDamage = GameConfig.bullet.damage; // Initialize with config value
    this.state = {
      isActive: false,
      direction: { x: 0, y: -1 } // Default shooting up
    };

    // Set bullet properties
    this.width = GameConfig.bullet.size.width;
    this.height = GameConfig.bullet.size.height;
    this.anchor.set(0.5);
  }

  public initialize(startPosition: Vector2, direction: Vector2, damage: number = 10): void {
    this.position.set(startPosition.x, startPosition.y);
    this.state.direction = this.normalizeVector(direction);
    this.velocity.x = this.state.direction.x * GameConfig.bullet.speed;
    this.velocity.y = this.state.direction.y * GameConfig.bullet.speed;
    this.isActive = true;
    this.state.isActive = true;
    this.visible = true;
    
    // Set dynamic damage
    this.bulletDamage = damage;
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    // Move bullet
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;

    // Check if bullet is out of screen bounds
    const bounds = this.getBounds();
    if (bounds.x + bounds.width < 0 || 
        bounds.x > GameConfig.screen.width ||
        bounds.y + bounds.height < 0 || 
        bounds.y > GameConfig.screen.height) {
      this.deactivate();
    }
  }

  public deactivate(): void {
    this.isActive = false;
    this.state.isActive = false;
    this.visible = false;
    this.velocity.x = 0;
    this.velocity.y = 0;
  }

  public destroy(): void {
    this.deactivate();
    super.destroy();
  }

  // Helper methods
  protected normalizeVector(vector: Vector2): Vector2 {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (length === 0) return { x: 0, y: -1 }; // Default direction
    return {
      x: vector.x / length,
      y: vector.y / length
    };
  }

  // Getters
  public getPosition(): Vector2 {
    return { x: this.x, y: this.y };
  }

  public getDamage(): number {
    return this.bulletDamage; // Return dynamic damage instead of config
  }

  public getState(): BulletState {
    return { ...this.state };
  }

  public getCategory(): EntityCategory {
    return EntityCategory.PLAYER_BULLET;
  }
} 