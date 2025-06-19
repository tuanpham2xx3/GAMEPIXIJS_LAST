import * as PIXI from 'pixi.js';
import { Player } from '../entities/Player';
import { InputManager } from '../managers/InputManager';
import { BulletManager } from '../managers/BulletManager';
import { EnemyManager } from '../managers/spawn/EnemyManager';
import { LevelManager } from '../managers/spawn/LevelManager';
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
      console.log('Initializing game systems...');


      this.inputManager = new InputManager(this.app.view as HTMLCanvasElement);
      this.bulletManager = new BulletManager(this.gameContainer, assets.bulletTexture);
      

      const animationManager = AnimationManager.getInstance();
      animationManager.initWithApp(this.app);
      
      this.enemyManager = new EnemyManager(this.gameContainer);
      await this.enemyManager.initialize();


      this.collisionManager = new CollisionManager();
      console.log('CollisionManager initialized');


      this.levelManager = new LevelManager(this.enemyManager);
      await this.levelManager.initialize();
      console.log('LevelManager initialized');


      this.player = new Player(assets.playerTexture, this.inputManager, this.bulletManager, assets.smokeTexture);
      this.player.addToParent(this.gameContainer);

      console.log('Game systems initialized successfully');

    } catch (error) {
      console.error('Failed to initialize game systems:', error);
      throw error;
    }
  }

  /**
   * Start the game
   */
  public startGame(): void {
    if (!this.isGameRunning) {
      this.isGameRunning = true;

      this.app.ticker.add(this.gameLoop.bind(this));

      setTimeout(() => {
        if (this.levelManager) {
          this.levelManager.startLevel(1);
        }
      }, 2000);

      console.log('Game started!');
    }
  }

  /**
   * Main game loop
   */
  private gameLoop(delta: number): void {
    if (!this.isGameRunning) return;

    const deltaTime = delta / 60;


    this.backgroundRenderer.update(deltaTime);


    if (this.player) {
      this.player.update(deltaTime);
    }


    if (this.bulletManager) {
      this.bulletManager.update(deltaTime);
    }


    if (this.enemyManager) {
      this.enemyManager.update(deltaTime);
    }


    if (this.levelManager) {
      this.levelManager.update(deltaTime);

      if (this.levelManager.isLevelComplete()) {
        this.onLevelComplete();
      }
    }


    this.handleCollisions().catch(error => {
      console.error('Error in collision handling:', error);
    });


    this.updateUI();
  }

  /**
   * Handle collision detection
   */
  private async handleCollisions(): Promise<void> {
    if (!this.collisionManager || !this.enemyManager || !this.bulletManager || !this.player) return;


    const entityGroups = new Map<EntityCategory, CollidableEntity[]>();
    
    // Add player
    entityGroups.set(EntityCategory.PLAYER, [this.player as CollidableEntity]);

    const activeBullets = this.bulletManager.getActiveBullets();
    entityGroups.set(EntityCategory.PLAYER_BULLET, activeBullets as CollidableEntity[]);

    const activeEnemies = this.enemyManager.getActiveEnemies();
    const regularEnemies = activeEnemies.filter(enemy => enemy.getEnemyType() !== 'boss');
    const bosses = activeEnemies.filter(enemy => enemy.getEnemyType() === 'boss');
    
    entityGroups.set(EntityCategory.ENEMY, regularEnemies as CollidableEntity[]);
    entityGroups.set(EntityCategory.BOSS, bosses as CollidableEntity[]);


    const collisionResults = this.collisionManager.checkAllCollisions(entityGroups);


    for (const result of collisionResults) {
      await this.processCollision(result);
    }
  }

  /**
   * Process individual collision result
   */
  private async processCollision(result: any): Promise<void> {
    const { entityA, entityB, damage } = result;


    if (entityA.getCategory() === EntityCategory.PLAYER) {
      const isDestroyed = await (entityA as any).takeDamage(damage);
      if (isDestroyed) {
        console.log('Player destroyed!');
        this.gameOver();
      }
    }


    if (entityB.getCategory() === EntityCategory.ENEMY || entityB.getCategory() === EntityCategory.BOSS) {
      const isDestroyed = await (entityB as any).takeDamage(damage);
      if (isDestroyed) {
        this.score += (entityB as any).getScoreValue ? (entityB as any).getScoreValue() : 100;
        console.log(`Enemy destroyed! Score: ${this.score}`);
      }
    }


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
    console.log('Level completed!');

    if (this.levelManager) {
      const currentLevel = this.levelManager.getCurrentLevel();
      const nextLevel = currentLevel + 1;
      
      if (nextLevel <= 3) {
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
    console.log('Game Over! Final Score:', this.score);
  }

  /**
   * Handle game completion
   */
  private gameComplete(): void {
    this.isGameRunning = false;
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
    console.log('Congratulations! Game completed! Final Score:', this.score);
  }

  /**
   * Handle screen resize
   */
  public onResize(): void {

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

    console.log('Game orchestrator cleaned up');
  }
} 