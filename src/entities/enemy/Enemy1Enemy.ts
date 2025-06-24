import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';

export class Enemy1Enemy extends Enemy {
    constructor() {
        super('enemy1');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up Enemy1Enemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        this.sprite = await animationManager.createEnemy1Animation({
            scale: 0.7,
            speed: 0.12,
            loop: true,
            autoPlay: true
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Enemy1 animation');
        }
        
        this.addChild(this.sprite);
        console.log('Enemy1Enemy animation created successfully');
    }
} 