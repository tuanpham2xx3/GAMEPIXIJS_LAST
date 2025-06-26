import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { GameConfig } from '../../core/Config';

export class InferiorEnemy extends Enemy {
    constructor() {
        super('inferior');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up InferiorEnemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        const config = GameConfig.enemies.inferior;
        this.sprite = await animationManager.createInferiorAnimation({
            scale: 0.5,
            enableAnimation: true,
            animationSpeed: config.animationSpeed
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Inferior animation');
        }
        
        this.addChild(this.sprite);
        console.log('InferiorEnemy animation created successfully');
    }
} 