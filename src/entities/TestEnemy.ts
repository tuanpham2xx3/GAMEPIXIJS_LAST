import * as PIXI from 'pixi.js';
import { Enemy } from './Enemy';

export class TestEnemy extends Enemy {
    constructor() {
        super('inferior'); // Use inferior config
    }

    public async setupVisuals(): Promise<void> {
        console.log('Setting up TestEnemy visuals (always fallback)...');
        this.createFallbackSprite();
    }

    private createFallbackSprite(): void {
        const graphics = new PIXI.Graphics();
        graphics.beginFill(0xff0000); // Red circle
        graphics.drawCircle(0, 0, 20);
        graphics.endFill();
        
        // Add a simple "T" text for identification
        const text = new PIXI.Text('T', { 
            fontSize: 14, 
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        graphics.addChild(text);
        
        this.sprite = graphics;
        this.addChild(this.sprite);
        console.log('TestEnemy fallback sprite created and added');
    }
} 