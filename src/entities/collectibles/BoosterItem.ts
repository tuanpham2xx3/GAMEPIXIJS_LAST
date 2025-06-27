import * as PIXI from 'pixi.js';
import { Item } from './Item';
import { AssetManager } from '../../managers/AssetManager';
import { GameConfig } from '../../core/Config';

export class BoosterItem extends Item {
    private glowEffect: PIXI.Graphics | null = null;
    private assetManager: AssetManager;

    constructor() {
        super('booster');
        this.assetManager = AssetManager.getInstance();
    }

    public async setupVisuals(): Promise<void> {
        try {
            // Load booster texture using AssetManager
            const boosterTexture = await this.assetManager.loadTexture(
                'assets/textures/ui/collectibles/booster_levelup.png',
                'booster'
            );
            
            this.animation = new PIXI.Sprite(boosterTexture);
            this.animation.anchor.set(0.5);

            // Scale to match config size
            const config = GameConfig.items.booster;
            const scaleX = config.size.width / this.animation.width;
            const scaleY = config.size.height / this.animation.height;
            this.animation.scale.set(Math.min(scaleX, scaleY));

            // Create glow effect
            this.createGlowEffect();

            this.addChild(this.animation);
        } catch (error) {
            console.error('Failed to setup booster visuals:', error);
            await this.setupFallbackVisual();
        }
    }

    private createGlowEffect(): void {
        // Create a subtle glow effect around the booster
        this.glowEffect = new PIXI.Graphics();
        this.glowEffect.beginFill(0x00FFFF, 0.3); // Cyan glow with transparency
        this.glowEffect.drawCircle(0, 0, 25);
        this.glowEffect.endFill();
        this.glowEffect.zIndex = -1; // Behind the main sprite
        this.addChild(this.glowEffect);
    }

    private async setupFallbackVisual(): Promise<void> {
        try {
            // Create a basic colored shape as fallback
            const graphics = new PIXI.Graphics();
            graphics.beginFill(0x00FF00); // Green color
            graphics.drawCircle(0, 0, 20);
            graphics.endFill();
            
            // Add a "+" symbol to indicate it's a booster
            graphics.lineStyle(3, 0xFFFFFF);
            graphics.moveTo(-10, 0);
            graphics.lineTo(10, 0);
            graphics.moveTo(0, -10);
            graphics.lineTo(0, 10);

            this.animation = graphics as any;
            this.addChild(graphics);
        } catch (error) {
            console.error('Failed to setup booster fallback visual:', error);
        }
    }

    protected updateAnimation(deltaTime: number): void {
        if (this.isActive) {
            const time = Date.now() * 0.005;
            
            // Pulsing glow effect
            if (this.glowEffect) {
                this.glowEffect.alpha = 0.3 + Math.sin(time * 2) * 0.2;
                this.glowEffect.scale.set(1 + Math.sin(time * 3) * 0.1);
            }
            
            // Gentle floating and rotation
            if (this.animation) {
                this.animation.y = Math.sin(time) * 3; // Vertical oscillation
                this.animation.rotation += deltaTime * 1.0; // Rotation
            }
        }
    }

    protected applyEffect(): void {
        // Apply booster effect - increase bullet level
        const config = GameConfig.items.booster;
        
        // The actual bullet upgrade is handled by GameOrchestrator
        // This method is called from the collision system
        // Bullet level system will be implemented later
    }

    public destroy(): void {
        if (this.glowEffect) {
            this.glowEffect.destroy();
            this.glowEffect = null;
        }
        super.destroy();
    }
} 