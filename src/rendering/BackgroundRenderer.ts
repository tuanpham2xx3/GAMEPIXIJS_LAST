import * as PIXI from 'pixi.js';
import { GameConfig } from '../core/Config';

/**
 * Responsible for background rendering and scrolling
 * Single Responsibility: Background management
 */
export class BackgroundRenderer {
  private backgroundContainer: PIXI.Container;
  private scrollingBackground: PIXI.TilingSprite | null = null;
  private backgroundTexture: PIXI.Texture | null = null;

  constructor(backgroundContainer: PIXI.Container) {
    this.backgroundContainer = backgroundContainer;
  }

  /**
   * Initialize background
   */
  public async initialize(): Promise<void> {
    try {
      // Try to load the background image
      this.backgroundTexture = await PIXI.Assets.load(GameConfig.background.src);
      
      // Create scrolling background
      this.createScrollingBackground();
      
    } catch (error) {
      console.warn('Could not load background, creating fallback starfield');
      console.error('Background load error:', error);
      this.createFallbackBackground();
    }
  }

  /**
   * Create scrolling background from texture
   */
  private createScrollingBackground(): void {
    if (!this.backgroundTexture) return;

    // Create single TilingSprite
    this.scrollingBackground = new PIXI.TilingSprite(
      this.backgroundTexture,
      GameConfig.screen.width,
      GameConfig.screen.height + this.backgroundTexture.height
    );
    
    this.backgroundContainer.addChild(this.scrollingBackground);
  }

  /**
   * Create fallback starfield background
   */
  private createFallbackBackground(): void {
    // Create starfield background as fallback
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x0d1b2a);
    graphics.drawRect(0, 0, GameConfig.screen.width, GameConfig.screen.height);
    graphics.endFill();

    // Add stars
    for (let i = 0; i < 200; i++) {
      const star = new PIXI.Graphics();
      const size = Math.random() * 3 + 1;
      const alpha = Math.random() * 0.8 + 0.2;
      
      star.beginFill(0xffffff, alpha);
      star.drawCircle(0, 0, size);
      star.endFill();
      
      star.x = Math.random() * GameConfig.screen.width;
      star.y = Math.random() * GameConfig.screen.height;
      
      graphics.addChild(star);
    }

    this.backgroundContainer.addChild(graphics);
  }

  /**
   * Update scrolling animation
   */
  public update(deltaTime: number): void {
    if (!this.scrollingBackground) return;

    const scrollSpeed = GameConfig.background.scrollSpeed;
    this.scrollingBackground.tilePosition.y += scrollSpeed * deltaTime;
  }

  /**
   * Handle screen resize
   */
  public onResize(): void {
    if (this.scrollingBackground) {
      this.scrollingBackground.width = GameConfig.screen.width;
      this.scrollingBackground.height = GameConfig.screen.height + (this.backgroundTexture?.height || 0);
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    if (this.scrollingBackground) {
      this.scrollingBackground.destroy();
      this.scrollingBackground = null;
    }
    this.backgroundTexture = null;
  }
} 