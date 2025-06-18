import * as PIXI from 'pixi.js';
import { Vector2, PlayerState, Entity, EntityCategory, CollidableEntity } from '../types/EntityTypes';
import { GameConfig, getBoundaries } from '../core/Config';
import { InputManager } from '../managers/InputManager';
import { BulletManager } from '../managers/BulletManager';

export class Player extends PIXI.Sprite implements Entity, CollidableEntity {
  public velocity: Vector2;
  public isActive: boolean;
  private state: PlayerState;
  private inputManager: InputManager;
  private bulletManager: BulletManager;
  private lastShootTime: number;

  constructor(texture: PIXI.Texture, inputManager: InputManager, bulletManager: BulletManager) {
    super(texture);
    
    this.inputManager = inputManager;
    this.bulletManager = bulletManager;
    this.velocity = { x: 0, y: 0 };
    this.isActive = true;
    this.lastShootTime = 0;

    this.state = {
      isMoving: false,
      isShooting: false,
      health: 100,
      maxHealth: 100
    };

    this.setupPlayer();
  }

  private setupPlayer(): void {
    // Set player properties
    this.width = GameConfig.player.size.width;
    this.height = GameConfig.player.size.height;
    this.anchor.set(0.5);
    
    // Set initial position
    this.x = GameConfig.player.startPosition.x;
    this.y = GameConfig.player.startPosition.y;
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    this.handleInput(deltaTime);
    this.handleShooting(deltaTime);
    // boundaries are already applied in moveByFrameMovement
  }

  private handleInput(deltaTime: number): void {
    const isPointerDown = this.inputManager.isPointerDown();
    
    if (isPointerDown) {
      const frameMovement = this.inputManager.getFrameMovement();
      this.moveByFrameMovement(frameMovement, deltaTime);
      
      // Check if actually moving this frame (more strict threshold)
      const isMovingThisFrame = Math.abs(frameMovement.x) > 0.01 || Math.abs(frameMovement.y) > 0.01;
      this.state.isMoving = isMovingThisFrame;
      this.state.isShooting = true; // Shoot whenever mouse/finger is down
      
      // Debug log
      if (GameConfig.debug && isMovingThisFrame) {
        console.log(`Moving: (${frameMovement.x.toFixed(2)}, ${frameMovement.y.toFixed(2)})`);
      }
    } else {
      // Immediately stop movement when pointer is released
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.state.isMoving = false;
      this.state.isShooting = false;
    }
  }

  private moveByFrameMovement(frameMovement: Vector2, deltaTime: number): void {
    // Only move if there's actual movement
    const hasMovement = Math.abs(frameMovement.x) > 0.01 || Math.abs(frameMovement.y) > 0.01;
    
    if (hasMovement) {
      // Direct movement mapping - player moves exactly as much as mouse/finger moves
      const movementScale = 1.0; // Scale factor for sensitivity adjustment
      
      // Move player by the exact amount of frame movement
      this.x += frameMovement.x * movementScale;
      this.y += frameMovement.y * movementScale;
      
      // Set velocity for smooth animation and other systems that might need it
      if (deltaTime > 0) {
        this.velocity.x = (frameMovement.x * movementScale) / deltaTime;
        this.velocity.y = (frameMovement.y * movementScale) / deltaTime;
      }
      
      // Apply boundaries after movement
      this.applyBoundaries();
    } else {
      // No movement - stop velocity
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
  }

  private updateMovement(deltaTime: number): void {
    this.x += this.velocity.x * deltaTime;
    this.y += this.velocity.y * deltaTime;
  }

  private handleShooting(deltaTime: number): void {
    if (!this.state.isShooting) return;

    const currentTime = Date.now();
    const shootInterval = 1000 / GameConfig.player.shootingRate; // Convert to milliseconds

    if (currentTime - this.lastShootTime >= shootInterval) {
      this.shoot();
      this.lastShootTime = currentTime;
    }
  }

  private shoot(): void {
    const bulletStartPosition: Vector2 = {
      x: this.x,
      y: this.y - this.height / 2 // Shoot from top of player
    };

    const shootDirection: Vector2 = { x: 0, y: -1 }; // Shoot upward
    
    this.bulletManager.shootBullet(bulletStartPosition, shootDirection);
  }

  private applyBoundaries(): void {
    const boundaries = getBoundaries();
    
    // Keep player within screen boundaries
    if (this.x < boundaries.left) {
      this.x = boundaries.left;
      this.velocity.x = 0;
    } else if (this.x > boundaries.right) {
      this.x = boundaries.right;
      this.velocity.x = 0;
    }

    if (this.y < boundaries.top) {
      this.y = boundaries.top;
      this.velocity.y = 0;
    } else if (this.y > boundaries.bottom) {
      this.y = boundaries.bottom;
      this.velocity.y = 0;
    }
  }

  // Public methods
  public takeDamage(damage: number): boolean {
    this.state.health = Math.max(0, this.state.health - damage);
    if (this.state.health <= 0) {
      this.isActive = false;
      return true; // Player is destroyed
    }
    return false; // Player still alive
  }

  public heal(amount: number): void {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  public destroy(): void {
    this.isActive = false;
    super.destroy();
  }

  // Getters
  public getPosition(): Vector2 {
    return { x: this.x, y: this.y };
  }

  public getState(): PlayerState {
    return { ...this.state };
  }

  public getHealth(): number {
    return this.state.health;
  }

  public getMaxHealth(): number {
    return this.state.maxHealth;
  }

  public isMoving(): boolean {
    return this.state.isMoving;
  }

  public isShooting(): boolean {
    return this.state.isShooting;
  }

  // CollidableEntity interface implementation
  public getCategory(): EntityCategory {
    return EntityCategory.PLAYER;
  }

  public deactivate(): void {
    this.isActive = false;
  }
} 