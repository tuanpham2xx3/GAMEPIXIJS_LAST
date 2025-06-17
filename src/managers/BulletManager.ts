import * as PIXI from 'pixi.js';
import { Bullet } from '../entities/Bullet';
import { Vector2 } from '../types/EntityTypes';
import { GameConfig } from '../core/Config';

export class BulletManager {
  private bullets: Bullet[];
  private activeBullets: Bullet[];
  private inactiveBullets: Bullet[];
  private container: PIXI.Container;
  private bulletTexture: PIXI.Texture;

  constructor(container: PIXI.Container, bulletTexture: PIXI.Texture) {
    this.container = container;
    this.bulletTexture = bulletTexture;
    this.bullets = [];
    this.activeBullets = [];
    this.inactiveBullets = [];

    this.initializeBulletPool();
  }

  private initializeBulletPool(): void {
    // Create bullet pool
    for (let i = 0; i < GameConfig.maxBullets; i++) {
      const bullet = new Bullet(this.bulletTexture);
      bullet.visible = false;
      this.bullets.push(bullet);
      this.inactiveBullets.push(bullet);
      this.container.addChild(bullet);
    }
  }

  public shootBullet(startPosition: Vector2, direction: Vector2 = { x: 0, y: -1 }): Bullet | null {
    // Get inactive bullet from pool
    const bullet = this.inactiveBullets.pop();
    if (!bullet) {
      console.warn('No available bullets in pool');
      return null;
    }

    // Initialize and activate bullet
    bullet.initialize(startPosition, direction);
    this.activeBullets.push(bullet);

    return bullet;
  }

  public update(deltaTime: number): void {
    // Update all active bullets
    for (let i = this.activeBullets.length - 1; i >= 0; i--) {
      const bullet = this.activeBullets[i];
      bullet.update(deltaTime);

      // Remove inactive bullets
      if (!bullet.isActive) {
        this.activeBullets.splice(i, 1);
        this.inactiveBullets.push(bullet);
      }
    }
  }

  public getActiveBullets(): Bullet[] {
    return [...this.activeBullets];
  }

  public getActiveBulletsCount(): number {
    return this.activeBullets.length;
  }

  public getAvailableBulletsCount(): number {
    return this.inactiveBullets.length;
  }

  public destroyAllBullets(): void {
    // Deactivate all active bullets
    for (const bullet of this.activeBullets) {
      bullet.deactivate();
      this.inactiveBullets.push(bullet);
    }
    this.activeBullets = [];
  }

  public destroy(): void {
    // Destroy all bullets
    for (const bullet of this.bullets) {
      bullet.destroy();
    }
    
    this.bullets = [];
    this.activeBullets = [];
    this.inactiveBullets = [];
  }

  // Debug methods
  public getPoolStats(): { total: number; active: number; inactive: number } {
    return {
      total: this.bullets.length,
      active: this.activeBullets.length,
      inactive: this.inactiveBullets.length
    };
  }
} 