export enum GameState {
  LOADING = 'loading',
  MENU = 'menu',
  PLAYING = 'playing',
  PAUSED = 'paused',
  GAME_OVER = 'game_over',
  VICTORY = 'victory'
}

export interface GameSession {
  score: number;
  coins: number;
  level: number;
  playTime: number;
  startTime: number;
}

export interface StateTransition {
  from: GameState;
  to: GameState;
  timestamp: number;
  data?: any;
}

export interface GameStateData {
  currentState: GameState;
  previousState: GameState;
  isPaused: boolean;
  canPause: boolean;
  session: GameSession;
  transitionHistory: StateTransition[];
} 