import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { GameConfig } from '../../core/Config';

export class SoldierEnemy extends Enemy {
    constructor() {
        super('soldier');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up SoldierEnemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        const config = GameConfig.enemies.soldier;
        this.sprite = await animationManager.createSoldierAnimation({
            scale: 0.5,
            enableAnimation: true,
            animationSpeed: config.animationSpeed
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Soldier animation');
        }
        
        this.addChild(this.sprite);
        console.log('SoldierEnemy animation created successfully');
    }
} 