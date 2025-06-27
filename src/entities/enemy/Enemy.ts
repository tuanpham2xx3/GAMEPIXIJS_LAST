import * as PIXI from 'pixi.js';
import { Vector2, EnemyState, Entity, EnemyType, MovementPattern, EntityCategory, CollidableEntity } from '../../types/EntityTypes';
import { GameConfig } from '../../core/Config';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { EnemyBulletManager } from '../../managers/EnemyBulletManager';
import { ItemManager } from '../../managers/ItemManager';
import { AudioManager } from '../../managers/AudioManager';

export abstract class Enemy extends PIXI.Container implements Entity, CollidableEntity {
    public velocity: Vector2;
    public isActive: boolean;
    protected state: EnemyState;
    protected enemyType: EnemyType;

    // Visual components
    protected sprite: PIXI.Sprite | PIXI.Container | null = null;
    protected animationManager: AnimationManager;

    // Shooting system
    protected enemyBulletManager?: EnemyBulletManager;
    protected lastShootTime: number = 0;
    protected shootInterval: number = 2000; // Default 2 seconds
    protected playerPosition?: Vector2;

    constructor(enemyType: EnemyType) {
        super();
        
        this.enemyType = enemyType;
        this.velocity = { x: 0, y: 0 };
        this.isActive = false;
        this.animationManager = AnimationManager.getInstance();

        const config = GameConfig.enemies[enemyType];
        this.state = {
            isActive: false,
            health: config.health,
            maxHealth: config.health
        };

        this.setupEnemy();
        
        // Set shoot interval from config
        this.shootInterval = config.shootInterval || 2000;
    }

    protected setupEnemy(): void {
        const config = GameConfig.enemies[this.enemyType];
        this.width = config.size.width;
        this.height = config.size.height;
    }

    public initialize(startPosition: Vector2): void {
        this.position.set(startPosition.x, startPosition.y);
        this.isActive = true;
        this.state.isActive = true;
        this.visible = true;
        
        const config = GameConfig.enemies[this.enemyType];
        this.state.health = config.health;
        this.state.maxHealth = config.health;
        
        this.velocity.x = 0;
        this.velocity.y = config.speed;
        
        
    }

    public update(deltaTime: number): void {
        if (!this.isActive) return;

        this.updateMovement(deltaTime);
        this.updatePosition(deltaTime);
        this.updateShooting();
        this.checkBounds();
    }

    protected updateMovement(deltaTime: number): void {
        const config = GameConfig.enemies[this.enemyType];
        this.velocity.y = config.speed;
        this.velocity.x = 0;
    }

    protected updatePosition(deltaTime: number): void {
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
    }

    protected updateShooting(): void {
        if (!this.enemyBulletManager || !this.playerPosition) return;

        const currentTime = Date.now();
        if (currentTime - this.lastShootTime >= this.shootInterval) {
            this.shoot();
            this.lastShootTime = currentTime;
        }
    }

    protected shoot(): void {
        if (!this.enemyBulletManager || !this.playerPosition) return;

        const bulletStartPosition: Vector2 = {
            x: this.x,
            y: this.y + this.height / 2
        };

        // Bắn về phía player
        this.enemyBulletManager.shootBullet(
            bulletStartPosition,
            { x: 0, y: 1 }, // Sẽ được tính lại trong initialize
            this.playerPosition,
            this.getShootDamage()
        );
    }

    protected getShootDamage(): number {
        const config = GameConfig.enemies[this.enemyType];
        return config?.bulletDamage || 20;
    }

    protected checkBounds(): void {
        // Deactivate if enemy goes off screen
        if (this.y > GameConfig.screen.height + 100 || 
            this.x < -100 || 
            this.x > GameConfig.screen.width + 100) {
            this.deactivate();
        }
    }

