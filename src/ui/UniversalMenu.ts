import * as PIXI from 'pixi.js';
import { MenuConfig, MenuButton, MenuButtonSprite } from './MenuTypes';
import { GameConfig } from '../core/Config';

interface MenuButtonGraphics {
  container: PIXI.Container;
  background: PIXI.Graphics;
  text: PIXI.Text;
  button: MenuButton;
  index: number;
}

export class UniversalMenu extends PIXI.Container {
  private config: MenuConfig | null = null;
  private selectedIndex: number = 0;
  private buttons: MenuButtonGraphics[] = [];
  private titleText: PIXI.Text | null = null;
  private background: PIXI.Graphics | null = null;
  private menuPanel: PIXI.Graphics | null = null;
  private statsContainer: PIXI.Container | null = null;
  private isVisible: boolean = false;

  constructor() {
    super();
    this.visible = false;
    this.interactive = true;
  }

  public configure(config: MenuConfig): void {
    this.config = config;
    this.selectedIndex = 0;
    this.rebuild();
  }

  private rebuild(): void {
    this.removeChildren();
    this.buttons = [];
    this.statsContainer = null;
    this.selectedIndex = -1; // Reset to no selection initially
    
    if (!this.config) return;

    this.createBackground();
    this.createMenuPanel();
    this.createTitle();
    if (this.config.stats) {
      this.createStatsDisplay();
    }
    this.createButtons();
    this.updateSelection();
  }

  private createBackground(): void {
    if (!this.config?.showBackground) return;

    this.background = new PIXI.Graphics();
    this.background.beginFill(0x000000, 0.85);
    this.background.drawRect(0, 0, GameConfig.screen.width, GameConfig.screen.height);
    this.background.endFill();
    this.addChild(this.background);
  }

  private createMenuPanel(): void {
    if (!this.config) return;

    const isVictory = this.config.context === 'victory';
    const isGameOver = this.config.context === 'game_over';
    const panelWidth = 450; // Slightly wider
    const hasStats = (isVictory || isGameOver) && this.config.stats;
    const extraHeight = hasStats ? 200 : 0; // More space for stats and better spacing
    const panelHeight = this.config.buttons.length * 80 + 250 + extraHeight;
    const panelX = (GameConfig.screen.width - panelWidth) / 2;
    const panelY = (GameConfig.screen.height - panelHeight) / 2;

    this.menuPanel = new PIXI.Graphics();
    
    // Victory screen gets gold/yellow theme, Game Over gets red theme
    if (isVictory) {
      this.menuPanel.lineStyle(3, 0xFFD700, 1); // Gold border
      this.menuPanel.beginFill(0x2a2a1a, 0.95); // Dark gold background
    } else if (isGameOver) {
      this.menuPanel.lineStyle(3, 0xFF4444, 1); // Red border
      this.menuPanel.beginFill(0x2a1a1a, 0.95); // Dark red background
    } else {
      this.menuPanel.lineStyle(3, 0x00BFFF, 1);
      this.menuPanel.beginFill(0x1a1a2e, 0.95);
    }
    
    this.menuPanel.drawRoundedRect(panelX, panelY, panelWidth, panelHeight, 15);
    this.menuPanel.endFill();

    if (isVictory) {
      this.menuPanel.lineStyle(1, 0xB8860B, 0.8); // Dark gold inner
      this.menuPanel.beginFill(0x8B7355, 0.3); // Brown gold fill
    } else if (isGameOver) {
      this.menuPanel.lineStyle(1, 0x8B0000, 0.8); // Dark red inner
      this.menuPanel.beginFill(0x654321, 0.3); // Dark brown fill
    } else {
      this.menuPanel.lineStyle(1, 0x16213e, 0.8);
      this.menuPanel.beginFill(0x0f3460, 0.3);
    }
    
    this.menuPanel.drawRoundedRect(panelX + 10, panelY + 10, panelWidth - 20, panelHeight - 20, 10);
    this.menuPanel.endFill();

    this.addChild(this.menuPanel);
  }

  private createStatsDisplay(): void {
    if (!this.config?.stats) return;

    this.statsContainer = new PIXI.Container();
    
    const isGameOver = this.config.context === 'game_over';
    
    // Different icon and message for game over vs victory
    const iconText = isGameOver ? '💀 GAME OVER 💀' : '🏆 GAME COMPLETED! 🏆';
    const iconColor = isGameOver ? ['#FF4444', '#CC0000'] : ['#FFD700', '#FFA500'];
    const iconStroke = isGameOver ? '#4B0000' : '#8B4513';
    
    const statusText = new PIXI.Text(iconText, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 20,
      fontWeight: 'bold',
      fill: iconColor,
      stroke: iconStroke,
      strokeThickness: 2,
      align: 'center'
    });
    statusText.anchor.set(0.5);
    statusText.x = GameConfig.screen.width / 2;
    statusText.y = GameConfig.screen.height / 2 - 60; // Move up closer to title
    this.statsContainer.addChild(statusText);

    // Stats display - position relative to panel center
    const stats = this.config.stats;
    const centerY = GameConfig.screen.height / 2;
    const statsStartY = centerY - 20; // Start stats just above center
    const spacing = 25; // Reduce spacing

