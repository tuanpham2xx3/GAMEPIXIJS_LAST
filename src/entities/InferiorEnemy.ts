import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../managers/AnimationManager';

export class InferiorEnemy extends Enemy {
    constructor() {
        super('inferior');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up InferiorEnemy visuals...');
        
        try {
            const animationManager = AnimationManager.getInstance();
            this.sprite = await animationManager.createInferiorAnimation({
                scale: 0.4,
                enableAnimation: true,
                animationSpeed: 0.018
            });
            
            if (this.sprite) {
                this.addChild(this.sprite);
                console.log('InferiorEnemy animation created successfully');
            } else {
                throw new Error('Animation manager returned null sprite');
            }
        } catch (error) {
            console.warn('Failed to load InferiorEnemy animation, using fallback:', error);
            this.createFallbackSprite();
        }
    }

    private createFallbackSprite(): void {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xff4444);
        graphics.drawCircle(0, 0, 20);
        graphics.endFill();
        
        // Add a simple "I" text for identification
        const text = new PIXI.Text('I', { 
            fontSize: 14, 
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        graphics.addChild(text);
        
        this.sprite = graphics;
        this.addChild(this.sprite);
        console.log('InferiorEnemy fallback sprite created');
    }
} 