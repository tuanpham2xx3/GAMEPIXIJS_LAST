import { PlayerConfig, BulletConfig, EnemyConfig, EnemyType } from "../types/EntityTypes";

export const GameConfig = {
    // Reference resolution - kích thước màn hình chuẩn để tính toán vị trí
    referenceResolution: {
        width: 800,
        height: 600
    },

    // Screen configuration - set dynamically to window size
    screen: {
        width: window.innerWidth,
        height: window.innerHeight
    },

    // Scale factors - được tính tự động dựa trên reference resolution
    scale: {
        x: 1,
        y: 1,
        uniform: 1 // Scale đồng nhất (lấy min của x, y để giữ aspect ratio)
    },

    //Player configuration
    player: {
        speed: 400,
        shootingRate: 5,
        size: { width: 64, height: 64},
        startPosition: {x: 400, y: 500}, // Sẽ được scale theo màn hình
        health: 100,
        maxHealth: 100
    } as PlayerConfig & {startPosition: {x: number, y: number}; health: number; maxHealth: number},

    //Bullet configuration
    bullet: {
        speed: 500,
        damage: 10,
        size: { width: 8, height: 16}
    } as BulletConfig,

    //Boundaries
    boundaries: {
        padding: 32 // pixels from screen
    },

    //Enemy configuration
    enemies: {
        diver: {
            health: 30,
            speed: 120,
            scoreValue: 100,
            size: { width: 48, height: 48 },
            movementPattern: 'zigzag'
        },
        green: {
            health: 40,
            speed: 100,
            scoreValue: 150,
            size: { width: 52, height: 52 },
            movementPattern: 'sine'
        },
        inferior: {
            health: 20,
            speed: 150,
            scoreValue: 80,
            size: { width: 40, height: 40 },
            movementPattern: 'straight'
        },
        na: {
            health: 25,
            speed: 110,
            scoreValue: 120,
            size: { width: 44, height: 44 },
            movementPattern: 'circular'
        },
        soldier: {
            health: 60,
            speed: 80,
            scoreValue: 200,
            size: { width: 56, height: 56 },
            movementPattern: 'straight'
        },
        boss: {
            health: 500,
            speed: 60,
            scoreValue: 1000,
            size: { width: 240, height: 240 },
            movementPattern: 'boss'
        }
    } as Record<EnemyType, EnemyConfig>,

    //Performance
    maxBullets: 50,
    maxEnemies: 30,

    //Background scrolling
    background: {
        scrollSpeed: 100, //pixel per second
        src: 'assets/textures/backgrounds/bg.jpg'
    },

    //Debug
    debug: true,

    // Collision Configuration
    collision: {
        // Global collision settings
        enabled: true,
        maxChecksPerFrame: 100,
        
        // Default damage values
        defaultDamage: {
            player: 20,
            playerBullet: 25,
            enemy: 20,
            enemyBullet: 15,
            boss: 30,
            bossBullet: 25
        },
        
        // Score values when destroying entities
        scoreValues: {
            inferior: 80,
            diver: 100,
            green: 150,
            na: 120,
            soldier: 200,
            boss: 1000
        }
    },

    // Input Configuration
    input: {
    }
};

//Function to update screen size and scaling
export const updateScreenSize = () => {
    const oldWidth = GameConfig.screen.width;
    const oldHeight = GameConfig.screen.height;
    
    GameConfig.screen.width = window.innerWidth;
    GameConfig.screen.height = window.innerHeight;
    
    // Calculate scale factors
    GameConfig.scale.x = GameConfig.screen.width / GameConfig.referenceResolution.width;
    GameConfig.scale.y = GameConfig.screen.height / GameConfig.referenceResolution.height;
    
    // Uniform scale - sử dụng scale nhỏ hơn để đảm bảo không bị crop
    GameConfig.scale.uniform = Math.min(GameConfig.scale.x, GameConfig.scale.y);
    
    // Update player start position theo scale
    const refPlayerX = 400; // Reference position trong resolution 800x600
    const refPlayerY = 500;
    GameConfig.player.startPosition.x = refPlayerX * GameConfig.scale.x;
    GameConfig.player.startPosition.y = refPlayerY * GameConfig.scale.y;
    
    console.log(`Screen updated: ${oldWidth}x${oldHeight} -> ${GameConfig.screen.width}x${GameConfig.screen.height}`);
    console.log(`Scale factors: x=${GameConfig.scale.x.toFixed(2)}, y=${GameConfig.scale.y.toFixed(2)}, uniform=${GameConfig.scale.uniform.toFixed(2)}`);
};

/**
 * Convert reference position to screen position
 */
export const scalePosition = (refX: number, refY: number) => {
    return {
        x: refX * GameConfig.scale.x,
        y: refY * GameConfig.scale.y
    };
};

/**
 * Convert reference position to screen position with uniform scaling
 */
export const scalePositionUniform = (refX: number, refY: number) => {
    return {
        x: refX * GameConfig.scale.uniform,
        y: refY * GameConfig.scale.uniform
    };
};

/**
 * Convert screen position back to reference position
 */
export const unscalePosition = (screenX: number, screenY: number) => {
    return {
        x: screenX / GameConfig.scale.x,
        y: screenY / GameConfig.scale.y
    };
};

/**
 * Get scaled boundaries for current screen
 */
export const getScaledBoundaries = () => {
    const { screen, boundaries, player } = GameConfig;
    const scaledPadding = boundaries.padding * GameConfig.scale.uniform;
    const scaledPlayerWidth = player.size.width * GameConfig.scale.uniform;
    const scaledPlayerHeight = player.size.height * GameConfig.scale.uniform;
    
    return {
        left: scaledPadding,
        right: screen.width - scaledPadding - scaledPlayerWidth,
        top: scaledPadding,
        bottom: screen.height - scaledPadding - scaledPlayerHeight
    };
};

//Helper functions for boundaries
export const getBoundaries = () => {
    const { screen, boundaries, player } = GameConfig;
    return {
        left: boundaries.padding,
        right: screen.width - boundaries.padding - player.size.width,
        top: boundaries.padding,
        bottom: screen.height - boundaries.padding - player.size.height
    };
};