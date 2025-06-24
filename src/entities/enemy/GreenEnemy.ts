import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';

export class GreenEnemy extends Enemy {
    constructor() {
        super('green');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up GreenEnemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        this.sprite = await animationManager.createGreenAnimation({
            scale: 0.5,
            enableAnimation: true,
            animationSpeed: 0.025
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Green animation');
        }
        
        this.addChild(this.sprite);
        console.log('GreenEnemy animation created successfully');
    }
} 