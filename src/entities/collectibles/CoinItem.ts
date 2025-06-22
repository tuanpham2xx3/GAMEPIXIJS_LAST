import * as PIXI from 'pixi.js';
import { Item } from './Item';
import { CoinAnimator } from '../../managers/animations/collectibles/CoinAnimator';
import { GameConfig } from '../../core/Config';

export class CoinItem extends Item {
    private coinAnimator: CoinAnimator;

    constructor() {
        super('coin');
        this.coinAnimator = new CoinAnimator();
    }

    public async setupVisuals(): Promise<void> {
        try {
            // Create coin animation using existing CoinAnimator
            const config = GameConfig.items.coin;
            this.animation = await this.coinAnimator.createCoinAnimation({
                speed: config.animationSpeed,
                loop: true,
                autoPlay: true,
                scale: 0.8,
                anchor: { x: 0.5, y: 0.5 }
            });

            this.addChild(this.animation);
            console.log('Coin animation setup completed using CoinAnimator');
        } catch (error) {
            console.error('Failed to setup coin visuals:', error);
            // Fallback to simple colored circle
            await this.setupFallbackVisual();
        }
    }

    private async setupFallbackVisual(): Promise<void> {
        try {
            // Create a simple gold circle as fallback
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0xFFD700); // Gold color
            graphics.drawCircle(0, 0, 16);
            graphics.endFill();
            
            // Add a "$" symbol
            graphics.lineStyle(2, 0x000000);
            graphics.moveTo(-6, -8);
            graphics.lineTo(-6, 8);
            graphics.moveTo(6, -8);
            graphics.lineTo(6, 8);
            graphics.moveTo(-4, -6);
            graphics.lineTo(4, -6);
            graphics.moveTo(-4, 6);
            graphics.lineTo(4, 6);

            this.animation = graphics as any;
            this.addChild(graphics);
            console.log('Coin fallback visual setup completed');
        } catch (error) {
            console.error('Failed to setup coin fallback visual:', error);
        }
    }

    protected updateAnimation(deltaTime: number): void {
        if (this.isActive && this.animation) {
            // Add subtle floating effect
            const time = Date.now() * 0.003;
            this.animation.y = Math.sin(time) * 2; // Small vertical oscillation
        }
    }

    protected applyEffect(): void {
        // Apply coin collection effect
        const config = GameConfig.items.coin;
        console.log(`Coin collected! Value: ${config.value}`);
        
        // The actual coin adding is handled by GameOrchestrator
        // This method is called from the collision system
    }

    public destroy(): void {
        if (this.animation && this.animation instanceof PIXI.AnimatedSprite) {
            this.animation.stop();
        }
        super.destroy();
    }
} 