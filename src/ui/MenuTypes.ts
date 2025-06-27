import * as PIXI from 'pixi.js';

export interface MenuButton {
  text: string;
  key: string;
  action: () => void;
  visible: boolean;
}

export interface VictoryStats {
  score: number;
  coins: number;
  time: string;
}

export interface MenuConfig {
  title: string;
  buttons: MenuButton[];
  showBackground: boolean;
  context: MenuContext;
  stats?: VictoryStats;
}

export type MenuContext = 'menu' | 'pause' | 'settings' | 'victory' | 'game_over';

export interface MenuButtonSprite {
  sprite: PIXI.Text;
  button: MenuButton;
  index: number;
} 