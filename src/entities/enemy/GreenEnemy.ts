import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { GameConfig } from '../../core/Config';

export class GreenEnemy extends Enemy {
    constructor() {
        super('green');
    }

    public async setupVisuals(): Promise<void> {
    
        
        const animationManager = AnimationManager.getInstance();
        const config = GameConfig.enemies.green;
        this.sprite = await animationManager.createGreenAnimation({
            scale: 0.5,
            enableAnimation: true,
            animationSpeed: config.animationSpeed
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Green animation');
        }
        
        this.addChild(this.sprite);
    
    }
} 