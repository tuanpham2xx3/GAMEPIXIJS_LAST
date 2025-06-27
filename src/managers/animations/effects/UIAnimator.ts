import { Container, Sprite, Graphics, Text, TextStyle, Application } from 'pixi.js';
import { CircleAnimationConfig, BlinkAnimationConfig } from '../core/AnimationConfig';
import { AnimationUtils } from '../core/AnimationUtils';
import { AssetManager } from '../../AssetManager';
import { GameConfig } from '../../../core/Config';

export class UIAnimator {
    private assetManager: AssetManager;
    private app?: Application;

    constructor(app?: Application) {
        this.assetManager = AssetManager.getInstance();
        this.app = app;
    }

    /**
     * Create Circle Animation - 2 circles scaling in/out around player
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
            speed: config.speed || GameConfig.animation.effects.uiFadeSpeed,
            minScale: config.minScale || 0.8,
            maxScale: config.maxScale || 1.2,
        };

        try {
            // Load circle texture from assets
            const circleTexture = await this.assetManager.loadTexture('assets/textures/backgrounds/circle.png');

            // Create 2 circles from texture
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

            // Animation variables
            let time1 = 0;
            let time2 = Math.PI; // Offset phase

            const animationFn = () => {
                time1 += finalConfig.speed;
                time2 += finalConfig.speed;

                // Circle 1 animation
                const scale1 = finalConfig.minScale + (finalConfig.maxScale - finalConfig.minScale) * 
                              (Math.sin(time1) * 0.5 + 0.5);
                circle1.scale.set(scale1);

                // Circle 2 animation (offset phase)
                const scale2 = finalConfig.minScale + (finalConfig.maxScale - finalConfig.minScale) * 
                              (Math.sin(time2) * 0.5 + 0.5);
                circle2.scale.set(scale2);

                // Update position to follow player if needed
                if (config.playerX !== undefined && config.playerY !== undefined) {
                    circle1.position.set(config.playerX, config.playerY);
                    circle2.position.set(config.playerX, config.playerY);
                }
            };

            this.app.ticker.add(animationFn);
            (container as any)._circleAnimationFn = animationFn;

        } catch (error) {
            console.error('Error loading circle texture:', error);
            // Fallback to graphics if texture loading fails
            const fallbackCircle = new Graphics();
            fallbackCircle.beginFill(finalConfig.color, finalConfig.alpha);
            fallbackCircle.drawCircle(0, 0, finalConfig.size / 2);
            fallbackCircle.endFill();
            container.addChild(fallbackCircle);
        }

        return container;
    }

    /**
     * Update Circle Animation position to follow player
     */
    public updateCirclePosition(circleContainer: Container, playerX: number, playerY: number): void {
        if (circleContainer.children.length >= 2) {
            circleContainer.children[0].position.set(playerX, playerY);
            circleContainer.children[1].position.set(playerX, playerY);
        }
    }

    /**
     * Create Warning Animation - warning_bg and txt_warning blinking
     */
    public async createWarningAnimation(config: BlinkAnimationConfig = {}): Promise<Container> {
        if (!this.app) {
            console.warn('App not initialized for warning animation');
            return new Container();
        }

        const container = new Container();
        
        const finalConfig = {
            speed: config.speed || GameConfig.animation.effects.uiFadeSpeed,
            minAlpha: config.minAlpha || 0.3,
            maxAlpha: config.maxAlpha || 1.0,
        };

        try {
            // Load warning background and text
            const warningBgTexture = await this.assetManager.loadTexture('assets/textures/ui/icons/warning_bg.png');
            const txtWarningTexture = await this.assetManager.loadTexture('assets/textures/ui/icons/txt_warning.png');

            // Create sprites
            const warningBg = new Sprite(warningBgTexture);
            const txtWarning = new Sprite(txtWarningTexture);

            // Setup sprites
            warningBg.anchor.set(0.5);
            txtWarning.anchor.set(0.5);

            container.addChild(warningBg, txtWarning);

            // Animation variables
            let time = 0;

            const animationFn = () => {
                time += finalConfig.speed;
                
                // Blinking alpha
                const alpha = finalConfig.minAlpha + (finalConfig.maxAlpha - finalConfig.minAlpha) * 
                             (Math.sin(time) * 0.5 + 0.5);
                
                warningBg.alpha = alpha;
                txtWarning.alpha = alpha;
            };

            this.app.ticker.add(animationFn);
            (container as any)._warningAnimationFn = animationFn;

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
            
            // Animation for fallback
            let time = 0;
            const animationFn = () => {
                time += finalConfig.speed;
                const alpha = finalConfig.minAlpha + (finalConfig.maxAlpha - finalConfig.minAlpha) * 
                             (Math.sin(time) * 0.5 + 0.5);
                fallbackWarning.alpha = alpha;
                warningText.alpha = alpha;
            };
            
            this.app.ticker.add(animationFn);
            (container as any)._warningAnimationFn = animationFn;
        }

        return container;
    }

