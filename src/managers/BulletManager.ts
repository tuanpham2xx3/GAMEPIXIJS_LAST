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
  
  // Add unlimited leveling properties
  private bulletLevel: number = 1;
  private damagePerLevel: number = GameConfig.bullet.damagePerLevel; // Use config value instead of hard-coded

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

  // Core damage calculation method
  private calculateCurrentDamage(): number {
    const baseDamage = GameConfig.bullet.damage;
    
    if (this.bulletLevel <= 5) {
      // Level 1-5: Predefined damage bonuses
      const levelBonuses = [0, 2, 5, 8, 15]; // Level 1: +0, Level 2: +2, etc.
      return baseDamage + (levelBonuses[this.bulletLevel - 1] || 0);
    } else {
      // Level 6+: Base level 5 damage + linear scaling
      const extraLevels = this.bulletLevel - 5;
      return baseDamage + 15 + (extraLevels * this.damagePerLevel);
    }
  }

  // Get bullet configuration based on current level
  private getBulletConfig(): { count: number; spread: number } {
    if (this.bulletLevel <= 5) {
      const configs: Record<number, { count: number; spread: number }> = {
        1: { count: 1, spread: 0 },
        2: { count: 2, spread: 15 },
        3: { count: 3, spread: 20 },
        4: { count: 4, spread: 25 },
        5: { count: 5, spread: 30 }
      };
      return configs[this.bulletLevel] || configs[1];
    } else {
      // Level 6+: Keep level 5 pattern
      return { count: 5, spread: 30 };
    }
  }

  // Calculate bullet direction with spread
  private calculateBulletDirection(baseDirection: Vector2, bulletIndex: number, config: { count: number; spread: number }): Vector2 {
    if (config.count === 1) {
      return baseDirection; // Single bullet, no spread
    }

    // Calculate spread angle for multiple bullets
    const spreadAngleRad = (config.spread * Math.PI) / 180;
    const angleStep = spreadAngleRad / (config.count - 1);
    const startAngle = -spreadAngleRad / 2;
    const bulletAngle = startAngle + (bulletIndex * angleStep);

    // Apply rotation to base direction
    const cos = Math.cos(bulletAngle);
    const sin = Math.sin(bulletAngle);
    
    return {
      x: baseDirection.x * cos - baseDirection.y * sin,
      y: baseDirection.x * sin + baseDirection.y * cos
    };
  }

  public shootBullet(startPosition: Vector2, direction: Vector2 = { x: 0, y: -1 }): Bullet[] {
    const config = this.getBulletConfig();
    const damage = this.calculateCurrentDamage();
    const bullets: Bullet[] = [];
    
    // Shoot multiple bullets based on current level
    for (let i = 0; i < config.count; i++) {
      const bullet = this.inactiveBullets.pop();
      if (!bullet) {
        console.warn('No available bullets in pool');
        break;
      }

      // Calculate shoot direction with spread
      const shootDirection = this.calculateBulletDirection(direction, i, config);
      
      // Initialize bullet with current damage
      bullet.initialize(startPosition, shootDirection, damage);
      this.activeBullets.push(bullet);
      bullets.push(bullet);
    }

    return bullets;
  }

  // Upgrade bullet level (unlimited)
  public upgradeBulletLevel(): { 
    oldLevel: number; 
    newLevel: number; 
    oldDamage: number; 
    newDamage: number;
    isSpecialLevel: boolean;
  } {
    const oldLevel = this.bulletLevel;
    const oldDamage = this.calculateCurrentDamage();
    
    this.bulletLevel++;
    
    const newDamage = this.calculateCurrentDamage();
    const isSpecialLevel = this.bulletLevel <= 5; // Level 1-5 have special patterns
    
    console.log(`BulletManager upgraded: Level ${oldLevel} -> ${this.bulletLevel}, Damage ${oldDamage} -> ${newDamage}`);
    
    return {
      oldLevel,
      newLevel: this.bulletLevel,
      oldDamage,
      newDamage,
      isSpecialLevel
    };
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

  // Public getters
  public getBulletLevel(): number {
    return this.bulletLevel;
  }

  public getCurrentDamage(): number {
    return this.calculateCurrentDamage();
  }

  public getBulletCount(): number {
    return this.getBulletConfig().count;
  }

  public isInSpecialRange(): boolean {
    return this.bulletLevel <= 5;
  }

  public resetBulletLevel(): void {
    this.bulletLevel = 1;
    console.log('BulletManager: Bullet level reset to 1');
  }

  // Debug methods
  public getPoolStats(): { total: number; active: number; inactive: number } {
    return {
      total: this.bullets.length,
      active: this.activeBullets.length,
      inactive: this.inactiveBullets.length
    };
  }

  public getDebugInfo(): string {
    const config = this.getBulletConfig();
    return `Level: ${this.bulletLevel}, Bullets: ${config.count}, Spread: ${config.spread}°, Damage: ${this.getCurrentDamage()}`;
  }
} 