import { Enemy } from './Enemy';
import { AnimationManager } from '../../managers/animations/AnimationManager';
import { GameConfig } from '../../core/Config';
import * as PIXI from 'pixi.js';

export class BossEnemy extends Enemy {
    private shootTimer: number = 0;

    constructor() {
        super('boss');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up BossEnemy visuals...');
        
        const animationManager = AnimationManager.getInstance();
        const config = GameConfig.enemies.boss;
        this.sprite = await animationManager.createBossAnimation({
            scale: 1.2,
            speed: config.animationSpeed
        });
        
        if (!this.sprite) {
            throw new Error('Failed to create Boss animation');
        }
        
        this.addChild(this.sprite);
        console.log('BossEnemy animation created successfully');
    }



    public update(deltaTime: number): void {
        super.update(deltaTime);
        
        // Boss shooting logic could be added here
        this.shootTimer += deltaTime;
        if (this.shootTimer > 2) { // Shoot every 2 seconds
            this.shootTimer = 0;
            // TODO: Implement boss shooting when bullet system is extended
        }
    }

    protected checkBounds(): void {
        // Boss doesn't deactivate when going off screen
        // Keep it within reasonable bounds instead
        if (this.x < -60) this.x = -60;
        if (this.x > GameConfig.screen.width + 60) this.x = GameConfig.screen.width + 60;
        if (this.y < -60) this.y = -60;
        if (this.y > GameConfig.screen.height + 60) this.y = GameConfig.screen.height + 60;
    }


} 