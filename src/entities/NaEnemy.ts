import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../managers/AnimationManager';

export class NaEnemy extends Enemy {
    constructor() {
        super('na');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up NaEnemy visuals...');
        
        try {
            const animationManager = AnimationManager.getInstance();
            this.sprite = await animationManager.createNaAnimation({
                scale: 0.45,
                enableAnimation: true,
                animationSpeed: 0.022
            });
            
            if (this.sprite) {
                this.addChild(this.sprite);
                console.log('NaEnemy animation created successfully');
            } else {
                throw new Error('Animation manager returned null sprite');
            }
        } catch (error) {
            console.warn('Failed to load NaEnemy animation, using fallback:', error);
            this.createFallbackSprite();
        }
    }

    private createFallbackSprite(): void {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x8844ff);
        graphics.drawCircle(0, 0, 22);
        graphics.endFill();
        
        // Add a simple "N" text for identification
        const text = new PIXI.Text('N', { 
            fontSize: 16, 
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        graphics.addChild(text);
        
        this.sprite = graphics;
        this.addChild(this.sprite);
        console.log('NaEnemy fallback sprite created');
    }
} 