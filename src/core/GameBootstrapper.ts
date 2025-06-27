import * as PIXI from 'pixi.js';
import { GameConfig, updateScreenSize } from './Config';

export interface GameContainers {
  backgroundContainer: PIXI.Container;
  gameContainer: PIXI.Container;
  uiContainer: PIXI.Container;
}

/**
 * Responsible for bootstrapping the PIXI application and setting up basic containers
 * Single Responsibility: Application initialization
 */
export class GameBootstrapper {
  private app: PIXI.Application;
  private containers: GameContainers;

  constructor() {
    // Update screen size first
    updateScreenSize();
    
    // Create PIXI application
    this.app = this.createApplication();
    
    // Setup containers
    this.containers = this.createContainers();
    
    // Add containers to stage
    this.setupStage();
    
    // Setup resize handler
    this.setupResizeHandler();
  }

  private createApplication(): PIXI.Application {
    const app = new PIXI.Application({
      width: GameConfig.screen.width,
      height: GameConfig.screen.height,
      backgroundColor: 0x000000,
      antialias: true,
      resizeTo: window,
    });

    // CRITICAL FIX: Limit FPS to 60 instead of unlimited
    app.ticker.maxFPS = 60;
    app.ticker.minFPS = 30; // Minimum FPS to maintain smooth gameplay

    // Add to DOM
    document.body.appendChild(app.view as HTMLCanvasElement);
    
    // Expose app globally for FPS settings
    (window as any).app = app;
    
    return app;
  }

  private createContainers(): GameContainers {
    return {
      backgroundContainer: new PIXI.Container(),
      gameContainer: new PIXI.Container(),
      uiContainer: new PIXI.Container()
    };
  }

  private setupStage(): void {
    this.app.stage.addChild(this.containers.backgroundContainer);
    this.app.stage.addChild(this.containers.gameContainer);
    this.app.stage.addChild(this.containers.uiContainer);
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      updateScreenSize();
      this.app.renderer.resize(GameConfig.screen.width, GameConfig.screen.height);
    });
  }

  // Getters
  public getApp(): PIXI.Application {
    return this.app;
  }

  public getContainers(): GameContainers {
    return this.containers;
  }

  public destroy(): void {
    this.app.destroy(true);
  }
} 