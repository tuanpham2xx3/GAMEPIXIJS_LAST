import { EnemyManager } from './EnemyManager';
import { FormationManager } from './FormationManager';

export class LevelManager {
    private enemyManager: EnemyManager;
    private formationManager: FormationManager;
    private currentLevel: number;
    private levelStartTime: number;
    private isLevelActive: boolean;
    private levelCompleteCallback?: () => void;
    private isInitialized: boolean = false;

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
        this.formationManager = new FormationManager(enemyManager);
        this.currentLevel = 0;
        this.levelStartTime = 0;
        this.isLevelActive = false;
    }

    /**
     * Initialize the formations - must be called after constructor
     */
    public async initialize(): Promise<boolean> {
        const loaded = await this.formationManager.loadFormations();
        // Always set initialized to true, even if we use default formations
        this.isInitialized = true;
        
        if (!loaded) {
            console.warn('⚠️ Formation data failed to load! Using default formations.');
            console.log('📋 Available formations (default):', this.formationManager.getFormationNames());
            console.log('🎮 Available levels (default):', this.formationManager.getLevelNames());
        } else {
            console.log('✅ Formation system initialized successfully');
            console.log('📋 Available formations:', this.formationManager.getFormationNames());
            console.log('🎮 Available levels:', this.formationManager.getLevelNames());
        }
        
        return true; // Always return true since we have fallback
    }



    public startLevel(level: number): boolean {
        if (!this.isInitialized) {
            console.error('❌ LevelManager not initialized. Call initialize() first.');
            return false;
        }

        const levelId = `level_${level}`;
        const success = this.formationManager.startLevel(levelId);
        
        if (!success) {
            console.error(`❌ Formation level ${level} not found`);
            return false;
        }

        this.currentLevel = level;
        this.levelStartTime = Date.now();
        this.isLevelActive = true;
        console.log(`🚀 Formation level ${level} started`);
        return true;
    }

    public update(deltaTime: number): void {
        if (!this.isLevelActive || !this.isInitialized) return;

        this.formationManager.update(deltaTime);
        
        // Check if formation level is complete
        const isFormationComplete = this.formationManager.isLevelComplete();
        const activeEnemyCount = this.enemyManager.getActiveEnemyCount();
        
        if (isFormationComplete && activeEnemyCount === 0) {
            console.log(`🎉 Level completion conditions met: formationComplete=${isFormationComplete}, activeEnemies=${activeEnemyCount}`);
            this.completeLevel();
        }
        
        // Debug log every few seconds to track progress
        if (Math.floor(Date.now() / 3000) % 5 === 0 && Date.now() % 100 < 20) {
            console.log(`Level status: wave=${this.getCurrentWave()}/${this.getTotalWaves()}, formationComplete=${isFormationComplete}, activeEnemies=${activeEnemyCount}`);
        }
    }

    private completeLevel(): void {
        this.isLevelActive = false;
        console.log(`🎉 Level ${this.currentLevel} completed!`);
        
        if (this.levelCompleteCallback) {
            this.levelCompleteCallback();
        }
    }

    public nextLevel(): boolean {
        if (!this.isInitialized) return false;

        const nextLevelNumber = this.currentLevel + 1;
        const availableLevels = this.formationManager.getLevelNames();
        const nextLevelId = `level_${nextLevelNumber}`;
        
        if (availableLevels.includes(nextLevelId)) {
            return this.startLevel(nextLevelNumber);
        }
        
        console.log(`🏁 No more levels available after level ${this.currentLevel}`);
        return false;
    }

    public restartCurrentLevel(): boolean {
        if (this.currentLevel > 0 && this.isInitialized) {
            this.enemyManager.clearAllEnemies();
            return this.startLevel(this.currentLevel);
        }
        return false;
    }

    // Formation testing methods
    public async testFormation(formationId: string): Promise<void> {
        if (!this.isInitialized) {
            console.error('❌ LevelManager not initialized');
            return;
        }
        console.log(`🧪 Testing formation: ${formationId}`);
        await this.formationManager.spawnFormation(formationId);
    }

    public getAvailableFormations(): string[] {
        if (!this.isInitialized) return [];
        return this.formationManager.getFormationNames();
    }

    public getAvailableLevels(): string[] {
        if (!this.isInitialized) return [];
        return this.formationManager.getLevelNames();
    }

    // Progress tracking
    public getCurrentWave(): number {
        if (!this.isInitialized) return 0;
        return this.formationManager.getCurrentWave();
    }

    public getTotalWaves(): number {
        if (!this.isInitialized) return 0;
        return this.formationManager.getTotalWaves();
    }

    public getWaveProgress(): string {
        if (!this.isInitialized) return 'Wave 0/0';
        const current = this.getCurrentWave();
        const total = this.getTotalWaves();
        return `Wave ${current}/${total}`;
    }

    // Standard getters
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    public isActive(): boolean {
        return this.isLevelActive;
    }

    public isUsingFormations(): boolean {
        return this.isInitialized; // Only true if formations loaded successfully
    }

    public getLevelElapsedTime(): number {
        return this.isLevelActive ? (Date.now() - this.levelStartTime) / 1000 : 0;
    }

    public setLevelCompleteCallback(callback: () => void): void {
        this.levelCompleteCallback = callback;
    }

    // Control methods
    public pauseLevel(): void {
        this.isLevelActive = false;
    }

    public resumeLevel(): void {
        this.isLevelActive = true;
    }

    public stopLevel(): void {
        this.isLevelActive = false;
        this.enemyManager.clearAllEnemies();
    }

    public getInitializationStatus(): boolean {
        return this.isInitialized;
    }

    /**
     * Force complete current level - for debugging
     */
    public forceCompleteLevel(): void {
        console.log('🔧 Force completing current level...');
        this.completeLevel();
    }

    /**
     * Get detailed status for debugging
     */
    public getDebugStatus(): string {
        const formationComplete = this.formationManager.isLevelComplete();
        const activeEnemies = this.enemyManager.getActiveEnemyCount();
        const currentWave = this.getCurrentWave();
        const totalWaves = this.getTotalWaves();
        
        return `Level: ${this.currentLevel}, Wave: ${currentWave}/${totalWaves}, FormationComplete: ${formationComplete}, ActiveEnemies: ${activeEnemies}, LevelActive: ${this.isLevelActive}`;
    }
} 