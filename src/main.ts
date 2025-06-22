import * as PIXI from 'pixi.js';
import { GameConfig } from './core/Config';

// Import refactored components
import { GameBootstrapper, GameContainers } from './core/GameBootstrapper';
import { AssetLoader, LoadingProgress } from './core/AssetLoader';
import { BackgroundRenderer } from './rendering/BackgroundRenderer';
import { UIRenderer } from './rendering/UIRenderer';
import { GameOrchestrator } from './core/GameOrchestrator';
import { GameStateManager } from './managers/GameStateManager';
import { GameState } from './types/GameStateTypes';

/**
 * Main Game class - now follows Single Responsibility Principle
 * Single Responsibility: Coordinating game initialization and lifecycle
 */
class Game {
  // Core components
  private bootstrapper!: GameBootstrapper;
  private assetLoader!: AssetLoader;
  private backgroundRenderer!: BackgroundRenderer;
  private uiRenderer!: UIRenderer;
  private gameOrchestrator!: GameOrchestrator;

  // References for cleanup
  private app!: PIXI.Application;
  private containers!: GameContainers;

  constructor() {
    console.log('Starting Space Shooter Game...');
    this.initialize();
  }

  /**
   * Initialize game - orchestrate the startup process
   */
  private async initialize(): Promise<void> {
    try {
      // Phase 1: Bootstrap application
      this.bootstrapper = new GameBootstrapper();
      this.app = this.bootstrapper.getApp();
      this.containers = this.bootstrapper.getContainers();
      
      // Phase 2: Setup renderers
      this.backgroundRenderer = new BackgroundRenderer(this.containers.backgroundContainer);
      this.uiRenderer = new UIRenderer(this.containers.uiContainer);
      
      // Phase 3: Setup asset loader with progress callback
      this.assetLoader = new AssetLoader((progress) => this.onLoadingProgress(progress));
      
      // Phase 4: Setup game orchestrator
      this.gameOrchestrator = new GameOrchestrator(
        this.app,
        this.containers.gameContainer,
        this.containers.uiContainer,
        this.backgroundRenderer,
        this.uiRenderer
      );

      // Start initialization sequence
      await this.startInitializationSequence();

    } catch (error) {
      console.error('Failed to initialize game:', error);
      this.onInitializationError(error);
    }
  }

  /**
   * Orchestrate the initialization sequence
   */
  private async startInitializationSequence(): Promise<void> {

    this.updateLoadingProgress(10, 'Initializing systems...');
    

    this.uiRenderer.initialize();
    this.updateLoadingProgress(20, 'Creating background...');
    

    await this.backgroundRenderer.initialize();
    this.updateLoadingProgress(40, 'Loading assets...');
    

    const assets = await this.assetLoader.loadGameAssets();
    this.updateLoadingProgress(70, 'Initializing game systems...');
    

    await this.gameOrchestrator.initialize(assets);
    this.updateLoadingProgress(90, 'Starting game...');
    

    this.setupResizeHandler();
    

    this.updateLoadingProgress(100, 'Ready!');
    

    setTimeout(() => {
      this.uiRenderer.hideLoadingScreen();
      const gameStateManager = GameStateManager.getInstance();
      gameStateManager.changeState(GameState.MENU);
      this.gameOrchestrator.startGame();
    }, 500);
    
    console.log('Game initialized successfully!');
  }

  /**
   * Handle loading progress updates
   */
  private onLoadingProgress(progress: LoadingProgress): void {
    this.updateLoadingProgress(progress.percentage, progress.message);
  }

  /**
   * Update loading progress UI
   */
  private updateLoadingProgress(percentage: number, text: string): void {
    this.uiRenderer.updateLoadingProgress(percentage, text);
  }

  /**
   * Setup window resize handler
   */
  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      this.gameOrchestrator.onResize();
    });
  }

  /**
   * Handle initialization errors
   */
  private onInitializationError(error: any): void {
    console.error('Critical initialization error:', error);
    this.uiRenderer.hideLoadingScreen();
    

    alert('Failed to start game. Please refresh the page.');
  }

  /**
   * Cleanup and destroy game
   */
  public destroy(): void {
    console.log('Destroying game...');
    
    try {
      this.gameOrchestrator?.destroy();
      this.backgroundRenderer?.destroy();
      this.uiRenderer?.destroy();
      this.bootstrapper?.destroy();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
    
    console.log('Game destroyed');
  }
}

// Start the game when page loads
window.onload = () => {
  const game = new Game();
  

  if (GameConfig.debug) {
    (window as any).gameDebug = {
      getInfo: () => {
        console.log('Game instance created');
        return {
          version: '2.0.0-refactored',
          architecture: 'Clean Architecture with SRP',
          components: [
            'GameBootstrapper',
            'AssetLoader', 
            'BackgroundRenderer',
            'UIRenderer',
            'GameOrchestrator'
          ]
        };
      },
      destroyGame: () => {
        game.destroy();
      },
      getScaleInfo: () => {
        console.log('Screen Resolution:', GameConfig.screen);
        console.log('Reference Resolution:', GameConfig.referenceResolution);
        console.log('Scale Factors:', GameConfig.scale);
        return {
          screen: GameConfig.screen,
          reference: GameConfig.referenceResolution,
          scale: GameConfig.scale
        };
      }
    };

    console.log('Debug commands available:');
    console.log('gameDebug.getInfo() - Get game info');
    console.log('gameDebug.destroyGame() - Destroy game instance');
    console.log('gameDebug.getScaleInfo() - Get screen scaling info');
  }
}; 