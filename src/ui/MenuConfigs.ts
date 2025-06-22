import { MenuConfig } from './MenuTypes';
import { GameStateManager } from '../managers/GameStateManager';
import { GameState } from '../types/GameStateTypes';

export class MenuConfigs {
  private static gameStateManager: GameStateManager;
  private static gameOrchestrator: any = null;
  private static universalMenu: any = null;
  private static audioEnabled: boolean = true;
  private static currentFPS: number = 60;
  private static fpsOptions: number[] = [60, 30, 15];
  private static previousMenuConfig: any = null;

  public static initialize(gameStateManager: GameStateManager, universalMenu?: any, gameOrchestrator?: any): void {
    this.gameStateManager = gameStateManager;
    this.universalMenu = universalMenu;
    this.gameOrchestrator = gameOrchestrator;
  }

  public static getMainMenuConfig(): MenuConfig {
    return {
      title: "SPACE SHOOTER",
      context: 'menu',
      showBackground: true,
      buttons: [
        { 
          text: "New Game", 
          key: 'n', 
          action: () => this.startNewGame(), 
          visible: true 
        },
        { 
          text: "Settings", 
          key: 's', 
          action: () => this.openSettings(), 
          visible: true 
        },
        { 
          text: "Quit", 
          key: 'q', 
          action: () => this.quitGame(), 
          visible: true 
        }
      ]
    };
  }

  public static getPauseMenuConfig(): MenuConfig {
    return {
      title: "PAUSED",
      context: 'pause',
      showBackground: true,
      buttons: [
        { 
          text: "Resume", 
          key: 'Escape', 
          action: () => this.resumeGame(), 
          visible: true 
        },
        { 
          text: "Restart", 
          key: 'r', 
          action: () => this.restartGame(), 
          visible: true 
        },
        { 
          text: "Settings", 
          key: 's', 
          action: () => this.openSettings(), 
          visible: true 
        },
        { 
          text: "Quit to Menu", 
          key: 'q', 
          action: () => this.quitToMenu(), 
          visible: true 
        }
      ]
    };
  }

  public static getSettingsConfig(): MenuConfig {
    const audioText = this.audioEnabled ? "Audio: [ON]" : "Audio: [OFF]";
    const fpsText = `FPS: [${this.currentFPS}]`;

    return {
      title: "SETTINGS",
      context: 'settings',
      showBackground: true,
      buttons: [
        { 
          text: audioText, 
          key: 'a', 
          action: () => this.toggleAudio(), 
          visible: true 
        },
        { 
          text: fpsText, 
          key: 'f', 
          action: () => this.cycleFPS(), 
          visible: true 
        },
        { 
          text: "Back", 
          key: 'b', 
          action: () => this.goBack(), 
          visible: true 
        }
      ]
    };
  }

  private static startNewGame(): void {
    this.gameStateManager.resetSession();
    this.gameStateManager.changeState(GameState.PLAYING);
  }

  private static resumeGame(): void {
    this.gameStateManager.resume();
  }

  private static restartGame(): void {
    if (this.gameOrchestrator) {
      this.gameOrchestrator.restartGame();
    } else {
      this.gameStateManager.resetSession();
      this.gameStateManager.changeState(GameState.PLAYING);
    }
  }

  private static openSettings(): void {
    if (!this.universalMenu) return;
    
    const currentState = this.gameStateManager.getCurrentState();
    if (currentState === GameState.MENU) {
      this.previousMenuConfig = this.getMainMenuConfig;
    } else if (currentState === GameState.PAUSED) {
      this.previousMenuConfig = this.getPauseMenuConfig;
    }
    
    const settingsConfig = this.getSettingsConfig();
    this.universalMenu.configure(settingsConfig);
  }

  private static quitGame(): void {
    if (confirm("Are you sure you want to quit?")) {
      window.close();
    }
  }

  private static quitToMenu(): void {
    this.gameStateManager.changeState(GameState.MENU);
  }

  private static toggleAudio(): void {
    this.audioEnabled = !this.audioEnabled;
    console.log(`Audio ${this.audioEnabled ? 'enabled' : 'disabled'}`);
    
    if (this.universalMenu) {
      const updatedConfig = this.getSettingsConfig();
      this.universalMenu.configure(updatedConfig);
    }
  }

  private static cycleFPS(): void {
    const currentIndex = this.fpsOptions.indexOf(this.currentFPS);
    const nextIndex = (currentIndex + 1) % this.fpsOptions.length;
    this.currentFPS = this.fpsOptions[nextIndex];
    
    // Access the PIXI app through a more reliable method
    const app = (window as any).app;
    if (app?.ticker) {
      app.ticker.maxFPS = this.currentFPS;
    }
    
    console.log(`FPS set to ${this.currentFPS}`);
    
    if (this.universalMenu) {
      const updatedConfig = this.getSettingsConfig();
      this.universalMenu.configure(updatedConfig);
    }
  }

  private static goBack(): void {
    if (!this.universalMenu || !this.previousMenuConfig) return;
    
    const config = this.previousMenuConfig();
    this.universalMenu.configure(config);
    this.previousMenuConfig = null;
  }

  public static getAudioEnabled(): boolean {
    return this.audioEnabled;
  }

  public static getCurrentFPS(): number {
    return this.currentFPS;
  }
} 