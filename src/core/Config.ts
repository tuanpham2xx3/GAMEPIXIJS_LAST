import { PlayerConfig, BulletConfig } from '../types/EntityTypes';

export const GameConfig = {
  // Screen configuration - will be set dynamically to window size
  screen: {
    width: window.innerWidth,
    height: window.innerHeight
  },

  // Player configuration
  player: {
    speed: 400, // pixels per second - optimized for relative movement
    shootingRate: 5, // bullets per second
    size: { width: 64, height: 64 },
    startPosition: { x: 400, y: 500 }
  } as PlayerConfig & { startPosition: { x: number; y: number } },

  // Bullet configuration
  bullet: {
    speed: 500, // pixels per second
    damage: 10,
    size: { width: 8, height: 16 }
  } as BulletConfig,

  // Boundaries
  boundaries: {
    padding: 32 // pixels from screen edge
  },

  // Performance
  maxBullets: 50,
  
  // Background scrolling
  background: {
    scrollSpeed: 100, // pixels per second
    src: 'assets/textures/backgrounds/bg.jpg'
  },
  
  // Debug
  debug: true
};

// Function to update screen size
export const updateScreenSize = () => {
  GameConfig.screen.width = window.innerWidth;
  GameConfig.screen.height = window.innerHeight;
};

// Helper functions for boundaries
export const getBoundaries = () => {
  const { screen, boundaries, player } = GameConfig;
  return {
    left: boundaries.padding,
    right: screen.width - boundaries.padding - player.size.width,
    top: boundaries.padding,
    bottom: screen.height - boundaries.padding - player.size.height
  };
}; 