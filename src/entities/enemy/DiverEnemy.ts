import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/AnimationManager';

export class DiverEnemy extends Enemy {
    constructor() {
        super('diver');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up DiverEnemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        this.sprite = await animationManager.createDiverAnimation({
            scale: 0.5,
            enableAnimation: true,
            animationSpeed: 0.028
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Diver animation');
        }
        
        this.addChild(this.sprite);
        console.log('DiverEnemy animation created successfully');
    }
} 