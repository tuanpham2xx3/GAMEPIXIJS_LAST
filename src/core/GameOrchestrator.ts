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
import { WarningGlowManager } from '../managers/animations/effects/WarningGlowManager';
import { AudioManager } from '../managers/AudioManager';

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
  private warningGlowManager: WarningGlowManager | null = null;
  
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
      // Only start gameplay if we're not resuming from pause
      if (this.gameStateManager.getStateData().previousState !== GameState.PAUSED) {
        this.startGameplay();
      }
    });

    this.gameStateManager.onStateChange(GameState.PAUSED, () => {
      this.showPauseMenu();
    });

    this.gameStateManager.onStateChange(GameState.GAME_OVER, () => {
      this.handleGameOver();
    });

    this.gameStateManager.onStateChange(GameState.VICTORY, () => {
      this.handleVictory();
    });
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        const currentState = this.gameStateManager.getCurrentState();
        
        if (currentState === GameState.PLAYING && !this.universalMenu.isShowing()) {
          // In-game → Pause
          this.gameStateManager.pause();
          event.preventDefault();
        } else if (currentState === GameState.PAUSED && this.universalMenu.isShowing()) {
          // In pause menu → Resume
          this.gameStateManager.resume();
          event.preventDefault();
        }
      }
      // Don't handle any other menu input - force mouse/touch only for menu navigation
    });
  }

  private showMainMenu(): void {
    const config = MenuConfigs.getMainMenuConfig();
    this.universalMenu.configure(config);
    this.universalMenu.show();
    
    // Start menu background music with a small delay to ensure audio is loaded
    setTimeout(() => {
      const audioManager = AudioManager.getInstance();
      audioManager.playBackgroundMusic();
    }, 100);
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
    
    // Start background music with small delay to ensure smooth transition
    setTimeout(() => {
      const audioManager = AudioManager.getInstance();
      audioManager.playBackgroundMusic();
    }, 200);
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

    // Stop warning glow effect nếu đang active
    if (this.warningGlowManager) {
      this.warningGlowManager.stopWarningGlow();
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
    // Play lose sound effect
    const audioManager = AudioManager.getInstance();
    audioManager.playLose();
    audioManager.stopAllMusic();
    
    this.showGameOverScreen();
  }

  private showGameOverScreen(): void {
    // Calculate play time
    const sessionData = this.gameStateManager.getSession();
    const currentTime = Date.now();
    const playTime = currentTime - sessionData.startTime;
    
    // Update session with final stats
    this.gameStateManager.updateSession({
      score: this.score,
      coins: this.coins,
      playTime: playTime
    });

    // Show game over menu with stats
    const updatedSessionData = this.gameStateManager.getSession();
    const config = MenuConfigs.getGameOverMenuConfig(updatedSessionData);
    this.universalMenu.configure(config);
    this.universalMenu.show();
    
    // Resume background music after lose sound finishes
    setTimeout(() => {
      const audioManager = AudioManager.getInstance();
      audioManager.playBackgroundMusic();
    }, 2500);
  }

  private handleVictory(): void {
    // Play win sound effect
    const audioManager = AudioManager.getInstance();
    audioManager.playWin();
    audioManager.stopAllMusic();
    
    this.showVictoryScreen();
  }

  private showVictoryScreen(): void {
    // Calculate play time
    const sessionData = this.gameStateManager.getSession();
    const currentTime = Date.now();
    const playTime = currentTime - sessionData.startTime;
    
    // Update session with final stats
    this.gameStateManager.updateSession({
      score: this.score,
      coins: this.coins,
      playTime: playTime
    });

    // Show victory menu with stats
    const updatedSessionData = this.gameStateManager.getSession();
    const config = MenuConfigs.getVictoryMenuConfig(updatedSessionData);
    this.universalMenu.configure(config);
    this.universalMenu.show();
    
    // Resume background music after win sound finishes
    setTimeout(() => {
      const audioManager = AudioManager.getInstance();
      audioManager.playBackgroundMusic();
    }, 3500);
  }

  public async initialize(assets: GameAssets): Promise<void> {
    try {
      // Initialize AudioManager and load audio
      const audioManager = AudioManager.getInstance();
      await audioManager.loadGameAudio();

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

      this.collisionManager = new CollisionManager();

      this.levelManager = new LevelManager(this.enemyManager, this.app, this.uiContainer);
      await this.levelManager.initialize();

      this.player = new Player(assets.playerTexture, this.inputManager, this.bulletManager, assets.smokeTexture);
      this.player.addToParent(this.gameContainer);

      // Initialize WarningGlowManager
      this.warningGlowManager = WarningGlowManager.getInstance(this.app);
      await this.warningGlowManager.initializeGlowSprites();
      
      // Add warning glow container to game container (layer dưới UI)
      this.gameContainer.addChild(this.warningGlowManager.getContainer());
      
      // Set warning glow manager cho player
      this.player.setWarningGlowManager(this.warningGlowManager);

      // Setup enemies với enemy bullet manager
      if (this.enemyManager && this.enemyBulletManager) {
        this.enemyManager.setEnemyBulletManager(this.enemyBulletManager);
      }

    } catch (error) {
      console.error('Failed to initialize game systems:', error);
      throw error;
    }
  }

  public startGame(): void {
    this.app.ticker.add(this.gameLoop.bind(this));
  }

  public getApp(): PIXI.Application {
    return this.app;
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

    // Update WarningGlowManager
    if (this.warningGlowManager) {
      this.warningGlowManager.update(deltaTime);
    }

    if (this.levelManager) {
      this.levelManager.update(deltaTime);

      if (this.levelManager.isLevelComplete()) {
        this.onLevelComplete();
      }
    }

    // FIXED: Sync collision handling for performance
    try {
      this.handleCollisionsSync();
    } catch (error) {
      console.error('Error in collision handling:', error);
    }

    this.updateUI();
  }

  /**
   * Handle collision detection - SYNC VERSION for performance
   */
  private handleCollisionsSync(): void {
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
      this.processCollisionSync(result);
    }
  }

  /**
   * Process individual collision result
   */
  private processCollisionSync(result: any): void {
    const { entityA, entityB, damageToA, damageToB, damage } = result;

    // Handle item collection
    if ((entityA.getCategory() === EntityCategory.PLAYER && entityB.getCategory() === EntityCategory.ITEM) ||
        (entityA.getCategory() === EntityCategory.ITEM && entityB.getCategory() === EntityCategory.PLAYER)) {
      
      const item = entityA.getCategory() === EntityCategory.ITEM ? entityA : entityB;
      const itemType = (item as any).getItemType?.();
      
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
      const isDestroyed = (entityA as any).takeDamage(playerDamage);
      if (isDestroyed) {
        this.gameOver();
      }
    }

    // Use damageToB or fallback to damage
    if (entityB.getCategory() === EntityCategory.ENEMY || entityB.getCategory() === EntityCategory.BOSS) {
      const enemyDamage = damageToB || damage || GameConfig.collision.defaultDamage.playerBullet; // Use config default damage
      const isDestroyed = (entityB as any).takeDamage(enemyDamage);
      if (isDestroyed) {
        this.score += (entityB as any).getScoreValue ? (entityB as any).getScoreValue() : 100;
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
    const currentLevel = this.levelManager ? this.levelManager.getCurrentLevel() : 1;

    // Calculate game session elapsed time
    const sessionData = this.gameStateManager.getSession();
    const gameElapsedTime = Math.floor((Date.now() - sessionData.startTime) / 1000);

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
      levelProgress: gameElapsedTime, // Use game session time instead of level time
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
    if (this.levelManager) {
      this.levelManager.stopLevel();
    }
    // Trigger victory state instead of game over
    this.gameStateManager.changeState(GameState.VICTORY);
  }

  /**
   * Handle screen resize
   */
  public onResize(): void {
    this.backgroundRenderer.onResize();
    this.uiRenderer.onResize();
    
    // Resize warning glow manager
    if (this.warningGlowManager) {
      this.warningGlowManager.onResize(this.app.screen.width, this.app.screen.height);
    }
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
    if (this.warningGlowManager) {
      this.warningGlowManager.destroy();
    }


  }

  public collectCoin(): void {
    this.coins += GameConfig.items.coin.value;
    
    // Play coin collect sound effect
    const audioManager = AudioManager.getInstance();
    audioManager.playCoinCollect();
    

  }

  public collectBooster(): void {
    if (this.player) {
      const oldLevel = this.player.getBulletLevel();
      const oldDamage = this.player.getCurrentDamage();
      
      this.player.upgradeBulletLevel();
      
      const newLevel = this.player.getBulletLevel();
      const newDamage = this.player.getCurrentDamage();
      
      // Play booster collected sound effect
      const audioManager = AudioManager.getInstance();
      audioManager.playBoosterCollected();
      

    }
  }
} 