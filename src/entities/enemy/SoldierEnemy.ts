import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';

export class SoldierEnemy extends Enemy {
    constructor() {
        super('soldier');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up SoldierEnemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        this.sprite = await animationManager.createSoldierAnimation({
            scale: 0.6,
            enableAnimation: true,
            animationSpeed: 0.02
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Soldier animation');
        }
        
        this.addChild(this.sprite);
        console.log('SoldierEnemy animation created successfully');
    }
} 