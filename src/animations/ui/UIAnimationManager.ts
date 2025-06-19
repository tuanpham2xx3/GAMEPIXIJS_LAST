import { Container, Sprite, Graphics, Text, TextStyle } from 'pixi.js';
import { BaseAnimationManager } from '../core/BaseAnimationManager';
import { CircleAnimationConfig, BlinkAnimationConfig } from '../core/AnimationConfig';

/**
 * UI Animation Manager
 * Chuyên quản lý tất cả UI animations
 */
export class UIAnimationManager extends BaseAnimationManager {
    private static instance: UIAnimationManager;

    private constructor() {
        super();
    }

    public static getInstance(): UIAnimationManager {
        if (!UIAnimationManager.instance) {
            UIAnimationManager.instance = new UIAnimationManager();
        }
        return UIAnimationManager.instance;
    }

    /**
     * Tạo Circle Animation - 2 vòng tròn phóng to thu nhỏ theo player
     */
    public async createCircleAnimation(config: CircleAnimationConfig = {}): Promise<Container> {
        if (!this.app) {
            console.warn('App not initialized for circle animation');
            return new Container();
        }

        const container = new Container();
        
        const finalConfig = {
            size: config.size || 100,
            playerX: config.playerX || 0,
            playerY: config.playerY || 0,
            color: config.color || 0xFFFFFF,
            alpha: config.alpha || 0.5,
            speed: config.speed || 0.05,
            minScale: config.minScale || 0.8,
            maxScale: config.maxScale || 1.2,
        };

        try {
            // Load circle texture từ assets
            const circleTexture = await this.assetManager.loadTexture('/assets/textures/backgrounds/circle.png');

            // Tạo 2 vòng tròn từ texture
            const circle1 = new Sprite(circleTexture);
            const circle2 = new Sprite(circleTexture);

            // Setup circle 1
            circle1.anchor.set(0.5);
            circle1.position.set(finalConfig.playerX, finalConfig.playerY);
            circle1.tint = finalConfig.color;
            circle1.alpha = finalConfig.alpha;
            circle1.width = finalConfig.size;
            circle1.height = finalConfig.size;

            // Setup circle 2 (smaller, offset animation phase)
            circle2.anchor.set(0.5);
            circle2.position.set(finalConfig.playerX, finalConfig.playerY);
            circle2.tint = finalConfig.color;
            circle2.alpha = finalConfig.alpha * 0.7;
            circle2.width = finalConfig.size * 0.8;
            circle2.height = finalConfig.size * 0.8;

            container.addChild(circle1, circle2);

            this.addCircleAnimation(container, finalConfig);

        } catch (error) {
            console.error('Error loading circle texture:', error);
            // Fallback to graphics
            const fallbackCircle = new Graphics();
            fallbackCircle.beginFill(finalConfig.color, finalConfig.alpha);
            fallbackCircle.drawCircle(0, 0, finalConfig.size / 2);
            fallbackCircle.endFill();
            container.addChild(fallbackCircle);
        }

        return container;
    }

    /**
     * Tạo Warning Animation - warning_bg và txt_warning nhấp nháy
     */
    public async createWarningAnimation(config: BlinkAnimationConfig = {}): Promise<Container> {
        if (!this.app) {
            console.warn('App not initialized for warning animation');
            return new Container();
        }

        const container = new Container();
        
        const finalConfig = {
            speed: config.speed || 0.1,
            minAlpha: config.minAlpha || 0.3,
            maxAlpha: config.maxAlpha || 1.0,
        };

        try {
            // Load warning background và text
            const warningBgTexture = await this.assetManager.loadTexture('/assets/textures/ui/icons/warning_bg.png');
            const txtWarningTexture = await this.assetManager.loadTexture('/assets/textures/ui/icons/txt_warning.png');

            // Tạo sprites
            const warningBg = new Sprite(warningBgTexture);
            const txtWarning = new Sprite(txtWarningTexture);

            // Setup sprites
            warningBg.anchor.set(0.5);
            txtWarning.anchor.set(0.5);

            container.addChild(warningBg, txtWarning);

            this.addBlinkAnimation(container, finalConfig);

        } catch (error) {
            console.error('Error loading warning assets:', error);
            
            // Fallback: Create simple graphics warning
            const fallbackWarning = new Graphics();
            fallbackWarning.beginFill(0xFF0000, 0.8);
            fallbackWarning.drawRoundedRect(-50, -25, 100, 50, 5);
            fallbackWarning.endFill();
            
            const warningText = new Text('⚠️ WARNING', new TextStyle({
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xFFFFFF,
                fontWeight: 'bold'
            }));
            warningText.anchor.set(0.5);
            
            container.addChild(fallbackWarning, warningText);
            this.addBlinkAnimation(container, finalConfig);
        }

        return container;
    }

