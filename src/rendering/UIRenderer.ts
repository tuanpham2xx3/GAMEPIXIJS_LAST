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
 * Responsible for UI rendering with modern HUD design
 * Single Responsibility: UI management
 */
export class UIRenderer {
  private uiContainer: PIXI.Container;
  private hudContainer: PIXI.Container;
  
  // HUD Elements
  private scoreText: PIXI.Text | null = null;
  private coinsText: PIXI.Text | null = null;
  private levelText: PIXI.Text | null = null;
  private timeText: PIXI.Text | null = null;
  private fpsText: PIXI.Text | null = null;
  
  // Health Bar Elements
  private healthBarBg: PIXI.Graphics | null = null;
  private healthBarFill: PIXI.Graphics | null = null;
  private healthText: PIXI.Text | null = null;
  
  // HUD Background
  private hudBackground: PIXI.Graphics | null = null;
  
  private lastUpdateTime: number = 0;
  private readonly UPDATE_INTERVAL = 100; // Update UI every 100ms
  private fpsCounter: number = 0;
  private lastFpsTime: number = 0;
  private frameCount: number = 0;

  constructor(uiContainer: PIXI.Container) {
    this.uiContainer = uiContainer;
    this.hudContainer = new PIXI.Container();
    this.uiContainer.addChild(this.hudContainer);
  }

  /**
   * Initialize modern HUD elements
   */
  public initialize(): void {
    this.createHudBackground();
    this.createScoreDisplay();
    this.createCoinsDisplay();
    this.createLevelDisplay();
    this.createTimeDisplay();
    this.createFpsDisplay();
    this.createHealthBar();
  }

  /**
   * Create semi-transparent HUD background
   */
  private createHudBackground(): void {
    this.hudBackground = new PIXI.Graphics();
    
    // Simple background panel at bottom-left
    const panelWidth = 280;
    const panelHeight = 120;
    const panelX = 15;
    const panelY = GameConfig.screen.height - panelHeight - 15;
    
    this.hudBackground.beginFill(0x000000, 0.6);
    this.hudBackground.drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    this.hudBackground.endFill();
    
    // Subtle border
    this.hudBackground.lineStyle(1, 0x333333, 0.8);
    this.hudBackground.drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    
    this.hudContainer.addChild(this.hudBackground);
  }

