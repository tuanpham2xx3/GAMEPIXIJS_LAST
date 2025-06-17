import * as PIXI from 'pixi.js';
import { Player } from './entities/Player';
import { InputManager } from './managers/InputManager';
import { BulletManager } from './managers/BulletManager';
import { GameConfig, updateScreenSize } from './core/Config';

class Game {
  private app: PIXI.Application;
  private player: Player | null = null;
  private inputManager: InputManager | null = null;
  private bulletManager: BulletManager | null = null;
  private gameContainer: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private scrollingBackgrounds: PIXI.Sprite[] = [];
  private backgroundTexture: PIXI.Texture | null = null;

  constructor() {
    // Update screen size
    updateScreenSize();
    
    // Create PIXI application with fullscreen
    this.app = new PIXI.Application({
      width: GameConfig.screen.width,
      height: GameConfig.screen.height,
      backgroundColor: 0x000000, // Black background
      antialias: true,
      resizeTo: window, // Auto-resize to window
    });

    // Add to DOM
    document.body.appendChild(this.app.view as HTMLCanvasElement);

    // Create containers for layering
    this.backgroundContainer = new PIXI.Container();
    this.gameContainer = new PIXI.Container();
    this.uiContainer = new PIXI.Container();

    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.gameContainer);
    this.app.stage.addChild(this.uiContainer);

    // Handle window resize
    this.setupResizeHandler();

