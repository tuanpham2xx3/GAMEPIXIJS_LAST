import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { GameConfig } from '../../core/Config';

export class NaEnemy extends Enemy {
    constructor() {
        super('na');
    }

    public async setupVisuals(): Promise<void> {
    
        
        const animationManager = AnimationManager.getInstance();
        const config = GameConfig.enemies.na;
        this.sprite = await animationManager.createNaAnimation({
            scale: 0.5,
            enableAnimation: true,
            animationSpeed: config.animationSpeed
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Na animation');
        }
        
        this.addChild(this.sprite);
    
    }
} 