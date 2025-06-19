import * as PIXI from 'pixi.js';
import { Player } from './entities/Player';
import { InputManager } from './managers/InputManager';
import { BulletManager } from './managers/BulletManager';
import { EnemyManager } from './managers/EnemyManager';
import { SimpleLevelManager } from './managers/SimpleLevelManager';
import { CollisionManager } from './managers/CollisionManager';
import { AnimationManager } from './managers/AnimationManager';
import { GameConfig, updateScreenSize, scalePosition } from './core/Config';
import { EntityCategory, CollidableEntity } from './types/EntityTypes';

class Game {
  private app: PIXI.Application;
  private player: Player | null = null;
  private inputManager: InputManager | null = null;
  private bulletManager: BulletManager | null = null;
  private enemyManager: EnemyManager | null = null;
  private levelManager: SimpleLevelManager | null = null;
  private collisionManager: CollisionManager | null = null;
  private gameContainer: PIXI.Container;
  private backgroundContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  private score: number = 0;

  private scrollingBackground: PIXI.TilingSprite | null = null;
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
      console.log('Starting game...');
      
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
      
      console.log('Game started successfully!');
      
    } catch (error) {
      console.error('Failed to start game:', error);
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

      console.log(`Attempting to load background from: ${GameConfig.background.src}`);
      
      // Try to load the background image
      this.backgroundTexture = await PIXI.Assets.load(GameConfig.background.src);
      console.log('Loaded background image successfully');
      if (this.backgroundTexture) {
        console.log(`Background dimensions: ${this.backgroundTexture.width}x${this.backgroundTexture.height}`);
      }
      
      // Create scrolling background
      this.createScrollingBackground();
      
    } catch (error) {
      console.warn('Could not load bg.jpg from assets/background/, creating fallback starfield');
      console.error('Background load error:', error);
      this.createFallbackBackground();
    }
  }

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
    if (this.scrollingBackground) {
      this.scrollingBackground.width = GameConfig.screen.width;
      this.scrollingBackground.height = GameConfig.screen.height + (this.backgroundTexture?.height || 0);
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
        console.log('Loaded game assets');
      } catch (assetError) {
        console.warn('Could not load assets, using fallback textures');
        playerTexture = this.createColorTexture(0x00ff88, 64, 64); // Green player
        bulletTexture = this.createColorTexture(0xffff00, 8, 16);  // Yellow bullets
      }

      // Initialize managers
      this.inputManager = new InputManager(this.app.view as HTMLCanvasElement);
      this.bulletManager = new BulletManager(this.gameContainer, bulletTexture);
      
      // Initialize AnimationManager with app
      const animationManager = (await import('./managers/AnimationManager')).AnimationManager.getInstance();
      animationManager.initWithApp(this.app);
      
      this.enemyManager = new EnemyManager(this.gameContainer);
      await this.enemyManager.initialize();

      // Initialize CollisionManager
      this.collisionManager = new CollisionManager();
      console.log('CollisionManager initialized');

                    // Initialize SimpleLevelManager
      this.levelManager = new SimpleLevelManager(this.enemyManager);
      console.log('SimpleLevelManager initialized');

      // Create player
      this.player = new Player(playerTexture, this.inputManager, this.bulletManager);
      this.gameContainer.addChild(this.player);

      // Start first level after a short delay
      setTimeout(() => {
        if (this.levelManager) {
          this.levelManager.startLevel(1);
        }
      }, 2000);

    } catch (error) {
      console.error('Failed to load assets:', error);
      // Fallback
      const playerTexture = this.createColorTexture(0x00ff88, 64, 64);
      const bulletTexture = this.createColorTexture(0xffff00, 8, 16);
      
      this.inputManager = new InputManager(this.app.view as HTMLCanvasElement);
      this.bulletManager = new BulletManager(this.gameContainer, bulletTexture);
      
      // Initialize AnimationManager with app
      const animationManager = (await import('./managers/AnimationManager')).AnimationManager.getInstance();
      animationManager.initWithApp(this.app);
      
      this.enemyManager = new EnemyManager(this.gameContainer);
      await this.enemyManager.initialize();
      this.levelManager = new SimpleLevelManager(this.enemyManager);
      this.player = new Player(playerTexture, this.inputManager, this.bulletManager);
      this.gameContainer.addChild(this.player);

      // Start first level after a short delay
      setTimeout(() => {
        if (this.levelManager) {
          this.levelManager.startLevel(1);
        }
      }, 2000);

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

    // Update enemy manager
    if (this.enemyManager) {
      this.enemyManager.update(deltaTime);
    }

    // Update level manager
    if (this.levelManager) {
      this.levelManager.update(deltaTime);
      
      // Check level completion using simple polling instead of callbacks
      if (this.levelManager.isLevelComplete()) {
        this.onLevelComplete();
      }
    }

    // Handle collisions (async for explosion animations)
    this.handleCollisions().catch(error => {
      console.error('Error in collision handling:', error);
    });

    // Update UI with game stats
    this.updateGameStats();
  }

  private updateScrollingBackground(deltaTime: number): void {
    if (!this.scrollingBackground) return;

    const scrollSpeed = GameConfig.background.scrollSpeed;
    this.scrollingBackground.tilePosition.y += scrollSpeed * deltaTime;
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

    const enemyStats = this.enemyManager?.getPoolStats() || {};
    const activeEnemyCount = this.enemyManager?.getActiveEnemyCount() || 0;
    const currentLevel = this.levelManager?.getCurrentLevel() || 0;
    const levelProgress = this.levelManager?.getLevelElapsedTime() || 0;
    const remainingTime = 0; // Not available in formation system
    const isBossLevel = false; // Use formation name instead
    const waveProgress = this.levelManager?.getWaveProgress() || 'Wave 0/0';
    const collisionStats = this.collisionManager?.getCollisionStats() || { totalChecks: 0, totalRules: 0 };

    const statsText = new PIXI.Text(
      `Score: ${this.score}\n` +
      `Level: ${currentLevel}${isBossLevel ? ' (BOSS)' : ''}\n` +
      `Wave: ${waveProgress}\n` +
      `Time: ${Math.round(levelProgress)}s\n` +
      `Health: ${playerState.health}/${this.player.getMaxHealth()}\n` +
      `Active Enemies: ${activeEnemyCount}\n` +
      `Active Bullets: ${bulletStats.active}\n` +
      `Collision Checks: ${collisionStats.totalChecks}\n` +
      `Position: (${Math.round(playerPos.x)}, ${Math.round(playerPos.y)})\n` +
      `Status: ${playerState.isMoving ? 'Moving & Shooting' : 'Idle'}`,
      style
    );

    statsText.x = 10;

    statsText.y = GameConfig.screen.height - 150;

    statsText.name = 'gameStats';
    this.uiContainer.addChild(statsText);
  }

  private async handleCollisions(): Promise<void> {
    if (!this.collisionManager || !this.enemyManager || !this.bulletManager || !this.player) return;

    // Prepare entity groups for collision detection
    const entityGroups = new Map<EntityCategory, CollidableEntity[]>();
    
    // Add player
    entityGroups.set(EntityCategory.PLAYER, [this.player as CollidableEntity]);
    
    // Add player bullets
    const activeBullets = this.bulletManager.getActiveBullets();
    entityGroups.set(EntityCategory.PLAYER_BULLET, activeBullets as CollidableEntity[]);
    
    // Add enemies
    const activeEnemies = this.enemyManager.getActiveEnemies();
    const regularEnemies = activeEnemies.filter(enemy => enemy.getEnemyType() !== 'boss');
    const bosses = activeEnemies.filter(enemy => enemy.getEnemyType() === 'boss');
    
    entityGroups.set(EntityCategory.ENEMY, regularEnemies as CollidableEntity[]);
    if (bosses.length > 0) {
      entityGroups.set(EntityCategory.BOSS, bosses as CollidableEntity[]);
    }

    // Check all collisions
    const collisions = this.collisionManager.checkAllCollisions(entityGroups);
    
    // Process collision results
    for (const collision of collisions) {
      console.log('Processing collision:', collision);
      
      let entityADestroyed = false;
      let entityBDestroyed = false;
      
      // Handle damage (now with async support for explosions)
      if (collision.damageToA && collision.entityA.takeDamage) {
        entityADestroyed = await collision.entityA.takeDamage(collision.damageToA);
        if (entityADestroyed || collision.entityA.getHealth?.() <= 0) {
          if (collision.categoryA === EntityCategory.PLAYER) {
            console.log('Game Over!');
            this.gameOver();
          }
        }
      }
      
      if (collision.damageToB && collision.entityB.takeDamage) {
        entityBDestroyed = await collision.entityB.takeDamage(collision.damageToB);
        if (entityBDestroyed || collision.entityB.getHealth?.() <= 0) {
          if (collision.categoryB === EntityCategory.PLAYER) {
            console.log('Game Over!');
            this.gameOver();
          }
        }
      }
      
      // Handle score - only award if enemy was actually destroyed
      if (collision.score && collision.score > 0) {
        let shouldAwardScore = false;
        
        if (collision.categoryB === EntityCategory.ENEMY || collision.categoryB === EntityCategory.BOSS) {
          shouldAwardScore = entityBDestroyed;
        } else if (collision.categoryA === EntityCategory.ENEMY || collision.categoryA === EntityCategory.BOSS) {
          shouldAwardScore = entityADestroyed;
        }
        
        if (shouldAwardScore) {
          this.score += collision.score;
          console.log(`Enemy destroyed! Score: +${collision.score}, Total: ${this.score}`);
        }
      }
      
      // Handle entity deactivation
      if (collision.shouldDeactivateA && collision.entityA.deactivate) {
        console.log('Deactivating entityA:', collision.entityA);
        collision.entityA.deactivate();
      }
      if ((collision.shouldDeactivateB || entityBDestroyed) && collision.entityB.deactivate) {
        console.log('Deactivating entityB:', collision.entityB);
        collision.entityB.deactivate();
      }
      
      // Handle entity destruction
      if ((collision.shouldDestroyA || entityADestroyed) && collision.entityA.destroy) {
        console.log('Destroying entityA:', collision.entityA);
        collision.entityA.destroy();
      }
      if ((collision.shouldDestroyB || entityBDestroyed) && collision.entityB.destroy) {
        console.log('Destroying entityB:', collision.entityB);
        collision.entityB.destroy();
      }
    }
  }

  private onLevelComplete(): void {
    console.log(`Level ${this.levelManager?.getCurrentLevel()} completed!`);
    
    // Try to start next level
    if (this.levelManager?.nextLevel()) {
      console.log(`Starting level ${this.levelManager.getCurrentLevel()}`);
    } else {
      console.log('All levels completed! Game finished!');
      this.gameComplete();
    }
  }

  private gameOver(): void {
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
    console.log('Game Over! Final Score:', this.score);
  }

  private gameComplete(): void {
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
    console.log('Congratulations! Game completed! Final Score:', this.score);
  }

  public destroy(): void {
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    if (this.bulletManager) {
      this.bulletManager.destroy();
    }
    if (this.enemyManager) {
      this.enemyManager.destroy();
    }
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
    if (this.collisionManager) {
      // CollisionManager doesn't need explicit cleanup
      this.collisionManager = null;
    }
    if (this.player) {
      this.player.destroy();
    }
    this.app.destroy(true);
  }
}

