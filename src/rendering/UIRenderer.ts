import * as PIXI from 'pixi.js';
import { GameConfig } from '../core/Config';
import { Player } from '../entities/Player';
import { BulletManager } from '../managers/BulletManager';
import { EnemyManager } from '../managers/spawn/EnemyManager';
import { LevelManager } from '../managers/spawn/LevelManager';
import { CollisionManager } from '../managers/CollisionManager';
import { InputManager } from '../managers/InputManager';

export interface GameStats {
  score: number;
  coins: number;
  activeItemCount: number;
  health: number;
  maxHealth: number;
  playerLevel: number;
  enemyCount: number;
  bulletCount: number;
  level: number;
  // Additional detailed stats
  currentLevel: number;
  waveProgress: string;
  levelProgress: number;
  playerPosition: { x: number; y: number };
  isPlayerMoving: boolean;
  collisionChecks: number;
  // Bullet system stats
  bulletDamage?: number;
  bulletCountPerShot?: number;
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
  public render(stats: GameStats): void {
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
      `=== GAME STATS ===\n` +
      `Score: ${stats.score}\n` +
      `Coins: ${stats.coins} 🪙\n` +
      `Level: ${stats.level}\n` +
      `Wave: ${stats.waveProgress}\n` +
      `Time: ${stats.levelProgress}s\n` +
      `\n=== PLAYER ===\n` +
      `Health: ${stats.health}/${stats.maxHealth}\n` +
      `Player Level: ${stats.playerLevel}\n` +
      `Position: (${stats.playerPosition.x}, ${stats.playerPosition.y})\n` +
      `Status: ${stats.isPlayerMoving ? 'Moving & Shooting' : 'Idle'}\n` +
      `\n=== ENTITIES ===\n` +
      `Active Enemies: ${stats.enemyCount}\n` +
      `Active Bullets: ${stats.bulletCount}\n` +
      `Active Items: ${stats.activeItemCount}\n` +
      `\n=== SYSTEM ===\n` +
      `Collision Checks: ${stats.collisionChecks}`,
      style
    );

    statsText.x = 10;
    statsText.y = 60;
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
   * Cleanup
   */
  public destroy(): void {
    this.uiContainer.removeChildren();
  }
} 