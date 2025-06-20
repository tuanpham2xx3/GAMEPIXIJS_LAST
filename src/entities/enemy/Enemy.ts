import * as PIXI from 'pixi.js';
import { Vector2, EnemyState, Entity, EnemyType, MovementPattern, EntityCategory, CollidableEntity } from '../../types/EntityTypes';
import { GameConfig } from '../../core/Config';
import { AnimationManager } from '../../managers/AnimationManager';

export abstract class Enemy extends PIXI.Container implements Entity, CollidableEntity {
    public velocity: Vector2;
    public isActive: boolean;
    protected state: EnemyState;
    protected enemyType: EnemyType;

    // Visual components
    protected sprite: PIXI.Sprite | PIXI.Container | null = null;
    protected animationManager: AnimationManager;

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
        this.velocity.y = config.speed;
        this.velocity.x = 0;
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
            
            // Store position and parent before deactivating
            const explosionX = this.x;
            const explosionY = this.y;
            const explosionParent = this.parent;
            
            // Deactivate enemy immediately (hide it)
            this.deactivate();
            
            // Create texture-based explosion asynchronously
            this.createTextureExplosion(explosionX, explosionY, explosionParent);
            
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

    private async createTextureExplosion(x: number, y: number, parent: PIXI.Container | null): Promise<void> {
        if (!parent) {
            console.warn('No parent container for explosion');
            return;
        }

        console.log(`Creating texture explosion at (${x}, ${y})`);
        
        try {
            // Create explosion animation using AnimationManager
            const explosionAnimation = await this.animationManager.createExplosionAnimation({
                entityWidth: this.width,
                entityHeight: this.height,
                scale: 1.5,
                anchor: { x: 0.5, y: 0.5 }
            });
            
            // Position and add to parent
            explosionAnimation.position.set(x, y);
            parent.addChild(explosionAnimation);
            console.log('Texture explosion added to scene');
            
            // Set up completion handler for cleanup
            explosionAnimation.onComplete = () => {
                console.log('Texture explosion animation completed');
                if (explosionAnimation.parent) {
                    explosionAnimation.parent.removeChild(explosionAnimation);
                }
                explosionAnimation.destroy();
                console.log('Texture explosion cleaned up');
            };
            
            // Ensure animation starts playing
            if (!explosionAnimation.playing) {
                explosionAnimation.play();
                console.log('Started texture explosion animation manually');
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
            console.log('Fallback explosion added to scene');
            
            // Simple animation
            let scale = 0.5;
            let alpha = 0.8;
            const animateExplosion = () => {
                scale += 1.5;
                alpha -= 0.04;
                explosion.scale.set(scale);
                explosion.alpha = alpha;
                
                if (alpha <= 0 || scale >= 3.0) {
                    if (explosion.parent) {
                        explosion.parent.removeChild(explosion);
                    }
                    explosion.destroy();
                    console.log('Fallback explosion completed');
                } else {
                    requestAnimationFrame(animateExplosion);
                }
            };
            requestAnimationFrame(animateExplosion);
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