// Start the game when page loads
window.onload = () => {

  console.log('Starting Space Shooter Game...');
  const game = new Game();
  
  // Debug commands for testing formations
  if (GameConfig.debug) {
    (window as any).gameDebug = {
      testFormation: (id: string) => {
        if (game['levelManager']) {
          game['levelManager'].testFormation(id);
        }
      },
      listFormations: () => {
        if (game['levelManager']) {
          const formations = game['levelManager'].getAvailableFormations();
          console.log('Available formations:', formations);
          return formations;
        }
      },
      getInfo: () => {
        if (game['levelManager']) {
          return {
            currentLevel: game['levelManager'].getCurrentLevel(),
            waveProgress: game['levelManager'].getWaveProgress(),
            usingFormations: game['levelManager'].isUsingFormations(),
            isActive: game['levelManager'].isActive()
          };
        }
      },
      restartLevel: () => {
        if (game['levelManager']) {
          game['levelManager'].restartCurrentLevel();
        }
      },
      forceComplete: () => {
        if (game['levelManager']) {
          game['levelManager'].forceCompleteLevel();
        }
      },
      getStatus: () => {
        if (game['levelManager']) {
          const status = game['levelManager'].getDebugStatus();
          console.log('🔍 Game Status:', status);
          return status;
        }
      },
      // Scaling debug commands
      getScaleInfo: () => {
        console.log('Screen Resolution:', GameConfig.screen);
        console.log('Reference Resolution:', GameConfig.referenceResolution);
        console.log('Scale Factors:', GameConfig.scale);
        return {
          screen: GameConfig.screen,
          reference: GameConfig.referenceResolution,
          scale: GameConfig.scale
        };
      },
      testScaling: () => {
        console.log('Testing scaling system...');
        const testPositions = [
          { x: 100, y: -50, name: 'Left edge' },
          { x: 400, y: -50, name: 'Center' },
          { x: 700, y: -50, name: 'Right edge' }
        ];
        
        testPositions.forEach(pos => {
          const scaled = scalePosition(pos.x, pos.y);
          console.log(`${pos.name}: ref(${pos.x}, ${pos.y}) -> screen(${scaled.x.toFixed(1)}, ${scaled.y.toFixed(1)})`);
        });
      }
    };
    
    console.log('🎮 Debug commands available:');
    console.log('gameDebug.testFormation("wave_1")');
    console.log('gameDebug.listFormations()');
    console.log('gameDebug.getInfo()');
    console.log('gameDebug.restartLevel()');
    console.log('gameDebug.forceComplete() - Force complete current level');
    console.log('gameDebug.getStatus() - Get detailed game status');
  }
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    game.destroy();
  });
}; 