    /**
     * Create Tutorial Animation - txt_tutorial blinking
     */
    public async createTutorialAnimation(config: BlinkAnimationConfig = {}): Promise<Sprite | Text> {
        if (!this.app) {
            console.warn('App not initialized for tutorial animation');
            return new Text('Tutorial', new TextStyle({ fontSize: 16, fill: 0xffffff }));
        }
        
        const finalConfig = {
            speed: config.speed || GameConfig.animation.effects.uiFadeSpeed,
            minAlpha: config.minAlpha || 0.4,
            maxAlpha: config.maxAlpha || 1.0,
        };

        try {
            // Load tutorial text
            const txtTutorialTexture = await this.assetManager.loadTexture('assets/textures/ui/icons/txt_tutorial.png');
            
            const txtTutorial = new Sprite(txtTutorialTexture);
            txtTutorial.anchor.set(0.5);

            // Animation variables
            let time = 0;

            const animationFn = () => {
                time += finalConfig.speed;
                
                // Blinking alpha
                const alpha = finalConfig.minAlpha + (finalConfig.maxAlpha - finalConfig.minAlpha) * 
                             (Math.sin(time) * 0.5 + 0.5);
                
                txtTutorial.alpha = alpha;
            };

            this.app.ticker.add(animationFn);
            (txtTutorial as any)._tutorialAnimationFn = animationFn;

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
            
            // Animation for fallback
            let time = 0;
            const animationFn = () => {
                time += finalConfig.speed;
                const alpha = finalConfig.minAlpha + (finalConfig.maxAlpha - finalConfig.minAlpha) * 
                             (Math.sin(time) * 0.5 + 0.5);
                fallbackTutorial.alpha = alpha;
            };
            
            this.app.ticker.add(animationFn);
            (fallbackTutorial as any)._tutorialAnimationFn = animationFn;
            
            return fallbackTutorial;
        }
    }

    /**
     * Remove Circle Animation
     */
    public removeCircleAnimation(circleContainer: Container): void {
        if (!this.app || !circleContainer) return;
        
        const animationFn = (circleContainer as any)._circleAnimationFn;
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            delete (circleContainer as any)._circleAnimationFn;
        }
    }

    /**
     * Remove Warning Animation
     */
    public removeWarningAnimation(warningContainer: Container): void {
        if (!this.app || !warningContainer) return;
        
        const animationFn = (warningContainer as any)._warningAnimationFn;
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            delete (warningContainer as any)._warningAnimationFn;
        }
    }

    /**
     * Remove Tutorial Animation
     */
    public removeTutorialAnimation(tutorialSprite: Sprite): void {
        if (!this.app || !tutorialSprite) return;
        
        const animationFn = (tutorialSprite as any)._tutorialAnimationFn;
        if (animationFn) {
            this.app.ticker.remove(animationFn);
            delete (tutorialSprite as any)._tutorialAnimationFn;
        }
    }

    /**
     * Preload all UI animations
     */
    public async preloadAnimations(): Promise<void> {
        try {
            await Promise.all([
                this.assetManager.loadTexture('assets/textures/backgrounds/circle.png'),
                this.assetManager.loadTexture('assets/textures/ui/icons/warning_bg.png'),
                this.assetManager.loadTexture('assets/textures/ui/icons/txt_warning.png'),
                this.assetManager.loadTexture('assets/textures/ui/icons/txt_tutorial.png')
            ]);
        } catch (error) {
            console.error('❌ Failed to preload UI animations:', error);
            throw error;
        }
    }
} 