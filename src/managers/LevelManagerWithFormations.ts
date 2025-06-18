import { EnemyManager } from './EnemyManager';
import { FormationManager } from './FormationManager';
import { LevelConfig, EnemyType } from '../types/EntityTypes';

export class LevelManagerWithFormations {
    private enemyManager: EnemyManager;
    private formationManager: FormationManager;
    private currentLevel: number;
    private levelStartTime: number;
    private isLevelActive: boolean;
    private levelCompleteCallback?: () => void;
    private useFormations: boolean = true;

    // Fallback to old system if formations not available
    private static readonly LEVEL_CONFIGS: LevelConfig[] = [
        {
            level: 1,
            enemies: [
                { type: 'inferior', count: 8, spawnDelay: 2, spawnStartDelay: 1 },
                { type: 'diver', count: 4, spawnDelay: 5, spawnStartDelay: 10 }
            ],
            duration: 45
        },
        {
            level: 2,
            enemies: [
                { type: 'inferior', count: 10, spawnDelay: 1.8, spawnStartDelay: 1 },
                { type: 'green', count: 5, spawnDelay: 4, spawnStartDelay: 8 },
                { type: 'diver', count: 3, spawnDelay: 6, spawnStartDelay: 15 }
            ],
            duration: 60
        },
        {
            level: 3,
            enemies: [
                { type: 'green', count: 10, spawnDelay: 2.5, spawnStartDelay: 1 },
                { type: 'diver', count: 8, spawnDelay: 4, spawnStartDelay: 10 },
                { type: 'soldier', count: 3, spawnDelay: 8, spawnStartDelay: 25 }
            ],
            duration: 80
        }
    ];

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
        this.formationManager = new FormationManager(enemyManager);
        this.currentLevel = 0;
        this.levelStartTime = 0;
        this.isLevelActive = false;
        
        // Try to load formations
        this.initializeFormations();
    }

    private async initializeFormations(): Promise<void> {
        const loaded = await this.formationManager.loadFormations();
        if (!loaded) {
            console.warn('Formation data not loaded, falling back to original spawn system');
            this.useFormations = false;
        } else {
            console.log('Formation system initialized successfully');
            console.log('Available formations:', this.formationManager.getFormationNames());
            console.log('Available levels:', this.formationManager.getLevelNames());
        }
    }

    public async startLevel(level: number): Promise<boolean> {
        if (this.useFormations) {
            return this.startFormationLevel(level);
        } else {
            return this.startClassicLevel(level);
        }
    }

    private async startFormationLevel(level: number): Promise<boolean> {
        const levelId = `level_${level}`;
        const success = this.formationManager.startLevel(levelId);
        
        if (success) {
            this.currentLevel = level;
            this.levelStartTime = Date.now();
            this.isLevelActive = true;
            console.log(`Formation level ${level} started`);
            return true;
        } else {
            console.warn(`Formation level ${level} not found, falling back to classic`);
            this.useFormations = false;
            return this.startClassicLevel(level);
        }
    }

    private startClassicLevel(level: number): boolean {
        if (level < 1 || level > LevelManagerWithFormations.LEVEL_CONFIGS.length) {
            console.error(`Invalid level: ${level}`);
            return false;
        }

        this.currentLevel = level;
        this.levelStartTime = Date.now();
        this.isLevelActive = true;
        console.log(`Classic level ${level} started`);
        return true;
    }

    public update(deltaTime: number): void {
        if (!this.isLevelActive) return;

        if (this.useFormations) {
            this.formationManager.update(deltaTime);
            
            // Check if formation level is complete
            if (this.formationManager.isLevelComplete() && this.enemyManager.getActiveEnemyCount() === 0) {
                this.completeLevel();
            }
        } else {
            // Classic update logic would go here
            // For now, just implement basic completion check
            const currentTime = (Date.now() - this.levelStartTime) / 1000;
            if (currentTime >= 60) { // Simple time-based completion
                this.completeLevel();
            }
        }
    }

    private completeLevel(): void {
        this.isLevelActive = false;
        console.log(`Level ${this.currentLevel} completed!`);
        
        if (this.levelCompleteCallback) {
            this.levelCompleteCallback();
        }
    }

    public nextLevel(): boolean {
        const nextLevelNumber = this.currentLevel + 1;
        
        if (this.useFormations) {
            const availableLevels = this.formationManager.getLevelNames();
            const nextLevelId = `level_${nextLevelNumber}`;
            
            if (availableLevels.includes(nextLevelId)) {
                this.startLevel(nextLevelNumber);
                return true;
            }
        } else {
            if (nextLevelNumber <= LevelManagerWithFormations.LEVEL_CONFIGS.length) {
                return this.startLevel(nextLevelNumber);
            }
        }
        
        return false; // No more levels
    }

    public restartCurrentLevel(): boolean {
        if (this.currentLevel > 0) {
            this.enemyManager.clearAllEnemies();
            return this.startLevel(this.currentLevel);
        }
        return false;
    }

    // Manual formation testing methods
    public async testFormation(formationId: string): Promise<void> {
        if (this.useFormations) {
            await this.formationManager.spawnFormation(formationId);
        } else {
            console.warn('Formations not available');
        }
    }

    public getAvailableFormations(): string[] {
        return this.useFormations ? this.formationManager.getFormationNames() : [];
    }

    public getAvailableLevels(): string[] {
        return this.useFormations ? this.formationManager.getLevelNames() : [];
    }

    // Progress tracking
    public getCurrentWave(): number {
        return this.useFormations ? this.formationManager.getCurrentWave() : 0;
    }

    public getTotalWaves(): number {
        return this.useFormations ? this.formationManager.getTotalWaves() : 0;
    }

    public getWaveProgress(): string {
        if (this.useFormations) {
            const current = this.getCurrentWave();
            const total = this.getTotalWaves();
            return `Wave ${current}/${total}`;
        }
        return 'Classic Mode';
    }

    // Standard getters
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    public isActive(): boolean {
        return this.isLevelActive;
    }

    public isUsingFormations(): boolean {
        return this.useFormations;
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