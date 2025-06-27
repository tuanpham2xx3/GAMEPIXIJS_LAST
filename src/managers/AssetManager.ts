import { Assets, Texture } from 'pixi.js';

export class AssetManager {
    private static instance: AssetManager;
    private loadedTextures: Map<string, Texture> = new Map();

    // Asset paths configuration
    private static readonly ASSET_PATHS = {
        // Essential Game Assets
        PLAYER_SHIP: 'assets/textures/characters/player/ship_phoenix_dark.png',
        BULLET_PHOENIX: 'assets/textures/projectiles/bullet_phoenix.png',
        SMOKE_BLUE: 'assets/textures/effects/smoke_blue.png',
        
        // Animations
        ENEMY_1_ANIMATIONS: 'assets/textures/animations/anim_enemy_1_',
        ENEMY_2_ANIMATIONS: 'assets/textures/animations/anim_enemy_2_',
        HIT_ANIMATION: 'assets/textures/animations/anim_hit.png',
        BOSS_ANIMATION: 'assets/textures/animations/anim_boss.png',

        // Backgrounds
        MAIN_BACKGROUND: 'assets/textures/backgrounds/bg.jpg',
        CIRCLE_BACKGROUND: 'assets/textures/backgrounds/circle.png',

        // Characters - Enemies
        ENEMY_BASIC: 'assets/textures/characters/enemies/basic/',
        ENEMY_DIVER: 'assets/textures/characters/enemies/diver/',
        ENEMY_GREEN: 'assets/textures/characters/enemies/green/',
        ENEMY_INFERIOR: 'assets/textures/characters/enemies/inferior/',
        ENEMY_NA: 'assets/textures/characters/enemies/na/',
        ENEMY_SATURATION: 'assets/textures/characters/enemies/saturation/',
        ENEMY_SOLDIER: 'assets/textures/characters/enemies/soldier/',

        // Effects
        EFFECTS: 'assets/textures/effects/',

        // Projectiles
        BULLET_ENEMY: 'assets/textures/projectiles/bullet_enemy.png',
        BULLET_GREEN: 'assets/textures/projectiles/bullet_green.png',

        // UI
        UI_BUTTONS: 'assets/textures/ui/buttons/',
        UI_ICONS: 'assets/textures/ui/icons/',
        UI_COINS: 'assets/textures/ui/collectibles/coins/',
        UI_COLLECTIBLES: 'assets/textures/ui/collectibles/',

        // Misc
        MISC: 'assets/textures/misc/'
    };

    public static get paths() {
        return this.ASSET_PATHS;
    }

    private constructor() {
        // AssetManager initialized
    }

    public static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    /**
     * Load essential game assets (player, bullet, smoke)
     */
    public async loadEssentialGameAssets(): Promise<{
        player: Texture;
        bullet: Texture;
        smoke: Texture;
        background: Texture;
    }> {
        const essentialAssets = [
            { alias: 'player', src: AssetManager.ASSET_PATHS.PLAYER_SHIP },
            { alias: 'bullet', src: AssetManager.ASSET_PATHS.BULLET_PHOENIX },
            { alias: 'smoke', src: AssetManager.ASSET_PATHS.SMOKE_BLUE },
            { alias: 'background', src: AssetManager.ASSET_PATHS.MAIN_BACKGROUND }
        ];

        try {
            await Assets.load(essentialAssets);
            
            const result = {
                player: Assets.get('player'),
                bullet: Assets.get('bullet'),
                smoke: Assets.get('smoke'),
                background: Assets.get('background')
            };

            // Cache textures
            this.loadedTextures.set('player', result.player);
            this.loadedTextures.set('bullet', result.bullet);
            this.loadedTextures.set('smoke', result.smoke);
            this.loadedTextures.set('background', result.background);

            return result;

        } catch (error) {
            console.error('Failed to load essential assets:', error);
            throw error;
        }
    }

    /**
     * Load animation assets
     */
    public async loadAnimationAssets(): Promise<void> {
        const animationAssets = [
            { alias: 'hitAnimation', src: AssetManager.ASSET_PATHS.HIT_ANIMATION },
            { alias: 'bossAnimation', src: AssetManager.ASSET_PATHS.BOSS_ANIMATION },
        ];

        try {
            await Assets.load(animationAssets);
            
            animationAssets.forEach(asset => {
                this.loadedTextures.set(asset.alias, Assets.get(asset.alias));
            });

        } catch (error) {
            console.error('Failed to load animation assets:', error);
            throw error;
        }
    }

    /**
     * Create fallback textures
     */
    public createFallbackTextures(): {
        player: Texture;
        bullet: Texture;
        smoke: Texture;
    } {
        return {
            player: this.createColorTexture(0x00ff88, 64, 64), // Green player
            bullet: this.createColorTexture(0xffff00, 8, 16),  // Yellow bullet
            smoke: this.createColorTexture(0x4444ff, 16, 16)   // Blue smoke
        };
    }

    private createColorTexture(color: number, width: number, height: number): Texture {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, width, height);
        
        return Texture.from(canvas);
    }

    /**
     * Load a single texture
     */
    public async loadTexture(path: string, alias?: string): Promise<Texture> {
        const key = alias || path;
        
        if (this.loadedTextures.has(key)) {
            return this.loadedTextures.get(key)!;
        }

        try {
            const texture = await Assets.load(path);
            this.loadedTextures.set(key, texture);
            return texture;
        } catch (error) {
            console.error(`Failed to load texture: ${path}`, error);
            throw error;
        }
    }

    /**
     * Load enemy animation frames
     */
    public async loadEnemyAnimations(enemyType: 1 | 2): Promise<Texture[]> {
        const basePath = enemyType === 1 ? 
            AssetManager.ASSET_PATHS.ENEMY_1_ANIMATIONS : 
            AssetManager.ASSET_PATHS.ENEMY_2_ANIMATIONS;

        const frameCount = enemyType === 1 ? 20 : 13;
        const startIndex = enemyType === 1 ? 0 : 1;
        
        const promises: Promise<Texture>[] = [];
        
        for (let i = startIndex; i < startIndex + frameCount; i++) {
            const path = `${basePath}${i}.png`;
            promises.push(this.loadTexture(path));
        }

        return Promise.all(promises);
    }

    /**
     * Load coin textures
     */
    public async loadCoins(): Promise<Texture[]> {
        const promises: Promise<Texture>[] = [];
        
        for (let i = 1; i <= 6; i++) {
            const path = `${AssetManager.ASSET_PATHS.UI_COINS}coin_${i}.png`;
            promises.push(this.loadTexture(path));
        }

        return Promise.all(promises);
    }

    /**
     * Get cached texture
     */
    public getTexture(key: string): Texture | null {
        return this.loadedTextures.get(key) || null;
    }

    /**
     * Clear texture cache
     */
    public clearCache(): void {
        this.loadedTextures.clear();
    }
} 