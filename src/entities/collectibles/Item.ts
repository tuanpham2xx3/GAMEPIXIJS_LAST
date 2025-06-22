import * as PIXI from 'pixi.js';
import { Vector2, ItemState, Entity, ItemType, EntityCategory, CollidableEntity } from '../../types/EntityTypes';
import { GameConfig } from '../../core/Config';

export abstract class Item extends PIXI.Container implements Entity, CollidableEntity {
    public velocity: Vector2;
    public isActive: boolean;
    protected state: ItemState;
    protected itemType: ItemType;

    // Visual components
    protected animation: PIXI.AnimatedSprite | PIXI.Sprite | null = null;
    
    // Player tracking
    protected playerPosition?: Vector2;
    protected isPlayerNearby: boolean = false;

    constructor(itemType: ItemType) {
        super();
        
        this.itemType = itemType;
        this.velocity = { x: 0, y: 0 };
        this.isActive = false;

        this.state = {
            isActive: false,
            isFollowingPlayer: false
        };

        this.setupItem();
    }

    protected setupItem(): void {
        const config = GameConfig.items[this.itemType];
        this.width = config.size.width;
        this.height = config.size.height;
    }

    public initialize(startPosition: Vector2): void {
        this.position.set(startPosition.x, startPosition.y);
        this.isActive = true;
        this.state.isActive = true;
        this.state.isFollowingPlayer = false;
        this.visible = true;
        
        // Initial gentle drift downward
        this.velocity.x = (Math.random() - 0.5) * 20; // Small random horizontal drift
        this.velocity.y = 30; // Slow downward movement
        
        console.log(`Initializing ${this.itemType} item at position (${startPosition.x}, ${startPosition.y})`);
    }

    public update(deltaTime: number): void {
        if (!this.isActive) return;

        this.updatePlayerTracking(deltaTime);
        this.updateMovement(deltaTime);
        this.updatePosition(deltaTime);
        this.checkBounds();
        this.updateAnimation(deltaTime);
    }

    protected updatePlayerTracking(deltaTime: number): void {
        if (!this.playerPosition) return;

        const config = GameConfig.items[this.itemType];
        const distanceToPlayer = this.getDistanceToPlayer();
        
        // Check if player is nearby
        this.isPlayerNearby = distanceToPlayer <= config.followDistance;
        
        if (this.isPlayerNearby && !this.state.isFollowingPlayer) {
            this.state.isFollowingPlayer = true;
            console.log(`${this.itemType} item started following player`);
        }
    }

    protected updateMovement(deltaTime: number): void {
        const config = GameConfig.items[this.itemType];
        
        if (this.state.isFollowingPlayer && this.playerPosition) {
            // Move towards player with attraction force
            const directionToPlayer = this.getDirectionToPlayer();
            const attractionForce = config.attractionForce;
            
            // Apply attraction force
            this.velocity.x += directionToPlayer.x * attractionForce * deltaTime;
            this.velocity.y += directionToPlayer.y * attractionForce * deltaTime;
        } else {
            // Default falling behavior - always move downward
            const fallSpeed = 120; // Pixels per second - increased for faster falling
            this.velocity.y = fallSpeed;
            
            // Slight horizontal drift to make it more natural
            if (Math.abs(this.velocity.x) < 5) {
                this.velocity.x += (Math.random() - 0.5) * 10 * deltaTime;
            }
            
            // Gradually reduce horizontal velocity for natural settling
            this.velocity.x *= 0.99;
        }
        
        // Limit maximum speed
        const maxSpeed = config.speed * (this.state.isFollowingPlayer ? 2 : 1);
        const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
        
        if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            this.velocity.x *= scale;
            this.velocity.y *= scale;
        }
    }

    protected updatePosition(deltaTime: number): void {
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
    }

    protected updateAnimation(deltaTime: number): void {
        // Abstract method for subclasses to implement custom animation updates
    }

    protected checkBounds(): void {
        // Deactivate if item goes off screen
        if (this.y > GameConfig.screen.height + 100 || 
            this.x < -100 || 
            this.x > GameConfig.screen.width + 100) {
            this.deactivate();
        }
    }

    protected getDistanceToPlayer(): number {
        if (!this.playerPosition) return Infinity;
        
        const dx = this.x - this.playerPosition.x;
        const dy = this.y - this.playerPosition.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    protected getDirectionToPlayer(): Vector2 {
        if (!this.playerPosition) return { x: 0, y: 0 };
        
        const dx = this.playerPosition.x - this.x;
        const dy = this.playerPosition.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return { x: 0, y: 0 };
        
        return {
            x: dx / distance,
            y: dy / distance
        };
    }

    // Collision and Collection Methods
    public collectByPlayer(): void {
        console.log(`${this.itemType} item collected by player`);
        this.applyEffect();
        this.deactivate();
    }

    protected abstract applyEffect(): void;

    public deactivate(): void {
        this.isActive = false;
        this.state.isActive = false;
        this.state.isFollowingPlayer = false;
        this.visible = false;
        this.velocity.x = 0;
        this.velocity.y = 0;
    }

    public destroy(): void {
        if (this.animation) {
            this.animation.destroy();
            this.animation = null;
        }
        
        if (this.parent) {
            this.parent.removeChild(this);
        }
        
        super.destroy();
    }

    // Entity interface methods
    public getPosition(): Vector2 {
        return { x: this.x, y: this.y };
    }

    public getItemType(): ItemType {
        return this.itemType;
    }

    public getState(): ItemState {
        return this.state;
    }

    // Set player position for tracking
    public setPlayerPosition(playerPosition: Vector2): void {
        this.playerPosition = playerPosition;
    }

    // CollidableEntity interface methods
    public getCategory(): EntityCategory {
        return EntityCategory.ITEM;
    }

    public getBounds(): PIXI.Rectangle {
        return super.getBounds();
    }

    // Abstract methods for subclasses
    public abstract setupVisuals(): Promise<void>;
} 