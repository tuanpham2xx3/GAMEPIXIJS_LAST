import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { GameConfig } from '../../core/Config';
import * as PIXI from 'pixi.js';
import { AssetManager } from '../../managers/AssetManager';

export class BossEnemy extends Enemy {
    private shootTimer: number = 0;

    constructor() {
        super('boss');
    }

    protected async setupVisuals(): Promise<void> {
        try {
            // Setup boss visuals
            const texture = await this.assetManager.loadTexture(AssetManager.paths.BOSS_SHIP);
            
            if (texture) {
                const sprite = new PIXI.Sprite(texture);
                sprite.anchor.set(0.5);
                sprite.scale.set(0.8);
                this.addChild(sprite);
            }

            // Create boss animation
            const animation = await this.animationManager.createBossAnimation({
                loop: true,
                autoPlay: true,
                scale: 0.8,
                anchor: { x: 0.5, y: 0.5 }
            });
            
            this.addChild(animation);

        } catch (error) {
            console.error('Failed to setup boss visuals:', error);
            this.setupFallbackVisual();
        }
    }

    public update(deltaTime: number): void {
        super.update(deltaTime);
        
        // Boss shooting logic could be added here
        this.shootTimer += deltaTime;
        if (this.shootTimer > 2) { // Shoot every 2 seconds
            this.shootTimer = 0;
            // TODO: Implement boss shooting when bullet system is extended
        }
    }

    protected checkBounds(): void {
        // Boss doesn't deactivate when going off screen
        // Keep it within reasonable bounds instead
        if (this.x < -60) this.x = -60;
        if (this.x > GameConfig.screen.width + 60) this.x = GameConfig.screen.width + 60;
        if (this.y < -60) this.y = -60;
        if (this.y > GameConfig.screen.height + 60) this.y = GameConfig.screen.height + 60;
    }

    private setupFallbackVisual(): void {
        // Implementation of setupFallbackVisual method
    }
} 