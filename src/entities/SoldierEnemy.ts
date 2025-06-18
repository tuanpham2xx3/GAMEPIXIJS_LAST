import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../managers/AnimationManager';

export class SoldierEnemy extends Enemy {
    constructor() {
        super('soldier');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up SoldierEnemy visuals...');
        
        try {
            const animationManager = AnimationManager.getInstance();
            this.sprite = await animationManager.createSoldierAnimation({
                scale: 0.6,
                enableAnimation: true,
                animationSpeed: 0.02
            });
            
            if (this.sprite) {
                this.addChild(this.sprite);
                console.log('SoldierEnemy animation created successfully');
            } else {
                throw new Error('Animation manager returned null sprite');
            }
        } catch (error) {
            console.warn('Failed to load SoldierEnemy animation, using fallback:', error);
            this.createFallbackSprite();
        }
    }

    private createFallbackSprite(): void {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0x444444);
        graphics.drawCircle(0, 0, 28);
        graphics.endFill();
        
        // Add a simple "S" text for identification
        const text = new PIXI.Text('S', { 
            fontSize: 20, 
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        graphics.addChild(text);
        
        this.sprite = graphics;
        this.addChild(this.sprite);
        console.log('SoldierEnemy fallback sprite created');
    }
} 