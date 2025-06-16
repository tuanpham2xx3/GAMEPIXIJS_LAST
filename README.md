# PixiJS Game Project

A game project using PixiJS v7, Howler.js, GSAP, and Vite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Technologies Used

- PixiJS v7 - 2D WebGL renderer
- Howler.js - Audio library
- GSAP - Animation library
- Vite - Build tool
- TypeScript - Type safety

## Project Structure

```
/
├── src/                    # Source files
│   ├── main.ts            # Main game entry point
│   └── AssetManager.ts    # Asset loading and management
├── public/                # Static assets (served directly)
├── dist/                 # Build output (after npm run build)
└── assets/               # Game assets (organized structure)
    └── textures/
        ├── animations/           # Animation frames
        ├── backgrounds/          # Background images
        ├── characters/
        │   ├── player/          # Player sprites
        │   └── enemies/         # Enemy sprites (organized by type)
        │       ├── basic/
        │       ├── diver/
        │       ├── green/
        │       ├── inferior/
        │       ├── na/
        │       ├── saturation/
        │       └── soldier/
        ├── effects/             # Visual effects
        ├── projectiles/         # Bullets and projectiles
        ├── ui/                  # User interface elements
        │   ├── buttons/
        │   ├── icons/
        │   └── collectibles/
        │       └── coins/
        └── misc/               # Miscellaneous sprites
```

## Texture Packer Integration

The project includes full Texture Packer support for optimal sprite management:

### Setup Process:
1. Install Texture Packer from https://www.codeandweb.com/texturepacker
2. Create sprite sheets for different categories:
   - **Enemies**: All enemy sprites → `assets/spritesheets/enemies.json/.png`
   - **UI**: All UI elements → `assets/spritesheets/ui.json/.png`
   - **Effects**: All effects → `assets/spritesheets/effects.json/.png`
   - **Animations**: All animation frames → `assets/spritesheets/animations.json/.png`

### Recommended Settings:
- Data Format: JSON (Hash)
- Texture Format: PNG
- Algorithm: MaxRects
- Trim Mode: Trim
- Size Constraints: POT (Power of Two)

### Usage in Code:
```typescript
import { SpriteSheetManager } from './SpriteSheetManager';

const sheetManager = SpriteSheetManager.getInstance();
await sheetManager.loadPredefinedSheets();

// Get texture from sprite sheet
const enemyTexture = sheetManager.getTexture('enemies', 'enemy_diver_body');

// Get animation frames
const walkFrames = sheetManager.getAnimationFrames('animations', 'enemy1_walk');
```

## Using AssetManager

The project includes a powerful AssetManager class to handle asset loading:

```typescript
import { AssetManager } from './AssetManager';

// Get singleton instance
const assetManager = AssetManager.getInstance();

// Preload essential assets
await assetManager.preloadEssentialAssets();

// Load specific textures
const playerTexture = await assetManager.loadTexture('/assets/textures/characters/player/ship_phoenix_dark.png');

// Load enemy animations
const enemy1Frames = await assetManager.loadEnemyAnimations(1);

// Load coin textures
const coinTextures = await assetManager.loadCoins();

// Load enemy parts
const diverParts = await assetManager.loadEnemyParts('diver');

// Get cached texture
const cachedTexture = assetManager.getTexture('playerShip');
```

## Development Notes

- Assets are automatically organized into logical directories
- Use AssetManager for efficient asset loading and caching
- All textures are cached to avoid duplicate loading
- Use TypeScript for better type safety and development experience
- The development server runs on `http://localhost:3000` 