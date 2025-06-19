import * as PIXI from 'pixi.js';
import { Vector2, EnemyState, Entity, EnemyType, MovementPattern, EntityCategory, CollidableEntity } from '../../types/EntityTypes';
import { GameConfig } from '../../core/Config';
import { AnimationManager } from '../../managers/AnimationManager';

export abstract class Enemy extends PIXI.Container implements Entity, CollidableEntity {
    public velocity: Vector2;
    public isActive: boolean;
    protected state: EnemyState;
    protected enemyType: EnemyType;
    protected movementPhase: number;
    protected startTime: number;

    // Visual components
    protected sprite: PIXI.Sprite | PIXI.Container | null = null;
    protected animationManager: AnimationManager;

    constructor(enemyType: EnemyType) {
        super();
        
        this.enemyType = enemyType;
        this.velocity = { x: 0, y: 0 };
        this.isActive = false;
        this.movementPhase = 0;
        this.startTime = 0;
        this.animationManager = AnimationManager.getInstance();

        const config = GameConfig.enemies[enemyType];
        this.state = {
            isActive: false,
            health: config.health,
            maxHealth: config.health,
            movementPhase: 0
        };

        this.setupEnemy();
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
        this.movementPhase = 0;
        this.startTime = Date.now();
        
        const config = GameConfig.enemies[this.enemyType];
        this.state.health = config.health;
        this.state.maxHealth = config.health;
        
        // Reset velocity
        this.velocity.x = 0;
        this.velocity.y = config.speed;
        
        // Debug logging
        console.log(`Initializing ${this.enemyType} enemy at position (${startPosition.x}, ${startPosition.y})`);
        console.log(`Enemy visible: ${this.visible}, active: ${this.isActive}`);
    }

    public update(deltaTime: number): void {
        if (!this.isActive) return;

        this.updateMovement(deltaTime);
        this.updatePosition(deltaTime);
        this.checkBounds();
    }

    protected updateMovement(deltaTime: number): void {
        const config = GameConfig.enemies[this.enemyType];
        const currentTime = (Date.now() - this.startTime) / 1000;
        
        switch (config.movementPattern) {
            case 'straight':
                this.velocity.y = config.speed;
                this.velocity.x = 0;
                break;
                
            case 'zigzag':
                this.velocity.y = config.speed;
                this.velocity.x = Math.sin(currentTime * 3) * 100;
                break;
                
            case 'sine':
                this.velocity.y = config.speed;
                this.velocity.x = Math.sin(currentTime * 2) * 80;
                break;
                
            case 'circular':
                const radius = 60;
                const centerX = this.x;
                this.velocity.y = config.speed * 0.7;
                this.velocity.x = Math.cos(currentTime * 4) * 50;
                break;
                
            case 'boss':
                this.updateBossMovement(deltaTime, currentTime);
                break;
        }
    }

    protected updateBossMovement(deltaTime: number, currentTime: number): void {
        // Override in boss class
        const config = GameConfig.enemies[this.enemyType];
        this.velocity.y = config.speed * 0.3;
        this.velocity.x = Math.sin(currentTime * 1.5) * 30;
    }

    protected updatePosition(deltaTime: number): void {
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
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
        console.log(`Enemy ${this.enemyType} taking ${damage} damage. Health: ${this.state.health} -> ${this.state.health - damage}`);
        this.state.health = Math.max(0, this.state.health - damage);
        
        if (this.state.health <= 0) {
            console.log(`Enemy ${this.enemyType} destroyed!`);
            
            // Create explosion animation before deactivating
            try {
                const explosionAnimation = await this.animationManager.createExplosionAnimation({
                    entityWidth: this.width,
                    entityHeight: this.height,
                    anchor: { x: 0.5, y: 0.5 }
                });
                
                explosionAnimation.position.set(this.x, this.y);
                
                // Add explosion to parent container (game scene)
                if (this.parent) {
                    this.parent.addChild(explosionAnimation);
                }
                
                // Remove explosion after animation completes
                explosionAnimation.onComplete = () => {
                    if (explosionAnimation.parent) {
                        explosionAnimation.parent.removeChild(explosionAnimation);
                    }
                    explosionAnimation.destroy();
                };
            } catch (error) {
                console.error('Failed to create explosion animation:', error);
            }
            
            this.deactivate();
            return true; // Enemy destroyed
        }
        console.log(`Enemy ${this.enemyType} still alive with ${this.state.health} health`);
        return false; // Enemy still alive
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

    // CollidableEntity interface implementation
    public getCategory(): EntityCategory {
        const enemyType = this.getEnemyType();
        return enemyType === 'boss' ? EntityCategory.BOSS : EntityCategory.ENEMY;
    }

    public getDamage?(): number {
        // Return default damage for enemy collision with player
        return 20;
    }
} 