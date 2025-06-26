import { GameState, GameStateData, StateTransition, GameSession } from '../types/GameStateTypes';

export class GameStateManager {
  private static instance: GameStateManager;
  private stateData: GameStateData;
  private stateChangeCallbacks: Map<GameState, Array<(data?: any) => void>> = new Map();
  private pauseCallbacks: Array<(isPaused: boolean) => void> = [];

  private constructor() {
    this.stateData = this.initializeState();
  }

  public static getInstance(): GameStateManager {
    if (!GameStateManager.instance) {
      GameStateManager.instance = new GameStateManager();
    }
    return GameStateManager.instance;
  }

  private initializeState(): GameStateData {
    return {
      currentState: GameState.LOADING,
      previousState: GameState.LOADING,
      isPaused: false,
      canPause: false,
      session: this.createNewSession(),
      transitionHistory: []
    };
  }

  private createNewSession(): GameSession {
    return {
      score: 0,
      coins: 0,
      level: 1,
      playTime: 0,
      startTime: Date.now()
    };
  }

  public changeState(newState: GameState, data?: any): void {
    if (this.stateData.currentState === newState) return;

    const transition: StateTransition = {
      from: this.stateData.currentState,
      to: newState,
      timestamp: Date.now(),
      data
    };

    this.stateData.previousState = this.stateData.currentState;
    this.stateData.currentState = newState;
    this.stateData.transitionHistory.push(transition);

    if (newState === GameState.PLAYING) {
      this.stateData.isPaused = false;
      this.triggerPauseCallbacks(false);
    } else if (newState === GameState.PAUSED) {
      this.stateData.isPaused = true;
      this.triggerPauseCallbacks(true);
    }

    this.updatePauseCapability();
    this.triggerStateChangeCallbacks(newState, data);

    console.log(`State changed: ${transition.from} → ${transition.to}`);
  }

  public pause(): boolean {
    if (!this.canPause()) return false;
    
    this.changeState(GameState.PAUSED);
    return true;
  }

  public resume(): boolean {
    if (this.stateData.currentState !== GameState.PAUSED) return false;
    
    this.changeState(GameState.PLAYING);
    return true;
  }

  public togglePause(): boolean {
    return this.stateData.currentState === GameState.PAUSED ? this.resume() : this.pause();
  }

  public canPause(): boolean {
    return this.stateData.currentState === GameState.PLAYING;
  }

  private updatePauseCapability(): void {
    this.stateData.canPause = this.stateData.currentState === GameState.PLAYING;
  }

  public updateSession(updates: Partial<GameSession>): void {
    this.stateData.session = { ...this.stateData.session, ...updates };
  }

  public resetSession(): void {
    this.stateData.session = this.createNewSession();
  }

  public getCurrentState(): GameState {
    return this.stateData.currentState;
  }

  public isPaused(): boolean {
    return this.stateData.isPaused;
  }

  public isPlaying(): boolean {
    return this.stateData.currentState === GameState.PLAYING && !this.stateData.isPaused;
  }

  public getSession(): GameSession {
    return { ...this.stateData.session };
  }

  public getStateData(): Readonly<GameStateData> {
    return this.stateData;
  }

  public onStateChange(state: GameState, callback: (data?: any) => void): void {
    if (!this.stateChangeCallbacks.has(state)) {
      this.stateChangeCallbacks.set(state, []);
    }
    this.stateChangeCallbacks.get(state)!.push(callback);
  }

  public onPause(callback: (isPaused: boolean) => void): void {
    this.pauseCallbacks.push(callback);
  }

  private triggerStateChangeCallbacks(state: GameState, data?: any): void {
    const callbacks = this.stateChangeCallbacks.get(state);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  private triggerPauseCallbacks(isPaused: boolean): void {
    this.pauseCallbacks.forEach(callback => callback(isPaused));
  }

  public destroy(): void {
    this.stateChangeCallbacks.clear();
    this.pauseCallbacks = [];
  }
} 