    /**
     * Tạo Tutorial Animation - txt_tutorial nhấp nháy
     */
    public async createTutorialAnimation(config: BlinkAnimationConfig = {}): Promise<Sprite | Text> {
        if (!this.app) {
            console.warn('App not initialized for tutorial animation');
            return new Text('Tutorial', new TextStyle({ fontSize: 16, fill: 0xffffff }));
        }
        
        const finalConfig = {
            speed: config.speed || 0.08,
            minAlpha: config.minAlpha || 0.4,
            maxAlpha: config.maxAlpha || 1.0,
        };

        try {
            // Load tutorial text
            const txtTutorialTexture = await this.assetManager.loadTexture('/assets/textures/ui/icons/txt_tutorial.png');
            
            const txtTutorial = new Sprite(txtTutorialTexture);
            txtTutorial.anchor.set(0.5);

            this.addBlinkAnimationToSprite(txtTutorial, finalConfig);
            return txtTutorial;

        } catch (error) {
            console.error('Error loading tutorial assets:', error);
            
            // Fallback: Create simple graphics tutorial
            const fallbackTutorial = new Text('📚 TUTORIAL', new TextStyle({
                fontFamily: 'Arial',
                fontSize: 18,
                fill: 0x00AAFF,
                fontWeight: 'bold',
                stroke: 0x000000,
                strokeThickness: 2
            }));
            fallbackTutorial.anchor.set(0.5);
            
            this.addBlinkAnimationToSprite(fallbackTutorial, finalConfig);
            return fallbackTutorial;
        }
    }

    /**
     * Update Circle Animation position theo player
     */
    public updateCirclePosition(circleContainer: Container, playerX: number, playerY: number): void {
        if (circleContainer.children.length >= 2) {
            circleContainer.children[0].position.set(playerX, playerY);
            circleContainer.children[1].position.set(playerX, playerY);
        }
    }

    /**
     * Remove Circle Animation
     */
    public removeCircleAnimation(circleContainer: Container): void {
        this.removeAnimationByType(circleContainer, '_circleAnimationFn');
    }

    /**
     * Remove Warning Animation
     */
    public removeWarningAnimation(warningContainer: Container): void {
        this.removeAnimationByType(warningContainer, '_warningAnimationFn');
    }

    /**
     * Remove Tutorial Animation
     */
    public removeTutorialAnimation(tutorialSprite: Sprite): void {
        this.removeAnimationByType(tutorialSprite, '_tutorialAnimationFn');
    }

    // Private helper methods

    private addCircleAnimation(container: Container, config: any): void {
        if (!this.app) return;

        let time1 = 0;
        let time2 = Math.PI; // Offset phase

        const animationFn = () => {
            time1 += config.speed;
            time2 += config.speed;

            if (container.children.length >= 2) {
                const circle1 = container.children[0];
                const circle2 = container.children[1];

                const scale1 = config.minScale + (config.maxScale - config.minScale) * 
                              (Math.sin(time1) * 0.5 + 0.5);
                circle1.scale.set(scale1);

                const scale2 = config.minScale + (config.maxScale - config.minScale) * 
                              (Math.sin(time2) * 0.5 + 0.5);
                circle2.scale.set(scale2);
            }
        };

        this.app.ticker.add(animationFn);
        (container as any)._circleAnimationFn = animationFn;
    }

    private addBlinkAnimation(container: Container, config: any): void {
        if (!this.app) return;

        let time = 0;
        const animationFn = () => {
            time += config.speed;
            const alpha = config.minAlpha + (config.maxAlpha - config.minAlpha) * 
                         (Math.sin(time) * 0.5 + 0.5);
            
            container.children.forEach(child => {
                child.alpha = alpha;
            });
        };

        this.app.ticker.add(animationFn);
        (container as any)._warningAnimationFn = animationFn;
    }

    private addBlinkAnimationToSprite(sprite: Sprite | Text, config: any): void {
        if (!this.app) return;

        let time = 0;
        const animationFn = () => {
            time += config.speed;
            const alpha = config.minAlpha + (config.maxAlpha - config.minAlpha) * 
                         (Math.sin(time) * 0.5 + 0.5);
            sprite.alpha = alpha;
        };

        this.app.ticker.add(animationFn);
        (sprite as any)._tutorialAnimationFn = animationFn;
    }

    private removeAnimationByType(target: any, animationType: string): void {
        if (!this.app || !target) return;
        
        const animationFn = target[animationType];
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            delete target[animationType];
        }
    }
} 