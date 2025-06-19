import { EnemyManager } from './EnemyManager';
import { FormationManager } from './FormationManager';

export class LevelManager {
    private enemyManager: EnemyManager;
    private formationManager: FormationManager;
    private currentLevel: number = 0;
    private isLevelActive: boolean = false;
    private isInitialized: boolean = false;

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
        this.formationManager = new FormationManager(enemyManager);
    }

    /**
     * Initialize formations - must be called after constructor
     */
    public async initialize(): Promise<void> {
        const loaded = await this.formationManager.loadFormations();
        this.isInitialized = true;
        
        if (!loaded) {
            console.warn('⚠️ Formation data failed to load! Using default formations.');
        }
        
        console.log('✅ Simple Level Manager initialized');
    }

    /**
     * Start a level by number
     */
    public startLevel(levelNumber: number): boolean {
        if (!this.isInitialized) {
            console.error('❌ Manager not initialized! Call initialize() first.');
            return false;
        }
        
        const levelId = `level_${levelNumber}`;
        
        if (!this.formationManager.getLevelNames().includes(levelId)) {
            console.error(`❌ Level ${levelNumber} not found`);
            return false;
        }

        this.currentLevel = levelNumber;
        this.isLevelActive = true;
        
        console.log(`🎮 Starting Level ${levelNumber}`);
        return this.formationManager.startLevel(levelId);
    }

    /**
     * Update - simple state checking
     */
    public update(deltaTime: number): void {
        if (!this.isLevelActive) return;

        // Update formation manager
        this.formationManager.update(deltaTime);

        // Check if level is complete
        if (this.formationManager.isLevelComplete()) {
            this.completeLevel();
        }
    }

    /**
     * Complete current level
     */
    private completeLevel(): void {
        this.isLevelActive = false;
        console.log(`🎉 Level ${this.currentLevel} completed!`);
    }

    /**
     * Test formation for development
     */
    public testFormation(formationId: string): void {
        console.log(`🧪 Testing formation: ${formationId}`);
        this.formationManager.testFormation(formationId);
    }

    // Simple getters - no callbacks needed
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    public isActive(): boolean {
        return this.isLevelActive;
    }

    public isLevelComplete(): boolean {
        return !this.isLevelActive && this.currentLevel > 0;
    }

    public getCurrentWave(): number {
        return this.formationManager.getCurrentWave();
    }

    public getTotalWaves(): number {
        return this.formationManager.getTotalWaves();
    }

    public getAvailableFormations(): string[] {
        return this.formationManager.getFormationNames();
    }

    public getAvailableLevels(): string[] {
        return this.formationManager.getLevelNames();
    }

    public stop(): void {
        this.isLevelActive = false;
        this.formationManager.stop();
        console.log('⏹️ Level manager stopped');
    }

    // Additional methods for compatibility with existing code
    public getLevelElapsedTime(): number {
        // Simple implementation - could track time if needed
        return 0;
    }

    public getWaveProgress(): string {
        return `Wave ${this.getCurrentWave()}/${this.getTotalWaves()}`;
    }

    public nextLevel(): void {
        const nextLevelNumber = this.currentLevel + 1;
        if (this.startLevel(nextLevelNumber)) {
            console.log(`🚀 Advanced to level ${nextLevelNumber}`);
        } else {
            console.log('🎉 Game completed! No more levels available.');
        }
    }

    public stopLevel(): void {
        this.stop();
    }

    public isUsingFormations(): boolean {
        return true; // Simple system always uses formations
    }

    public restartCurrentLevel(): void {
        if (this.currentLevel > 0) {
            this.startLevel(this.currentLevel);
        }
    }

    public forceCompleteLevel(): void {
        if (this.isLevelActive) {
            this.completeLevel();
        }
    }

    public getDebugStatus(): any {
        return {
            currentLevel: this.currentLevel,
            isLevelActive: this.isLevelActive,
            currentWave: this.getCurrentWave(),
            totalWaves: this.getTotalWaves(),
            waveProgress: this.getWaveProgress(),
            isFormationActive: this.formationManager.isLevelActive(),
            availableFormations: this.getAvailableFormations(),
            availableLevels: this.getAvailableLevels()
        };
    }
} 