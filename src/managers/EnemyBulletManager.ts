import * as PIXI from 'pixi.js';
import { EnemyBullet } from '../entities/EnemyBullet';
import { Vector2 } from '../types/EntityTypes';
import { GameConfig } from '../core/Config';

export class EnemyBulletManager {
    private bullets: EnemyBullet[];
    private activeBullets: EnemyBullet[];
    private inactiveBullets: EnemyBullet[];
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
        const maxEnemyBullets = GameConfig.maxEnemyBullets || 100;
        
        for (let i = 0; i < maxEnemyBullets; i++) {
            const bullet = new EnemyBullet(this.bulletTexture, GameConfig.enemyBullet.damage);
            bullet.visible = false;
            this.bullets.push(bullet);
            this.inactiveBullets.push(bullet);
            this.container.addChild(bullet);
        }
    }

    public shootBullet(
        startPosition: Vector2, 
        direction: Vector2 = { x: 0, y: 1 }, 
        targetPosition?: Vector2,
        damage: number = GameConfig.enemyBullet.damage
    ): EnemyBullet | null {
        const bullet = this.inactiveBullets.pop();
        if (!bullet) {
            console.warn('No available enemy bullets in pool');
            return null;
        }

        bullet.setDamage(damage);
        
        // Use appropriate initialization method
        if (targetPosition) {
            bullet.initializeWithTarget(startPosition, direction, targetPosition, damage);
        } else {
            bullet.initialize(startPosition, direction, damage);
        }
        
        this.activeBullets.push(bullet);

        return bullet;
    }

    public update(deltaTime: number): void {
        for (let i = this.activeBullets.length - 1; i >= 0; i--) {
            const bullet = this.activeBullets[i];
            bullet.update(deltaTime);

            if (!bullet.isActive) {
                this.activeBullets.splice(i, 1);
                this.inactiveBullets.push(bullet);
            }
        }
    }

    public getActiveBullets(): EnemyBullet[] {
        return [...this.activeBullets];
    }

    public getActiveBulletsCount(): number {
        return this.activeBullets.length;
    }

    public getAvailableBulletsCount(): number {
        return this.inactiveBullets.length;
    }

    public destroyAllBullets(): void {
        for (const bullet of this.activeBullets) {
            bullet.deactivate();
            this.inactiveBullets.push(bullet);
        }
        this.activeBullets = [];
    }

    public destroy(): void {
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