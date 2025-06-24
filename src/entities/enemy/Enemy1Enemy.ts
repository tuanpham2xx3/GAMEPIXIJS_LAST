import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { GameConfig } from '../../core/Config';

export class Enemy1Enemy extends Enemy {
    constructor() {
        super('enemy1');
    }

    public async setupVisuals(): Promise<void> {
    
        
        const animationManager = AnimationManager.getInstance();
        const config = GameConfig.enemies.enemy1;
        this.sprite = await animationManager.createEnemy1Animation({
            scale: 0.7,
            speed: config.animationSpeed,
            loop: true,
            autoPlay: true
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Enemy1 animation');
        }
        
        this.addChild(this.sprite);
    
    }
} 