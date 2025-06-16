import { Application, Sprite } from 'pixi.js';
import { gsap } from 'gsap';
import { Howl } from 'howler';
import { AssetManager } from './managers/AssetManager';
import { AssetTest } from './AssetTest';
import { AnimationDemo } from './AnimationDemo';
import { AnimationManager } from './managers/AnimationManager';
import { AudioManager } from './managers/AudioManager';
import { AudioTest } from './AudioTest';
import { Container, Text, TextStyle } from 'pixi.js';

// Create PIXI Application
const app = new Application({
    width: 800,
    height: 600,
    backgroundColor: 0x1099bb,
    antialias: true,
});

// Add canvas to the page
document.body.appendChild(app.view as HTMLCanvasElement);

// Initialize game
async function initGame() {
    try {
        // Get AssetManager instance
        const assetManager = AssetManager.getInstance();
        
        // Preload essential assets
        await assetManager.preloadEssentialAssets();
        
        // Create background
        const backgroundTexture = assetManager.getTexture('mainBackground');
        if (backgroundTexture) {
            const background = new Sprite(backgroundTexture);
            background.width = app.screen.width;
            background.height = app.screen.height;
            app.stage.addChild(background);
        }
        
        // Create player ship
        const playerTexture = assetManager.getTexture('playerShip');
        if (playerTexture) {
            const player = new Sprite(playerTexture);
            player.anchor.set(0.5);
            player.x = app.screen.width / 2;
            player.y = app.screen.height - 100;
            player.scale.set(0.5); // Scale down if too big
            app.stage.addChild(player);
            
            // Animation example with GSAP
            gsap.to(player, {
                x: player.x + 100,
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "power1.inOut"
            });
        }
        
        // Load and display enemy animations
        const enemy1Animations = await assetManager.loadEnemyAnimations(1);
        if (enemy1Animations.length > 0) {
            const enemy = new Sprite(enemy1Animations[0]);
            enemy.anchor.set(0.5);
            enemy.x = 200;
            enemy.y = 200;
            enemy.scale.set(0.8);
            app.stage.addChild(enemy);
            
            // Animate through frames
            let currentFrame = 0;
            setInterval(() => {
                currentFrame = (currentFrame + 1) % enemy1Animations.length;
                enemy.texture = enemy1Animations[currentFrame];
            }, 100);
        }
        
        console.log('Game initialized successfully!');
        
    } catch (error) {
        console.error('Failed to initialize game:', error);
    }
}

// Sound example with Howler
const sound = new Howl({
    src: ['path/to/your/sound.mp3']
});

// Example of playing sound (uncomment when you have a sound file)
// sound.play();

// Start the game
initGame();

// Function to get URL parameters
function getUrlParameter(name: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Khởi tạo demo khi trang web được load
window.onload = async () => {
    console.log('🚀 Window loaded, checking route...');
    
    try {
        // Check URL parameters to determine which demo to load
        const demo = getUrlParameter('demo');
        
        switch (demo) {
            case 'audio':
                console.log('🎵 Loading AudioTest...');
                new AudioTest();
                break;
            case 'animation':
                console.log('🎬 Loading AnimationDemo...');
                new AnimationDemo();
                break;
            case 'asset':
                console.log('📦 Loading AssetTest...');
                new AssetTest();
                break;
            default:
                console.log('🏠 Loading default AnimationDemo...');
                new AnimationDemo();
                break;
        }
        
        console.log('✅ Demo started successfully!');
    } catch (error) {
        console.error('❌ Failed to start demo:', error);
    }
}; 