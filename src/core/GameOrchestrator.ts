import * as PIXI from 'pixi.js';
import { Player } from '../entities/Player';
import { InputManager } from '../managers/InputManager';
import { BulletManager } from '../managers/BulletManager';
import { EnemyBulletManager } from '../managers/EnemyBulletManager';
import { EnemyManager } from '../managers/spawn/EnemyManager';
import { LevelManager } from '../managers/spawn/LevelManager';
import { CollisionManager } from '../managers/CollisionManager';
import { AnimationManager } from '../managers/animations/AnimationManager';
import { ItemManager } from '../managers/ItemManager';
import { EntityCategory, CollidableEntity } from '../types/EntityTypes';
import { BackgroundRenderer } from '../rendering/BackgroundRenderer';
import { UIRenderer, GameStats } from '../rendering/UIRenderer';
import { GameAssets } from './AssetLoader';
import { GameStateManager } from '../managers/GameStateManager';
import { GameState } from '../types/GameStateTypes';
import { UniversalMenu } from '../ui/UniversalMenu';
import { MenuConfigs } from '../ui/MenuConfigs';
import { GameConfig } from './Config';

export class GameOrchestrator {
  private app: PIXI.Application;
  private gameContainer: PIXI.Container;
  private uiContainer: PIXI.Container;
  
  private player: Player | null = null;
  private inputManager: InputManager | null = null;
  private bulletManager: BulletManager | null = null;
  private enemyBulletManager: EnemyBulletManager | null = null;
  private enemyManager: EnemyManager | null = null;
  private levelManager: LevelManager | null = null;
  private collisionManager: CollisionManager | null = null;
  private itemManager: ItemManager | null = null;
  
  private backgroundRenderer: BackgroundRenderer;
  private uiRenderer: UIRenderer;
  
  private gameStateManager: GameStateManager;
  private universalMenu: UniversalMenu;
  
  private score: number = 0;
  private coins: number = 0;

  constructor(
    app: PIXI.Application,
    gameContainer: PIXI.Container,
    uiContainer: PIXI.Container,
    backgroundRenderer: BackgroundRenderer,
    uiRenderer: UIRenderer
  ) {
    this.app = app;
    this.gameContainer = gameContainer;
    this.uiContainer = uiContainer;
    this.backgroundRenderer = backgroundRenderer;
    this.uiRenderer = uiRenderer;
    
    this.gameStateManager = GameStateManager.getInstance();
    this.universalMenu = new UniversalMenu();
    this.uiContainer.addChild(this.universalMenu);
    
    MenuConfigs.initialize(this.gameStateManager, this.universalMenu, this);
    this.setupStateListeners();
    this.setupKeyboardListeners();
  }