    public async takeDamage(damage: number): Promise<boolean> {
    
        this.state.health = Math.max(0, this.state.health - damage);
        
        if (this.state.health <= 0) {
      
            
            // Play enemy explosion sound effect
            const audioManager = AudioManager.getInstance();
            audioManager.playEnemyExplosion();
            
            // Store position and parent before deactivating
            const explosionX = this.x;
            const explosionY = this.y;
            const explosionParent = this.parent;
            
            // Spawn items at enemy position
            ItemManager.getInstance().spawnItemsOnEnemyDeath({ x: explosionX, y: explosionY });
            
            // Deactivate enemy immediately (hide it)
            this.deactivate();
            
            // Create texture-based explosion asynchronously
            this.createTextureExplosion(explosionX, explosionY, explosionParent);
            
            return true; // Enemy destroyed
        }
  
        return false; // Enemy still alive
    }

    public deactivate(): void {
        this.isActive = false;
        this.state.isActive = false;
        this.visible = false;
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    private async createTextureExplosion(x: number, y: number, parent: PIXI.Container | null): Promise<void> {
        if (!parent) {
            console.warn('No parent container for explosion');
            return;
        }

        try {
            // Create explosion animation using AnimationManager
            const explosionAnimation = await this.animationManager.createExplosionAnimation({
                entityWidth: this.width,
                entityHeight: this.height,
                scale: 1.0,
                loop: false,
                autoPlay: true
            });

            explosionAnimation.position.set(x, y);
            parent.addChild(explosionAnimation);

            // Clean up after animation completes
            explosionAnimation.onComplete = () => {
                if (explosionAnimation.parent) {
                    explosionAnimation.parent.removeChild(explosionAnimation);
                }
                explosionAnimation.destroy();
            };

            // Start animation if not already playing
            if (!explosionAnimation.playing) {
                explosionAnimation.play();
            }

        } catch (error) {
            console.error('Failed to create texture explosion, using fallback:', error);

            // Fallback to graphics explosion
            const explosion = new PIXI.Graphics();
            explosion.beginFill(0xFFAA00, 0.8);
            explosion.drawCircle(0, 0, Math.max(this.width, this.height) / 2);
            explosion.endFill();
            explosion.position.set(x, y);

            parent.addChild(explosion);

            // Animate the fallback explosion
            let scale = 0.1;
            let alpha = 1.0;
            
            const animateExplosion = () => {
                scale += 0.05;
                alpha -= 0.03;
                explosion.scale.set(scale);
                explosion.alpha = alpha;

                if (alpha <= 0) {
                    if (explosion.parent) {
                        explosion.parent.removeChild(explosion);
                    }
                    explosion.destroy();
                } else {
                    requestAnimationFrame(animateExplosion);
                }
            };
            
            animateExplosion();
        }
    }

    public destroy(): void {
        this.deactivate();
        if (this.sprite) {
            this.sprite.destroy();
            this.sprite = null;
        }
        super.destroy();
    }

    // Getters
    public getPosition(): Vector2 {
        return { x: this.x, y: this.y };
    }

    public getEnemyType(): EnemyType {
        return this.enemyType;
    }

    public getHealth(): number {
        return this.state.health;
    }

    public getMaxHealth(): number {
        return this.state.maxHealth;
    }

    public getScoreValue(): number {
        return GameConfig.enemies[this.enemyType].scoreValue;
    }

    public getState(): EnemyState {
        return { ...this.state };
    }

    // Abstract method for setting up visuals - implement in subclasses
    abstract setupVisuals(): Promise<void>;

    // Shooting system setup methods
    public setEnemyBulletManager(bulletManager: EnemyBulletManager): void {
        this.enemyBulletManager = bulletManager;
  
    }

    public setPlayerPosition(playerPosition: Vector2): void {
        this.playerPosition = playerPosition;
    }

    // CollidableEntity interface implementation
    public getCategory(): EntityCategory {
        const enemyType = this.getEnemyType();
        return enemyType === 'boss' ? EntityCategory.BOSS : EntityCategory.ENEMY;
    }

    public getDamage?(): number {
        // Return default damage for enemy collision with player
        return GameConfig.collision.defaultDamage.enemy;
    }
} 