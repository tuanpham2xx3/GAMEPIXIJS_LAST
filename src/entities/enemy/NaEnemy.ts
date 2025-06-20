import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/AnimationManager';

export class NaEnemy extends Enemy {
    constructor() {
        super('na');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up NaEnemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        this.sprite = await animationManager.createNaAnimation({
            scale: 0.45,
            enableAnimation: true,
            animationSpeed: 0.022
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Na animation');
        }
        
        this.addChild(this.sprite);
        console.log('NaEnemy animation created successfully');
    }
} 