    // Initialize game
    this.init();
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      updateScreenSize();
      this.app.renderer.resize(GameConfig.screen.width, GameConfig.screen.height);
      this.updateBackgroundSize();
      this.updatePlayerBoundaries();
    });
  }

  private async init(): Promise<void> {
    try {
      console.log('🚀 Starting game...');
      
      // Update loading progress
      this.updateLoadingProgress(25, 'Creating background...');
      
      // Create background
      await this.createBackground();
      
      // Update loading progress
      this.updateLoadingProgress(50, 'Loading assets...');
      
      // Load assets and create game objects
      await this.loadAssets();
      
      // Update loading progress
      this.updateLoadingProgress(75, 'Initializing game...');
      
      // Start game loop
      this.app.ticker.add(this.gameLoop.bind(this));
      
      // Create UI
      this.createUI();
      
      // Update loading progress
      this.updateLoadingProgress(100, 'Ready!');
      
      // Hide loading screen after a short delay
      setTimeout(() => {
        this.hideLoadingScreen();
      }, 500);
      
      console.log('✅ Game started successfully!');
      
    } catch (error) {
      console.error('❌ Failed to start game:', error);
      this.hideLoadingScreen();
    }
  }

  private updateLoadingProgress(percentage: number, text: string): void {
    const progressBar = document.getElementById('progress');
    const loadingText = document.querySelector('.loading-text');
    
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  private async createBackground(): Promise<void> {
    try {
      console.log(`🔍 Attempting to load background from: ${GameConfig.background.src}`);
      
      // Try to load the background image
      this.backgroundTexture = await PIXI.Assets.load(GameConfig.background.src);
      console.log('✅ Loaded background image successfully');
      if (this.backgroundTexture) {
        console.log(`📐 Background dimensions: ${this.backgroundTexture.width}x${this.backgroundTexture.height}`);
      }
      
      // Create scrolling background sprites
      this.createScrollingBackground();
      
    } catch (error) {
      console.warn('⚠️ Could not load bg.jpg from assets/background/, creating fallback starfield');
      console.error('Background load error:', error);
      this.createFallbackBackground();
    }
  }

  private createScrollingBackground(): void {
    if (!this.backgroundTexture) return;

    // Calculate how many background images we need to cover the screen height + one extra for seamless scrolling
    const bgHeight = this.backgroundTexture.height;
    const screenHeight = GameConfig.screen.height;
    const numBackgrounds = Math.ceil(screenHeight / bgHeight) + 1;

    // Create background sprites
    for (let i = 0; i < numBackgrounds; i++) {
      const bg = new PIXI.Sprite(this.backgroundTexture);
      
      // Scale to fit screen width
      bg.width = GameConfig.screen.width;
      bg.height = bgHeight;
      
      // Position vertically
      bg.y = i * bgHeight;
      
      this.scrollingBackgrounds.push(bg);
      this.backgroundContainer.addChild(bg);
    }
  }

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

  private updateBackgroundSize(): void {
    if (this.scrollingBackgrounds.length > 0) {
      // Update background sprites for new screen size
      for (const bg of this.scrollingBackgrounds) {
        bg.width = GameConfig.screen.width;
      }
    }
  }

  private updatePlayerBoundaries(): void {
    // Player boundaries will be updated automatically via getBoundaries() function
    // which uses the current GameConfig.screen values
  }

  private async loadAssets(): Promise<void> {
    try {
      // Load player and bullet assets
      await PIXI.Assets.load([
        { alias: 'player', src: 'assets/textures/characters/player/ship_phoenix_dark.png' },
        { alias: 'bullet', src: 'assets/textures/projectiles/bullet_phoenix.png' }
      ]);

      let playerTexture: PIXI.Texture;
      let bulletTexture: PIXI.Texture;

      // Try to get real textures, fallback to colored rectangles
      try {
        playerTexture = PIXI.Assets.get('player');
        bulletTexture = PIXI.Assets.get('bullet');
        console.log('✅ Loaded game assets');
      } catch (assetError) {
        console.warn('⚠️ Could not load assets, using fallback textures');
        playerTexture = this.createColorTexture(0x00ff88, 64, 64); // Green player
        bulletTexture = this.createColorTexture(0xffff00, 8, 16);  // Yellow bullets
      }

      // Initialize managers
      this.inputManager = new InputManager(this.app.view as HTMLCanvasElement);
      this.bulletManager = new BulletManager(this.gameContainer, bulletTexture);

      // Create player
      this.player = new Player(playerTexture, this.inputManager, this.bulletManager);
      this.gameContainer.addChild(this.player);

    } catch (error) {
      console.error('Failed to load assets:', error);
      // Fallback
      const playerTexture = this.createColorTexture(0x00ff88, 64, 64);
      const bulletTexture = this.createColorTexture(0xffff00, 8, 16);
      
      this.inputManager = new InputManager(this.app.view as HTMLCanvasElement);
      this.bulletManager = new BulletManager(this.gameContainer, bulletTexture);
      this.player = new Player(playerTexture, this.inputManager, this.bulletManager);
      this.gameContainer.addChild(this.player);
    }
  }

  private createColorTexture(color: number, width: number, height: number): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, width, height);
    graphics.endFill();
    
    return this.app.renderer.generateTexture(graphics);
  }

  private createUI(): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2,
    });

    const gameTitle = new PIXI.Text('SPACE SHOOTER', style);
    gameTitle.anchor.set(0.5, 0);
    gameTitle.x = GameConfig.screen.width / 2;
    gameTitle.y = 20;
    this.uiContainer.addChild(gameTitle);

    // Controls info
    const controlStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xcccccc,
      stroke: 0x000000,
      strokeThickness: 1,
    });

    const controls = new PIXI.Text(
      'Hold and drag mouse/finger to move player relative to gesture\nAuto-shooting when moving',
      controlStyle
    );
    controls.anchor.set(0.5, 0);
    controls.x = GameConfig.screen.width / 2;
    controls.y = 50;
    this.uiContainer.addChild(controls);
  }

  private gameLoop(delta: number): void {
    const deltaTime = delta / 60; // Convert to seconds

    // Update scrolling background
    this.updateScrollingBackground(deltaTime);

    // Update player
    if (this.player) {
      this.player.update(deltaTime);
    }

    // Update bullet manager
    if (this.bulletManager) {
      this.bulletManager.update(deltaTime);
    }

    // Update UI with game stats
    this.updateGameStats();
  }

  private updateScrollingBackground(deltaTime: number): void {
    if (this.scrollingBackgrounds.length === 0) return;

    const scrollSpeed = GameConfig.background.scrollSpeed;
    
    for (const bg of this.scrollingBackgrounds) {
      // Move background down
      bg.y += scrollSpeed * deltaTime;
      
      // Reset position when background goes off screen
      const bgHeight = bg.height;
      if (bg.y >= GameConfig.screen.height) {
        // Find the topmost background
        let minY = Math.min(...this.scrollingBackgrounds.map(b => b.y));
        bg.y = minY - bgHeight;
      }
    }
  }

  private updateGameStats(): void {
    // Remove previous stats
    const existingStats = this.uiContainer.getChildByName('gameStats');
    if (existingStats) {
      this.uiContainer.removeChild(existingStats);
    }

    if (!this.player || !this.bulletManager) return;

    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x88ff88,
      stroke: 0x000000,
      strokeThickness: 1,
    });

    const playerPos = this.player.getPosition();
    const playerState = this.player.getState();
    const bulletStats = this.bulletManager.getPoolStats();
    const inputState = this.inputManager?.getInputState();
    const frameMovement = this.inputManager?.getFrameMovement();

    const statsText = new PIXI.Text(
      `Health: ${playerState.health}/${this.player.getMaxHealth()}\n` +
      `Position: (${Math.round(playerPos.x)}, ${Math.round(playerPos.y)})\n` +
      `Active Bullets: ${bulletStats.active}\n` +
      `Status: ${playerState.isMoving ? 'Moving & Shooting' : 'Idle'}\n` +
      `Input: ${inputState?.isPointerDown ? 'Holding' : 'Released'}\n` +
      `Frame Movement: (${frameMovement ? Math.round(frameMovement.x) : 0}, ${frameMovement ? Math.round(frameMovement.y) : 0})`,
      style
    );

    statsText.x = 10;
    statsText.y = GameConfig.screen.height - 80;
    statsText.name = 'gameStats';
    this.uiContainer.addChild(statsText);
  }

  public destroy(): void {
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    if (this.bulletManager) {
      this.bulletManager.destroy();
    }
    if (this.player) {
      this.player.destroy();
    }
    this.app.destroy(true);
  }
}

// Start the game when page loads
window.onload = () => {
  console.log('🚀 Starting Space Shooter Game...');
  const game = new Game();
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    game.destroy();
  });
}; 