import { Assets, Texture } from 'pixi.js';

export class AssetManager {
    private static instance: AssetManager;
    private loadedTextures: Map<string, Texture> = new Map();

    // ✅ Fix asset paths - bỏ leading slash
    private static readonly ASSET_PATHS = {
        // Animations
        ENEMY_1_ANIMATIONS: 'assets/textures/animations/anim_enemy_1_',
        ENEMY_2_ANIMATIONS: 'assets/textures/animations/anim_enemy_2_',
        HIT_ANIMATION: 'assets/textures/animations/anim_hit.png',
        BOSS_ANIMATION: 'assets/textures/animations/anim_boss.png',

        // Backgrounds
        MAIN_BACKGROUND: 'assets/textures/backgrounds/bg.jpg',
        CIRCLE_BACKGROUND: 'assets/textures/backgrounds/circle.png',

        // Characters - Player
        PLAYER_SHIP: 'assets/textures/characters/player/ship_phoenix_dark.png',

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
        BULLET_PHOENIX: 'assets/textures/projectiles/bullet_phoenix.png',

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
        console.log('📦 Initializing AssetManager...');
    }

    public static getInstance(): AssetManager {
        if (!AssetManager.instance) {
            console.log('🆕 Creating new AssetManager instance...');
            AssetManager.instance = new AssetManager();
        }
        return AssetManager.instance;
    }

    /**
     * Load a single texture
     */
    public async loadTexture(path: string, alias?: string): Promise<Texture> {
        console.log(`🖼️ Loading texture: ${path}`);
        const key = alias || path;
        
        if (this.loadedTextures.has(key)) {
            console.log(`✅ Texture already loaded: ${key}`);
            return this.loadedTextures.get(key)!;
        }

        try {
            const texture = await Assets.load(path);
            this.loadedTextures.set(key, texture);
            console.log(`✅ Texture loaded successfully: ${key}`);
            return texture;
        } catch (error) {
            console.error(`❌ Failed to load texture: ${path}`, error);
            throw error;
        }
    }

    /**
     * Load multiple textures
     */
    public async loadTextures(paths: { [key: string]: string }): Promise<{ [key: string]: Texture }> {
        const promises = Object.entries(paths).map(async ([key, path]) => {
            const texture = await this.loadTexture(path, key);
            return { key, texture };
        });

        const results = await Promise.all(promises);
        const textureMap: { [key: string]: Texture } = {};
        
        results.forEach(({ key, texture }) => {
            textureMap[key] = texture;
        });

        return textureMap;
    }

    /**
     * Load enemy animation frames
     */
    public async loadEnemyAnimations(enemyType: 1 | 2): Promise<Texture[]> {
        const basePath = enemyType === 1 ? 
            AssetManager.ASSET_PATHS.ENEMY_1_ANIMATIONS : 
            AssetManager.ASSET_PATHS.ENEMY_2_ANIMATIONS;

        const frameCount = enemyType === 1 ? 20 : 13; // enemy_1 has 0-19, enemy_2 has 1-13
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
     * Load all enemy parts for a specific enemy type
     */
    public async loadEnemyParts(enemyType: 'diver' | 'green' | 'inferior' | 'na' | 'saturation' | 'soldier'): Promise<{ [key: string]: Texture }> {
        const basePath = AssetManager.ASSET_PATHS[`ENEMY_${enemyType.toUpperCase()}` as keyof typeof AssetManager.ASSET_PATHS];
        
        // Common parts for most enemies
        const commonParts = ['body'];
        let specificParts: string[] = [];

        switch (enemyType) {
            case 'diver':
                specificParts = ['leg_l', 'leg_r', 'wing_l', 'wing_r'];
                break;
            case 'green':
                specificParts = ['leg_l', 'leg_r', 'wing_l', 'wing_r'];
                break;
            case 'inferior':
                specificParts = ['wing_l', 'wing_r'];
                break;
            case 'na':
                specificParts = ['wing_l', 'wing_r'];
                break;
            case 'saturation':
                specificParts = ['wing_l', 'wing_r'];
                break;
            case 'soldier':
                specificParts = ['horn_l', 'horn_r', 'leg_l', 'leg_r', 'leg_1_l', 'leg_1_r'];
                break;
        }

        const allParts = [...commonParts, ...specificParts];
        const texturePaths: { [key: string]: string } = {};

        allParts.forEach(part => {
            texturePaths[part] = `${basePath}enemy_${enemyType}_${part}.png`;
        });

        return this.loadTextures(texturePaths);
    }

    /**
     * Preload essential game assets
     */
    public async preloadEssentialAssets(): Promise<void> {
        console.log('📦 Preloading essential assets...');

        const essentialAssets = {
            playerShip: AssetManager.ASSET_PATHS.PLAYER_SHIP,
            mainBackground: AssetManager.ASSET_PATHS.MAIN_BACKGROUND,
            bulletEnemy: AssetManager.ASSET_PATHS.BULLET_ENEMY,
            bulletGreen: AssetManager.ASSET_PATHS.BULLET_GREEN,
            bulletPhoenix: AssetManager.ASSET_PATHS.BULLET_PHOENIX,
        };

        try {
            await this.loadTextures(essentialAssets);
            console.log('✅ Essential assets loaded successfully!');
        } catch (error) {
            console.error('❌ Failed to load essential assets:', error);
            throw error;
        }
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
        console.log('🗑️ Texture cache cleared');
    }
} 