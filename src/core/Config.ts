import { PlayerConfig, BulletConfig, EnemyConfig, EnemyType } from "../types/EntityTypes";

export const GameConfig = {
    // Screen configuration - set dynamically to windown size
    screen: {
        width: window.innerWidth,
        height: window.innerHeight
    },

    //Player configuration
    player: {
        speed: 400,
        shootingRate: 5,
        size: { width: 64, height: 64},
        startPosition: {x: 400, y: 500},
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

//Function to update screen size
export const updateScreenSize = () => {
    GameConfig.screen.width = window.innerWidth;
    GameConfig.screen.height = window.innerHeight;
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