    // Score
    const scoreText = new PIXI.Text(`Score: ${stats.score.toLocaleString()}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: '#FFFFFF',
      align: 'center'
    });
    scoreText.anchor.set(0.5);
    scoreText.x = GameConfig.screen.width / 2;
    scoreText.y = statsStartY;
    this.statsContainer.addChild(scoreText);

    // Coins
    const coinsText = new PIXI.Text(`Coins: ${stats.coins}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: isGameOver ? '#FF6666' : '#FFD700',
      align: 'center'
    });
    coinsText.anchor.set(0.5);
    coinsText.x = GameConfig.screen.width / 2;
    coinsText.y = statsStartY + spacing;
    this.statsContainer.addChild(coinsText);

    // Time
    const timeText = new PIXI.Text(`Time: ${stats.time}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'bold',
      fill: '#87CEEB',
      align: 'center'
    });
    timeText.anchor.set(0.5);
    timeText.x = GameConfig.screen.width / 2;
    timeText.y = statsStartY + spacing * 2;
    this.statsContainer.addChild(timeText);

    this.addChild(this.statsContainer);
  }

  private createTitle(): void {
    if (!this.config) return;

    const isVictory = this.config.context === 'victory';
    const isGameOver = this.config.context === 'game_over';
    
    let titleColor;
    if (isVictory) {
      titleColor = ['#FFD700', '#FFA500']; // Gold for victory
    } else if (isGameOver) {
      titleColor = ['#FF4444', '#CC0000']; // Red for game over
    } else {
      titleColor = ['#00BFFF', '#87CEEB']; // Blue for normal menus
    }
    
    this.titleText = new PIXI.Text(this.config.title, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 42,
      fontWeight: 'bold',
      fill: titleColor,
      stroke: '#1a1a2e',
      strokeThickness: 3,
      dropShadow: true,
      dropShadowColor: '#000000',
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 2,
      align: 'center'
    });

    this.titleText.anchor.set(0.5);
    this.titleText.x = GameConfig.screen.width / 2;
    // Position title higher up for victory/game over screens
    const hasStats = this.config.stats;
    this.titleText.y = hasStats ? GameConfig.screen.height / 2 - 120 : GameConfig.screen.height / 2 - 100;
    
    this.addChild(this.titleText);
  }

  private createButtons(): void {
    if (!this.config) return;

    const visibleButtons = this.config.buttons.filter(btn => btn.visible);
    const isVictory = this.config.context === 'victory';
    const isGameOver = this.config.context === 'game_over';
    const hasStats = (isVictory || isGameOver) && this.config.stats;
    // Push buttons down much more for stats screens to avoid overlap
    const extraOffset = hasStats ? 120 : 0; 
    const startY = GameConfig.screen.height / 2 + extraOffset;
    const spacing = 60; // Reduce spacing slightly
    const buttonWidth = 320; // Wider buttons to match panel
    const buttonHeight = 50;

    visibleButtons.forEach((button, index) => {
      const container = new PIXI.Container();
      
      const background = new PIXI.Graphics();
      const text = new PIXI.Text(button.text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fontWeight: '600',
        fill: '#E0E0E0',
        align: 'center'
      });

      text.anchor.set(0.5);
      text.x = buttonWidth / 2;
      text.y = buttonHeight / 2;

      container.x = (GameConfig.screen.width - buttonWidth) / 2;
      container.y = startY + (index * spacing);

      container.addChild(background);
      container.addChild(text);

      container.interactive = true;
      container.cursor = 'pointer';

      container.on('pointerdown', () => {
        this.selectedIndex = index;
        this.updateSelection();
        button.action();
      });

      container.on('pointerover', () => {
        if (this.selectedIndex !== index) {
          this.selectedIndex = index;
          this.updateSelection();
        }
      });

      container.on('pointerout', () => {
        // Reset selection when mouse leaves all buttons
        this.selectedIndex = -1;
        this.updateSelection();
      });

      const buttonGraphics: MenuButtonGraphics = {
        container: container,
        background: background,
        text: text,
        button: button,
        index: index
      };

      this.buttons.push(buttonGraphics);
      this.addChild(container);
    });
  }

  private updateSelection(): void {
    this.buttons.forEach((buttonGraphics, index) => {
      const isSelected = index === this.selectedIndex && this.selectedIndex >= 0;
      
      buttonGraphics.background.clear();
      
      if (isSelected) {
        // Hover effect - highlighted
        buttonGraphics.background.lineStyle(2, 0x00BFFF, 1);
        buttonGraphics.background.beginFill(0x00BFFF, 0.2);
        buttonGraphics.background.drawRoundedRect(0, 0, 320, 50, 8);
        buttonGraphics.background.endFill();
        
        buttonGraphics.background.lineStyle(1, 0x87CEEB, 0.6);
        buttonGraphics.background.beginFill(0xFFFFFF, 0.1);
        buttonGraphics.background.drawRoundedRect(2, 2, 316, 46, 6);
        buttonGraphics.background.endFill();
        
        buttonGraphics.text.style.fill = '#FFFFFF';
        buttonGraphics.text.style.fontSize = 22;
        buttonGraphics.text.style.fontWeight = 'bold';
      } else {
        // Normal state - unselected
        buttonGraphics.background.lineStyle(1, 0x555555, 0.8);
        buttonGraphics.background.beginFill(0x2a2a2a, 0.6);
        buttonGraphics.background.drawRoundedRect(0, 0, 320, 50, 8);
        buttonGraphics.background.endFill();
        
        buttonGraphics.text.style.fill = '#E0E0E0';
        buttonGraphics.text.style.fontSize = 20;
        buttonGraphics.text.style.fontWeight = '600';
      }
    });
  }

  public handleInput(key: string): boolean {
    // Disabled keyboard navigation - only mouse/touch input allowed
    return false;
  }

  public show(): void {
    this.visible = true;
    this.isVisible = true;
  }

  public hide(): void {
    this.visible = false;
    this.isVisible = false;
  }

  public isShowing(): boolean {
    return this.isVisible;
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  public setSelectedIndex(index: number): void {
    if (index >= 0 && index < this.buttons.length) {
      this.selectedIndex = index;
      this.updateSelection();
    }
  }
} 