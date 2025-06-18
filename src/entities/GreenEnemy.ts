import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../managers/AnimationManager';

export class GreenEnemy extends Enemy {
    constructor() {
        super('green');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up GreenEnemy visuals...');
        
        try {
            const animationManager = AnimationManager.getInstance();
            this.sprite = await animationManager.createGreenAnimation({
                scale: 0.5,
                enableAnimation: true,
                animationSpeed: 0.025
            });
            
            if (this.sprite) {
                this.addChild(this.sprite);
                console.log('GreenEnemy animation created successfully');
            } else {
                throw new Error('Animation manager returned null sprite');
            }
        } catch (error) {
            console.warn('Failed to load GreenEnemy animation, using fallback:', error);
            this.createFallbackSprite();
        }
    }

    private createFallbackSprite(): void {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x00aa00);
        graphics.drawCircle(0, 0, 26);
        graphics.endFill();
        
        // Add a simple "G" text for identification
        const text = new PIXI.Text('G', { 
            fontSize: 18, 
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        graphics.addChild(text);
        
        this.sprite = graphics;
        this.addChild(this.sprite);
        console.log('GreenEnemy fallback sprite created');
    }
} 