  /**
   * Create score display - Row 1
   */
  private createScoreDisplay(): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 16,
      fill: 0xFFD700,
      stroke: 0x000000,
      strokeThickness: 1,
      fontWeight: 'bold',
    });

    const baseY = GameConfig.screen.height - 110; // Row 1
    this.scoreText = new PIXI.Text('Score: 0', style);
    this.scoreText.x = 25;
    this.scoreText.y = baseY;
    this.hudContainer.addChild(this.scoreText);
  }

  /**
   * Create coins display - Row 2
   */
  private createCoinsDisplay(): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0x00FF00,
      stroke: 0x000000,
      strokeThickness: 1,
    });

    const baseY = GameConfig.screen.height - 92; // Row 2
    this.coinsText = new PIXI.Text('🪙 0', style);
    this.coinsText.x = 25;
    this.coinsText.y = baseY;
    this.hudContainer.addChild(this.coinsText);
  }

  /**
   * Create level display - Row 3 left
   */
  private createLevelDisplay(): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0x00BFFF,
      stroke: 0x000000,
      strokeThickness: 1,
    });

    const baseY = GameConfig.screen.height - 74; // Row 3
    this.levelText = new PIXI.Text('Lv: 1', style);
    this.levelText.x = 25;
    this.levelText.y = baseY;
    this.hudContainer.addChild(this.levelText);
  }

  /**
   * Create time display - Row 3 center
   */
  private createTimeDisplay(): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xFF69B4,
      stroke: 0x000000,
      strokeThickness: 1,
    });

    const baseY = GameConfig.screen.height - 74; // Row 3
    this.timeText = new PIXI.Text('⏱️ 0s', style);
    this.timeText.x = 85;
    this.timeText.y = baseY;
    this.hudContainer.addChild(this.timeText);
  }

  /**
   * Create FPS display - Row 3 right
   */
  private createFpsDisplay(): void {
    const style = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0x90EE90,
      stroke: 0x000000,
      strokeThickness: 1,
    });

    const baseY = GameConfig.screen.height - 74; // Row 3
    this.fpsText = new PIXI.Text('FPS: 60', style);
    this.fpsText.x = 180;
    this.fpsText.y = baseY;
    this.hudContainer.addChild(this.fpsText);
  }

  /**
   * Create health bar - Row 4 (bottom)
   */
  private createHealthBar(): void {
    const barWidth = 250;
    const barHeight = 16;
    const barX = 25;
    const barY = GameConfig.screen.height - 50; // Row 4

    // Health bar background (dark red)
    this.healthBarBg = new PIXI.Graphics();
    this.healthBarBg.beginFill(0x330000);
    this.healthBarBg.drawRoundedRect(barX, barY, barWidth, barHeight, 8);
    this.healthBarBg.endFill();
    
    // Health bar border
    this.healthBarBg.lineStyle(1, 0x666666);
    this.healthBarBg.drawRoundedRect(barX, barY, barWidth, barHeight, 8);
    this.hudContainer.addChild(this.healthBarBg);

    // Health bar fill (red to green gradient effect)
    this.healthBarFill = new PIXI.Graphics();
    this.hudContainer.addChild(this.healthBarFill);

    // Health text overlay
    const healthStyle = new PIXI.TextStyle({
      fontFamily: 'Arial',
      fontSize: 12,
      fill: 0xFFFFFF,
      stroke: 0x000000,
      strokeThickness: 1,
    });

    this.healthText = new PIXI.Text('❤️ 1000/1000', healthStyle);
    this.healthText.x = barX + 8;
    this.healthText.y = barY + 1;
    this.hudContainer.addChild(this.healthText);
  }

  /**
   * Update health bar visual
   */
  private updateHealthBar(health: number, maxHealth: number): void {
    if (!this.healthBarFill || !this.healthText) return;

    const barWidth = 250;
    const barHeight = 16;
    const barX = 25;
    const barY = GameConfig.screen.height - 50; // Row 4

    const healthPercent = Math.max(0, Math.min(1, health / maxHealth));
    const fillWidth = barWidth * healthPercent;

    // Clear previous fill
    this.healthBarFill.clear();

    // Determine color based on health percentage
    let fillColor = 0x00FF00; // Green
    if (healthPercent < 0.3) {
      fillColor = 0xFF0000; // Red
    } else if (healthPercent < 0.6) {
      fillColor = 0xFF8800; // Orange
    } else if (healthPercent < 0.8) {
      fillColor = 0xFFFF00; // Yellow
    }

    // Draw health fill
    if (fillWidth > 0) {
      this.healthBarFill.beginFill(fillColor, 0.8);
      this.healthBarFill.drawRoundedRect(barX, barY, fillWidth, barHeight, 8);
      this.healthBarFill.endFill();
    }

    // Update health text
    this.healthText.text = `❤️ ${Math.ceil(health)}/${maxHealth}`;
  }

  /**
   * Update FPS counter
   */
  private updateFps(): void {
    this.frameCount++;
    const currentTime = Date.now();
    
    if (currentTime - this.lastFpsTime >= 1000) {
      this.fpsCounter = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = currentTime;
      
      if (this.fpsText) {
        this.fpsText.text = `FPS: ${this.fpsCounter}`;
      }
    }
  }

  /**
   * Main render method with beautiful HUD
   */
  public render(stats: GameStats): void {
    const currentTime = Date.now();
    
    // Always update FPS
    this.updateFps();
    
    // Throttle other UI updates
    if (currentTime - this.lastUpdateTime < this.UPDATE_INTERVAL) {
      return;
    }
    
    this.lastUpdateTime = currentTime;

    // Update all HUD elements
    if (this.scoreText) {
      this.scoreText.text = `Score: ${stats.score.toLocaleString()}`;
    }

    if (this.coinsText) {
      this.coinsText.text = `🪙 ${stats.coins}`;
    }

    if (this.levelText) {
      this.levelText.text = `Lv: ${stats.playerLevel}`;
    }

    if (this.timeText) {
      this.timeText.text = `⏱️ ${stats.levelProgress}s`;
    }

    // Update health bar
    this.updateHealthBar(stats.health, stats.maxHealth);
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
    // Recreate HUD elements for new screen size
    this.hudContainer.removeChildren();
    this.initialize();
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.uiContainer.removeChildren();
  }
} 