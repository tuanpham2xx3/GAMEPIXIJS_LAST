import { EnemyManager } from './EnemyManager';
import { FormationManager } from './FormationManager';

export class LevelManagerWithFormations {
    private enemyManager: EnemyManager;
    private formationManager: FormationManager;
    private currentLevel: number;
    private levelStartTime: number;
    private isLevelActive: boolean;
    private levelCompleteCallback?: () => void;

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
        this.formationManager = new FormationManager(enemyManager);
        this.currentLevel = 0;
        this.levelStartTime = 0;
        this.isLevelActive = false;
        
        // Load formations (required)
        this.initializeFormations();
    }

    private async initializeFormations(): Promise<void> {
        const loaded = await this.formationManager.loadFormations();
        if (!loaded) {
            console.error('⚠️ Formation data failed to load! Game cannot start without formations.');
            throw new Error('Formation system is required but failed to initialize');
        } else {
            console.log('✅ Formation system initialized successfully');
            console.log('📋 Available formations:', this.formationManager.getFormationNames());
            console.log('🎮 Available levels:', this.formationManager.getLevelNames());
        }
    }

    public startLevel(level: number): boolean {
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
        if (!this.isLevelActive) return;

        this.formationManager.update(deltaTime);
        
        // Check if formation level is complete
        if (this.formationManager.isLevelComplete() && this.enemyManager.getActiveEnemyCount() === 0) {
            this.completeLevel();
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
        if (this.currentLevel > 0) {
            this.enemyManager.clearAllEnemies();
            return this.startLevel(this.currentLevel);
        }
        return false;
    }

    // Formation testing methods
    public async testFormation(formationId: string): Promise<void> {
        console.log(`🧪 Testing formation: ${formationId}`);
        await this.formationManager.spawnFormation(formationId);
    }

    public getAvailableFormations(): string[] {
        return this.formationManager.getFormationNames();
    }

    public getAvailableLevels(): string[] {
        return this.formationManager.getLevelNames();
    }

    // Progress tracking
    public getCurrentWave(): number {
        return this.formationManager.getCurrentWave();
    }

    public getTotalWaves(): number {
        return this.formationManager.getTotalWaves();
    }

    public getWaveProgress(): string {
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
        return true; // Always using formations now
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
} 