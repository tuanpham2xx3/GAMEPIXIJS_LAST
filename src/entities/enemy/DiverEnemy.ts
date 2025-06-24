import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { GameConfig } from '../../core/Config';

export class DiverEnemy extends Enemy {
    constructor() {
        super('diver');
    }

    public async setupVisuals(): Promise<void> {
    
        
        const animationManager = AnimationManager.getInstance();
        const config = GameConfig.enemies.diver;
        this.sprite = await animationManager.createDiverAnimation({
            scale: 0.5,
            enableAnimation: true,
            animationSpeed: config.animationSpeed
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Diver animation');
        }
        
        this.addChild(this.sprite);
    
    }
} 