import { Enemy } from './Enemy';
import { AnimationManager } from '../managers/AnimationManager';
import { GameConfig } from '../core/Config';
import * as PIXI from 'pixi.js';

export class BossEnemy extends Enemy {
    private phase: number = 1;
    private phaseChangeTime: number = 0;
    private shootTimer: number = 0;

    constructor() {
        super('boss');
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up BossEnemy visuals...');
        
        try {
            const animationManager = AnimationManager.getInstance();
            // Using enemy1 animation for boss - larger scale
            this.sprite = await animationManager.createEnemy1Animation({
                scale: 1.2,
                speed: 0.05
            });
            
            if (this.sprite) {
                this.addChild(this.sprite);
                console.log('BossEnemy animation created successfully');
            } else {
                throw new Error('Animation manager returned null sprite');
            }
        } catch (error) {
            console.warn('Failed to load BossEnemy animation, using fallback:', error);
            this.createFallbackSprite();
        }
    }

    private createFallbackSprite(): void {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xff0000);
        graphics.drawRect(-60, -60, 120, 120);
        graphics.endFill();
        this.sprite = graphics;
        this.addChild(this.sprite);
    }

    protected updateBossMovement(deltaTime: number, currentTime: number): void {
        const config = GameConfig.enemies[this.enemyType];
        
        // Phase management
        if (currentTime - this.phaseChangeTime > 10) { // Change phase every 10 seconds
            this.phase = this.phase === 1 ? 2 : 1;
            this.phaseChangeTime = currentTime;
        }

        // Movement patterns based on phase
        if (this.phase === 1) {
            // Phase 1: Horizontal movement at top of screen
            this.velocity.y = 0;
            this.velocity.x = Math.sin(currentTime * 2) * 100;
            
            // Keep boss at top quarter of screen
            if (this.y > GameConfig.screen.height * 0.25) {
                this.y = GameConfig.screen.height * 0.25;
            }
        } else {
            // Phase 2: Circular movement
            const centerX = GameConfig.screen.width / 2;
            const centerY = GameConfig.screen.height * 0.3;
            const radius = 100;
            
            this.x = centerX + Math.cos(currentTime * 1.5) * radius;
            this.y = centerY + Math.sin(currentTime * 1.5) * 40;
            this.velocity.x = 0;
            this.velocity.y = 0;
        }

        // Keep boss within screen bounds
        if (this.x < 60) this.x = 60;
        if (this.x > GameConfig.screen.width - 60) this.x = GameConfig.screen.width - 60;
        if (this.y < 60) this.y = 60;
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

    public getPhase(): number {
        return this.phase;
    }
} 