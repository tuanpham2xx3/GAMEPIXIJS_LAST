import * as PIXI from 'pixi.js';
import { Player } from '../entities/Player';
import { InputManager } from '../managers/InputManager';
import { BulletManager } from '../managers/BulletManager';
import { EnemyManager } from '../managers/EnemyManager';
import { LevelManager } from '../managers/LevelManager';
import { CollisionManager } from '../managers/CollisionManager';
import { AnimationManager } from '../managers/AnimationManager';
import { EntityCategory, CollidableEntity } from '../types/EntityTypes';
import { BackgroundRenderer } from '../rendering/BackgroundRenderer';
import { UIRenderer, GameStats } from '../rendering/UIRenderer';
import { GameAssets } from './AssetLoader';

/**
 * Responsible for orchestrating the game loop and coordinating between managers
 * Single Responsibility: Game loop coordination
 */
export class GameOrchestrator {
  private app: PIXI.Application;
  private gameContainer: PIXI.Container;
  
  // Game entities and managers
  private player: Player | null = null;
  private inputManager: InputManager | null = null;
  private bulletManager: BulletManager | null = null;
  private enemyManager: EnemyManager | null = null;
  private levelManager: LevelManager | null = null;
  private collisionManager: CollisionManager | null = null;
  
  // Renderers
  private backgroundRenderer: BackgroundRenderer;
  private uiRenderer: UIRenderer;
  
  // Game state
  private score: number = 0;
  private isGameRunning: boolean = false;

  constructor(
    app: PIXI.Application,
    gameContainer: PIXI.Container,
    backgroundRenderer: BackgroundRenderer,
    uiRenderer: UIRenderer
  ) {
    this.app = app;
    this.gameContainer = gameContainer;
    this.backgroundRenderer = backgroundRenderer;
    this.uiRenderer = uiRenderer;
  }

  /**
   * Initialize all game managers and entities
   */
  public async initialize(assets: GameAssets): Promise<void> {
    try {
      console.log('🎮 Initializing game systems...');

      // Initialize managers
      this.inputManager = new InputManager(this.app.view as HTMLCanvasElement);
      this.bulletManager = new BulletManager(this.gameContainer, assets.bulletTexture);
      
      // Initialize AnimationManager with app
      const animationManager = AnimationManager.getInstance();
      animationManager.initWithApp(this.app);
      
      this.enemyManager = new EnemyManager(this.gameContainer);
      await this.enemyManager.initialize();

      // Initialize CollisionManager
      this.collisionManager = new CollisionManager();
      console.log('✅ CollisionManager initialized');

      // Initialize LevelManager
      this.levelManager = new LevelManager(this.enemyManager);
      await this.levelManager.initialize();
      console.log('✅ LevelManager initialized');

      // Create player
      this.player = new Player(assets.playerTexture, this.inputManager, this.bulletManager);
      this.gameContainer.addChild(this.player);

      console.log('✅ Game systems initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize game systems:', error);
      throw error;
    }
  }

  /**
   * Start the game
   */
  public startGame(): void {
    if (!this.isGameRunning) {
      this.isGameRunning = true;
      
      // Start game loop
      this.app.ticker.add(this.gameLoop.bind(this));
      
      // Start first level after a short delay
      setTimeout(() => {
        if (this.levelManager) {
          this.levelManager.startLevel(1);
        }
      }, 2000);

      console.log('🚀 Game started!');
    }
  }

  /**
   * Main game loop
   */
  private gameLoop(delta: number): void {
    if (!this.isGameRunning) return;

    const deltaTime = delta / 60; // Convert to seconds

    // Update background
    this.backgroundRenderer.update(deltaTime);

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
      
      // Check level completion
      if (this.levelManager.isLevelComplete()) {
        this.onLevelComplete();
      }
    }

    // Handle collisions
    this.handleCollisions().catch(error => {
      console.error('Error in collision handling:', error);
    });

    // Update UI
    this.updateUI();
  }

  /**
   * Handle collision detection
   */
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
    entityGroups.set(EntityCategory.BOSS, bosses as CollidableEntity[]);

    // Perform collision detection
    const collisionResults = this.collisionManager.checkAllCollisions(entityGroups);

    // Process collision results
    for (const result of collisionResults) {
      await this.processCollision(result);
    }
  }

  /**
   * Process individual collision result
   */
  private async processCollision(result: any): Promise<void> {
    const { entityA, entityB, damage } = result;

    // Handle player taking damage
    if (entityA.getCategory() === EntityCategory.PLAYER) {
      const isDestroyed = await (entityA as any).takeDamage(damage);
      if (isDestroyed) {
        console.log('💀 Player destroyed!');
        this.gameOver();
      }
    }

    // Handle enemy/boss taking damage
    if (entityB.getCategory() === EntityCategory.ENEMY || entityB.getCategory() === EntityCategory.BOSS) {
      const isDestroyed = await (entityB as any).takeDamage(damage);
      if (isDestroyed) {
        this.score += (entityB as any).getScoreValue ? (entityB as any).getScoreValue() : 100;
        console.log(`💥 Enemy destroyed! Score: ${this.score}`);
      }
    }

    // Deactivate entities that should be removed
    entityA.deactivate();
    if (entityB.getCategory() !== EntityCategory.PLAYER) {
      entityB.deactivate();
    }
  }

  /**
   * Update UI with current game state
   */
  private updateUI(): void {
    const stats = UIRenderer.collectGameStats(
      this.score,
      this.player,
      this.bulletManager,
      this.enemyManager,
      this.levelManager,
      this.collisionManager,
      this.inputManager
    );

    if (stats) {
      this.uiRenderer.updateGameStats(stats);
    }
  }

  /**
   * Handle level completion
   */
  private onLevelComplete(): void {
    console.log('🎉 Level completed!');
    
    // Advance to next level or complete game
    if (this.levelManager) {
      const currentLevel = this.levelManager.getCurrentLevel();
      const nextLevel = currentLevel + 1;
      
      if (nextLevel <= 3) { // Assuming 3 levels max
        this.levelManager.startLevel(nextLevel);
      } else {
        this.gameComplete();
      }
    }
  }

  /**
   * Handle game over
   */
  private gameOver(): void {
    this.isGameRunning = false;
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
    console.log('💀 Game Over! Final Score:', this.score);
  }

  /**
   * Handle game completion
   */
  private gameComplete(): void {
    this.isGameRunning = false;
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
    console.log('🏆 Congratulations! Game completed! Final Score:', this.score);
  }

  /**
   * Handle screen resize
   */
  public onResize(): void {
    // Propagate resize to components
    this.backgroundRenderer.onResize();
    this.uiRenderer.onResize();
  }

  /**
   * Cleanup and destroy
   */
  public destroy(): void {
    this.isGameRunning = false;

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
    if (this.player) {
      this.player.destroy();
    }

    console.log('🧹 Game orchestrator cleaned up');
  }
} 