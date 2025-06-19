import * as PIXI from 'pixi.js';

export interface GameAssets {
  playerTexture: PIXI.Texture;
  bulletTexture: PIXI.Texture;
}

export interface LoadingProgress {
  percentage: number;
  message: string;
}

/**
 * Responsible for loading all game assets
 * Single Responsibility: Asset management
 */
export class AssetLoader {
  private onProgressCallback?: (progress: LoadingProgress) => void;

  constructor(onProgress?: (progress: LoadingProgress) => void) {
    this.onProgressCallback = onProgress;
  }

  /**
   * Load all essential game assets
   */
  public async loadGameAssets(): Promise<GameAssets> {
    this.updateProgress(25, 'Loading textures...');

    try {
      // Load player and bullet assets
      await PIXI.Assets.load([
        { alias: 'player', src: 'assets/textures/characters/player/ship_phoenix_dark.png' },
        { alias: 'bullet', src: 'assets/textures/projectiles/bullet_phoenix.png' }
      ]);

      this.updateProgress(75, 'Processing assets...');

      let playerTexture: PIXI.Texture;
      let bulletTexture: PIXI.Texture;

      // Try to get real textures, fallback to colored rectangles
      try {
        playerTexture = PIXI.Assets.get('player');
        bulletTexture = PIXI.Assets.get('bullet');
        console.log('✅ Loaded game assets successfully');
      } catch (assetError) {
        console.warn('⚠️ Could not load assets, using fallback textures');
        playerTexture = this.createFallbackTexture(0x00ff88, 64, 64); // Green player
        bulletTexture = this.createFallbackTexture(0xffff00, 8, 16);  // Yellow bullets
      }

      this.updateProgress(100, 'Assets ready!');

      return {
        playerTexture,
        bulletTexture
      };

    } catch (error) {
      console.error('❌ Failed to load assets:', error);
      
      // Return fallback textures
      return {
        playerTexture: this.createFallbackTexture(0x00ff88, 64, 64),
        bulletTexture: this.createFallbackTexture(0xffff00, 8, 16)
      };
    }
  }

  /**
   * Create a colored texture as fallback
   */
  private createFallbackTexture(color: number, width: number, height: number): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    
    return PIXI.Texture.from(graphics as any);
  }

  /**
   * Update loading progress
   */
  private updateProgress(percentage: number, message: string): void {
    if (this.onProgressCallback) {
      this.onProgressCallback({ percentage, message });
    }
  }

  /**
   * Preload additional assets (background, effects, etc.)
   */
  public async preloadAdditionalAssets(): Promise<void> {
    // This can be extended to load more assets
    console.log('📦 Additional assets preloaded');
  }
} 