import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';

export class Enemy2Enemy extends Enemy {
    constructor() {
        super('enemy2');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up Enemy2Enemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        this.sprite = await animationManager.createEnemy2Animation({
            scale: 0.8,
            speed: 0.18,
            loop: true,
            autoPlay: true
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Enemy2 animation');
        }
        
        this.addChild(this.sprite);
        console.log('Enemy2Enemy animation created successfully');
    }
} 