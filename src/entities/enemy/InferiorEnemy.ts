import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/AnimationManager';

export class InferiorEnemy extends Enemy {
    constructor() {
        super('inferior');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up InferiorEnemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        this.sprite = await animationManager.createInferiorAnimation({
            scale: 0.4,
            enableAnimation: true,
            animationSpeed: 0.018
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Inferior animation');
        }
        
        this.addChild(this.sprite);
        console.log('InferiorEnemy animation created successfully');
    }
} 