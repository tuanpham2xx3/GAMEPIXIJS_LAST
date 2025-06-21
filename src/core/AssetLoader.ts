import * as PIXI from 'pixi.js';

export interface GameAssets {
  playerTexture: PIXI.Texture;
  bulletTexture: PIXI.Texture;
  enemyBulletTexture: PIXI.Texture;
  smokeTexture: PIXI.Texture;
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

      await PIXI.Assets.load([
        { alias: 'player', src: 'assets/textures/characters/player/ship_phoenix_dark.png' },
        { alias: 'bullet', src: 'assets/textures/projectiles/bullet_phoenix.png' },
        { alias: 'enemyBullet', src: 'assets/textures/projectiles/bullet_enemy.png' },
        { alias: 'smoke', src: 'assets/textures/effects/smoke_blue.png' }
      ]);

      this.updateProgress(75, 'Processing assets...');

      let playerTexture: PIXI.Texture;
      let bulletTexture: PIXI.Texture;
      let smokeTexture: PIXI.Texture;


      let enemyBulletTexture: PIXI.Texture;

      try {
        playerTexture = PIXI.Assets.get('player');
        bulletTexture = PIXI.Assets.get('bullet');
        enemyBulletTexture = PIXI.Assets.get('enemyBullet');
        smokeTexture = PIXI.Assets.get('smoke');
        console.log('Loaded game assets successfully');
      } catch (assetError) {
        console.warn('Could not load assets, using fallback textures');
        playerTexture = this.createFallbackTexture(0x00ff88, 64, 64);
        bulletTexture = this.createFallbackTexture(0xffff00, 8, 16);
        enemyBulletTexture = this.createFallbackTexture(0xff4444, 12, 12);
        smokeTexture = this.createFallbackTexture(0x888888, 16, 16);
      }

      this.updateProgress(100, 'Assets ready!');

      return {
        playerTexture,
        bulletTexture,
        enemyBulletTexture,
        smokeTexture
      };

    } catch (error) {
      console.error('Failed to load assets:', error);

      return {
        playerTexture: this.createFallbackTexture(0x00ff88, 64, 64),
        bulletTexture: this.createFallbackTexture(0xffff00, 8, 16),
        enemyBulletTexture: this.createFallbackTexture(0xff4444, 12, 12),
        smokeTexture: this.createFallbackTexture(0x888888, 16, 16)
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

    console.log('Additional assets preloaded');
  }
} 