import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../managers/AnimationManager';

export class DiverEnemy extends Enemy {
    constructor() {
        super('diver');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up DiverEnemy visuals...');
        
        try {
            const animationManager = AnimationManager.getInstance();
            this.sprite = await animationManager.createDiverAnimation({
                scale: 0.5,
                enableAnimation: true,
                animationSpeed: 0.028
            });
            
            if (this.sprite) {
                this.addChild(this.sprite);
                console.log('DiverEnemy animation created successfully');
            } else {
                throw new Error('Animation manager returned null sprite');
            }
        } catch (error) {
            console.warn('Failed to load DiverEnemy animation, using fallback:', error);
            this.createFallbackSprite();
        }
    }

    private createFallbackSprite(): void {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x00ff88);
        graphics.drawCircle(0, 0, 24);
        graphics.endFill();
        
        // Add a simple "D" text for identification
        const text = new PIXI.Text('D', { 
            fontSize: 16, 
            fill: 0x000000,
            fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        graphics.addChild(text);
        
        this.sprite = graphics;
        this.addChild(this.sprite);
        console.log('DiverEnemy fallback sprite created');
    }
} 