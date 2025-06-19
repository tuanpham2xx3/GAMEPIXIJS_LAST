import * as PIXI from 'pixi.js';
import { GameConfig } from '../core/Config';
import { Player } from '../entities/Player';
import { BulletManager } from '../managers/BulletManager';
import { EnemyManager } from '../managers/EnemyManager';
import { LevelManager } from '../managers/LevelManager';
import { CollisionManager } from '../managers/CollisionManager';
import { InputManager } from '../managers/InputManager';

export interface GameStats {
  score: number;
  currentLevel: number;
  waveProgress: string;
  levelProgress: number;
  activeEnemyCount: number;
  activeBulletCount: number;
  playerHealth: number;
  playerMaxHealth: number;
  playerPosition: { x: number; y: number };
  isPlayerMoving: boolean;
  collisionChecks: number;
}

/**
 * Responsible for UI rendering and game statistics display
 * Single Responsibility: UI management
 */
export class UIRenderer {
  private uiContainer: PIXI.Container;
  private gameTitle: PIXI.Text | null = null;

  constructor(uiContainer: PIXI.Container) {
    this.uiContainer = uiContainer;
  }

  /**
   * Initialize UI elements
   */
  public initialize(): void {
    this.createTitle();
    console.log('🎨 UI initialized');
  }

  /**
   * Create game title
   */
  private createTitle(): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffffff,
      stroke: 0x000000,
      strokeThickness: 2,
    });

    this.gameTitle = new PIXI.Text('SPACE SHOOTER', style);
    this.gameTitle.anchor.set(0.5, 0);
    this.gameTitle.x = GameConfig.screen.width / 2;
    this.gameTitle.y = 20;
    this.uiContainer.addChild(this.gameTitle);
  }

  /**
   * Update game statistics display
   */
  public updateGameStats(stats: GameStats): void {
    // Remove previous stats
    const existingStats = this.uiContainer.getChildByName('gameStats');
    if (existingStats) {
      this.uiContainer.removeChild(existingStats);
    }

    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x88ff88,
      stroke: 0x000000,
      strokeThickness: 1,
    });

    const statsText = new PIXI.Text(
      `Score: ${stats.score}\n` +
      `Level: ${stats.currentLevel}\n` +
      `Wave: ${stats.waveProgress}\n` +
      `Time: ${Math.round(stats.levelProgress)}s\n` +
      `Health: ${stats.playerHealth}/${stats.playerMaxHealth}\n` +
      `Active Enemies: ${stats.activeEnemyCount}\n` +
      `Active Bullets: ${stats.activeBulletCount}\n` +
      `Collision Checks: ${stats.collisionChecks}\n` +
      `Position: (${Math.round(stats.playerPosition.x)}, ${Math.round(stats.playerPosition.y)})\n` +
      `Status: ${stats.isPlayerMoving ? 'Moving & Shooting' : 'Idle'}`,
      style
    );

    statsText.x = 10;
    statsText.y = GameConfig.screen.height - 150;
    statsText.name = 'gameStats';
    this.uiContainer.addChild(statsText);
  }

  /**
   * Show loading progress
   */
  public updateLoadingProgress(percentage: number, text: string): void {
    const progressBar = document.getElementById('progress');
    const loadingText = document.querySelector('.loading-text');
    
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    if (loadingText) {
      loadingText.textContent = text;
    }
  }

  /**
   * Hide loading screen
   */
  public hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.transition = 'opacity 0.5s ease';
      
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  /**
   * Handle screen resize
   */
  public onResize(): void {
    if (this.gameTitle) {
      this.gameTitle.x = GameConfig.screen.width / 2;
    }
  }

  /**
   * Collect game stats from managers
   */
  public static collectGameStats(
    score: number,
    player: Player | null,
    bulletManager: BulletManager | null,
    enemyManager: EnemyManager | null,
    levelManager: LevelManager | null,
    collisionManager: CollisionManager | null,
    inputManager: InputManager | null
  ): GameStats | null {
    if (!player || !bulletManager) return null;

    const playerPos = player.getPosition();
    const playerState = player.getState();
    const bulletStats = bulletManager.getPoolStats();

    const enemyStats = enemyManager?.getPoolStats() || {};
    const activeEnemyCount = enemyManager?.getActiveEnemyCount() || 0;
    const currentLevel = levelManager?.getCurrentLevel() || 0;
    const levelProgress = levelManager?.getLevelElapsedTime() || 0;
    const waveProgress = levelManager?.getWaveProgress() || 'Wave 0/0';
    const collisionStats = collisionManager?.getCollisionStats() || { totalChecks: 0 };

    return {
      score,
      currentLevel,
      waveProgress,
      levelProgress,
      activeEnemyCount,
      activeBulletCount: bulletStats.active,
      playerHealth: playerState.health,
      playerMaxHealth: player.getMaxHealth(),
      playerPosition: playerPos,
      isPlayerMoving: playerState.isMoving,
      collisionChecks: collisionStats.totalChecks
    };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.uiContainer.removeChildren();
  }
} 