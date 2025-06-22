import * as PIXI from 'pixi.js';

export interface MenuButton {
  text: string;
  key: string;
  action: () => void;
  visible: boolean;
}

export interface MenuConfig {
  title: string;
  buttons: MenuButton[];
  showBackground: boolean;
  context: MenuContext;
}

export type MenuContext = 'menu' | 'pause' | 'settings';

export interface MenuButtonSprite {
  sprite: PIXI.Text;
  button: MenuButton;
  index: number;
} 