  private setupStateListeners(): void {
    this.gameStateManager.onStateChange(GameState.MENU, () => {
      this.showMainMenu();
    });

    this.gameStateManager.onStateChange(GameState.PLAYING, () => {
      this.hideMenu();
      this.startGameplay();
    });

    this.gameStateManager.onStateChange(GameState.PAUSED, () => {
      this.showPauseMenu();
    });

    this.gameStateManager.onStateChange(GameState.GAME_OVER, () => {
      this.handleGameOver();
    });
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (event) => {
      if (this.universalMenu.isShowing()) {
        if (this.universalMenu.handleInput(event.key)) {
          event.preventDefault();
        }
      } else if (this.gameStateManager.getCurrentState() === GameState.PLAYING) {
        if (event.key === 'Escape') {
          this.gameStateManager.pause();
          event.preventDefault();
        }
      }
    });
  }

  private showMainMenu(): void {
    const config = MenuConfigs.getMainMenuConfig();
    this.universalMenu.configure(config);
    this.universalMenu.show();
  }

  private showPauseMenu(): void {
    const config = MenuConfigs.getPauseMenuConfig();
    this.universalMenu.configure(config);
    this.universalMenu.show();
  }

  private hideMenu(): void {
    this.universalMenu.hide();
  }

  private startGameplay(): void {
    this.cleanupGameEntities();
    this.resetGameState();
    
    if (this.levelManager) {
      this.levelManager.startLevel(1);
    }
  }

  private cleanupGameEntities(): void {
    if (this.bulletManager) {
      this.bulletManager.destroyAllBullets();
    }
    
    if (this.enemyBulletManager) {
      this.enemyBulletManager.destroyAllBullets();
    }
    
    if (this.enemyManager) {
      this.enemyManager.clearAllEnemies();
    }
    
    if (this.itemManager) {
      this.itemManager.reset();
    }
    
    if (this.player) {
      this.player.heal(this.player.getMaxHealth());
      this.player.x = this.app.screen.width / 2;
      this.player.y = this.app.screen.height - 100;
      this.player.isActive = true;
      this.player.resetBulletLevel();
    }
  }

  private resetGameState(): void {
    this.score = 0;
    this.coins = 0;
    
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
  }

  private handleGameOver(): void {
    console.log('Game Over! Final Score:', this.score);
    setTimeout(() => {
      this.gameStateManager.changeState(GameState.MENU);
    }, 2000);
  }

  public async initialize(assets: GameAssets): Promise<void> {
    try {
      console.log('Initializing game systems...');

      this.inputManager = new InputManager(this.app.view as HTMLCanvasElement);
      this.bulletManager = new BulletManager(this.gameContainer, assets.bulletTexture);
      this.enemyBulletManager = new EnemyBulletManager(this.gameContainer, assets.enemyBulletTexture);
      
      const animationManager = AnimationManager.getInstance();
      animationManager.initWithApp(this.app);
      
      this.enemyManager = new EnemyManager(this.gameContainer);
      await this.enemyManager.initialize();

      // Initialize ItemManager
      this.itemManager = ItemManager.getInstance();
      await this.itemManager.initialize(this.gameContainer);
      console.log('ItemManager initialized');

      this.collisionManager = new CollisionManager();
      console.log('CollisionManager initialized');

      this.levelManager = new LevelManager(this.enemyManager);
      await this.levelManager.initialize();
      console.log('LevelManager initialized');

      this.player = new Player(assets.playerTexture, this.inputManager, this.bulletManager, assets.smokeTexture);
      this.player.addToParent(this.gameContainer);

      // Setup enemies với enemy bullet manager
      if (this.enemyManager && this.enemyBulletManager) {
        this.enemyManager.setEnemyBulletManager(this.enemyBulletManager);
        console.log('🔫 Enemy bullet manager setup complete');
      }

      console.log('Game systems initialized successfully');

    } catch (error) {
      console.error('Failed to initialize game systems:', error);
      throw error;
    }
  }

  public startGame(): void {
    this.app.ticker.add(this.gameLoop.bind(this));
    console.log('Game started!');
  }

  public restartGame(): void {
    this.gameStateManager.resetSession();
    this.gameStateManager.changeState(GameState.PLAYING);
  }

  private gameLoop(delta: number): void {
    if (!this.gameStateManager.isPlaying()) return;

    const deltaTime = delta / 60;

    this.backgroundRenderer.update(deltaTime);

    if (this.player) {
      this.player.update(deltaTime);
    }

    if (this.bulletManager) {
      this.bulletManager.update(deltaTime);
    }

    // Update enemy bullet manager
    if (this.enemyBulletManager) {
      this.enemyBulletManager.update(deltaTime);
    }

    if (this.enemyManager) {
      this.enemyManager.update(deltaTime);
      
      // Update player position cho enemies để bắn
      if (this.player) {
        this.enemyManager.setPlayerPosition(this.player.getPosition());
      }
    }

    // Update ItemManager
    if (this.itemManager && this.player) {
      this.itemManager.setPlayerPosition(this.player.getPosition());
      this.itemManager.update(deltaTime);
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

    // Add player bullets
    const activeBullets = this.bulletManager.getActiveBullets();
    entityGroups.set(EntityCategory.PLAYER_BULLET, activeBullets as CollidableEntity[]);

    // Add enemy bullets
    if (this.enemyBulletManager) {
      const activeEnemyBullets = this.enemyBulletManager.getActiveBullets();
      entityGroups.set(EntityCategory.ENEMY_BULLET, activeEnemyBullets as CollidableEntity[]);
    }

    // Add enemies
    const activeEnemies = this.enemyManager.getActiveEnemies();
    const regularEnemies = activeEnemies.filter(enemy => enemy.getEnemyType() !== 'boss');
    const bosses = activeEnemies.filter(enemy => enemy.getEnemyType() === 'boss');
    
    entityGroups.set(EntityCategory.ENEMY, regularEnemies as CollidableEntity[]);
    entityGroups.set(EntityCategory.BOSS, bosses as CollidableEntity[]);

    // Add items
    if (this.itemManager) {
      const activeItems = this.itemManager.getActiveItems();
      entityGroups.set(EntityCategory.ITEM, activeItems as CollidableEntity[]);
    }

    const collisionResults = this.collisionManager.checkAllCollisions(entityGroups);

    for (const result of collisionResults) {
      await this.processCollision(result);
    }
  }

  /**
   * Process individual collision result
   */
  private async processCollision(result: any): Promise<void> {
    const { entityA, entityB, damageToA, damageToB, damage } = result;

    console.log('Processing collision:', {
      categoryA: entityA.getCategory(),
      categoryB: entityB.getCategory(),
      damageToA,
      damageToB,
      damage: damage || 'undefined'
    });

    // Handle item collection
    if ((entityA.getCategory() === EntityCategory.PLAYER && entityB.getCategory() === EntityCategory.ITEM) ||
        (entityA.getCategory() === EntityCategory.ITEM && entityB.getCategory() === EntityCategory.PLAYER)) {
      
      const item = entityA.getCategory() === EntityCategory.ITEM ? entityA : entityB;
      const itemType = (item as any).getItemType?.();
      
      console.log(`Item collected: ${itemType}`);
      
      if (itemType === 'coin') {
        this.collectCoin();
      } else if (itemType === 'booster') {
        this.collectBooster();
      }
      
      // Apply item effect
      (item as any).applyEffect?.(this.player);
      
      // Deactivate item
      (item as any).deactivate?.();
      
      return; // Don't process damage for item collection
    }

    // Use damageToA or fallback to damage
    if (entityA.getCategory() === EntityCategory.PLAYER && (damageToA || damage)) {
      const playerDamage = damageToA || damage;
      console.log(`Player taking ${playerDamage} damage`);
      const isDestroyed = await (entityA as any).takeDamage(playerDamage);
      if (isDestroyed) {
        console.log('Player destroyed!');
        this.gameOver();
      }
    }

    // Use damageToB or fallback to damage
    if (entityB.getCategory() === EntityCategory.ENEMY || entityB.getCategory() === EntityCategory.BOSS) {
      const enemyDamage = damageToB || damage || GameConfig.collision.defaultDamage.playerBullet; // Use config default damage
      console.log(`Enemy taking ${enemyDamage} damage`);
      const isDestroyed = await (entityB as any).takeDamage(enemyDamage);
      if (isDestroyed) {
        this.score += (entityB as any).getScoreValue ? (entityB as any).getScoreValue() : 100;
        console.log(`Enemy destroyed! Score: ${this.score}`);
      }
    }

    // Deactivate bullets after collision
    if (entityA.getCategory() === EntityCategory.PLAYER_BULLET || 
        entityA.getCategory() === EntityCategory.ENEMY_BULLET) {
      entityA.deactivate();
    }
    
    if (entityB.getCategory() === EntityCategory.PLAYER_BULLET || 
        entityB.getCategory() === EntityCategory.ENEMY_BULLET) {
      entityB.deactivate();
    }
    
    // Don't deactivate enemy here - let takeDamage handle it with explosion
  }

  /**
   * Update UI with current game state
   */
  private updateUI(): void {
    const playerPos = this.player ? this.player.getPosition() : { x: 0, y: 0 };
    const playerState = this.player ? this.player.getState() : { isMoving: false };
    const collisionStats = this.collisionManager ? this.collisionManager.getCollisionStats() : { totalChecks: 0 };
    const waveProgress = this.levelManager ? this.levelManager.getWaveProgress() : 'Wave 0/0';
    const levelProgress = this.levelManager ? this.levelManager.getLevelElapsedTime() : 0;
    const currentLevel = this.levelManager ? this.levelManager.getCurrentLevel() : 1;

    const gameStats: GameStats = {
      score: this.score,
      coins: this.coins,
      activeItemCount: this.itemManager?.getActiveItemCount() || 0,
      health: this.player ? this.player.getHealth() : 0,
      maxHealth: this.player ? this.player.getMaxHealth() : GameConfig.player.maxHealth,
      playerLevel: this.player ? this.player.getBulletLevel() : 1,
      enemyCount: this.enemyManager ? this.enemyManager.getActiveEnemyCount() : 0,
      bulletCount: this.bulletManager ? this.bulletManager.getActiveBulletsCount() : 0,
      level: currentLevel,
      // Additional detailed stats
      currentLevel: currentLevel,
      waveProgress: waveProgress,
      levelProgress: Math.round(levelProgress),
      playerPosition: { x: Math.round(playerPos.x), y: Math.round(playerPos.y) },
      isPlayerMoving: playerState.isMoving || false,
      collisionChecks: collisionStats.totalChecks,
      // Bullet system stats
      bulletDamage: this.player ? this.player.getCurrentDamage() : GameConfig.bullet.damage,
      bulletCountPerShot: this.player ? this.player.getBulletCount() : 1
    };
    
    this.uiRenderer.render(gameStats);
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

  private gameOver(): void {
    this.gameStateManager.changeState(GameState.GAME_OVER);
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
  }

  private gameComplete(): void {
    this.gameStateManager.changeState(GameState.GAME_OVER);
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

  public destroy(): void {
    this.gameStateManager.destroy();

    if (this.app && this.app.ticker) {
      this.app.ticker.remove(this.gameLoop);
    }

    if (this.inputManager) {
      this.inputManager.destroy();
    }
    if (this.bulletManager) {
      this.bulletManager.destroy();
    }
    if (this.enemyBulletManager) {
      this.enemyBulletManager.destroy();
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
    if (this.itemManager) {
      this.itemManager.destroy();
    }

    console.log('Game orchestrator cleaned up');
  }

  public collectCoin(): void {
    this.coins++;
    console.log(`Coin collected! Total coins: ${this.coins}`);
  }

  public collectBooster(): void {
    if (this.player) {
      const oldLevel = this.player.getBulletLevel();
      const oldDamage = this.player.getCurrentDamage();
      
      this.player.upgradeBulletLevel();
      
      const newLevel = this.player.getBulletLevel();
      const newDamage = this.player.getCurrentDamage();
      
      console.log(`Booster collected! Level: ${oldLevel} -> ${newLevel}, Damage: ${oldDamage} -> ${newDamage}`);
    }
  }
} 