import { EnemyManager } from './EnemyManager';
import { LevelConfig, EnemyType } from '../types/EntityTypes';
import { GameConfig } from '../core/Config';

export class LevelManager {
    private enemyManager: EnemyManager;
    private currentLevel: number;
    private levelStartTime: number;
    private levelConfig: LevelConfig | null;
    private spawnTimers: Map<EnemyType, number>;
    private spawnCounts: Map<EnemyType, number>;
    private isLevelActive: boolean;
    private levelCompleteCallback?: () => void;

    // Static level configurations
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
                { type: 'inferior', count: 12, spawnDelay: 1.5, spawnStartDelay: 1 },
                { type: 'green', count: 8, spawnDelay: 3, spawnStartDelay: 5 },
                { type: 'na', count: 4, spawnDelay: 7, spawnStartDelay: 20 }
            ],
            duration: 70
        },
        {
            level: 4,
            enemies: [
                { type: 'green', count: 10, spawnDelay: 2.5, spawnStartDelay: 1 },
                { type: 'diver', count: 8, spawnDelay: 4, spawnStartDelay: 10 },
                { type: 'soldier', count: 3, spawnDelay: 8, spawnStartDelay: 25 },
                { type: 'na', count: 6, spawnDelay: 5, spawnStartDelay: 15 }
            ],
            duration: 80
        },
        {
            level: 5,
            enemies: [
                { type: 'soldier', count: 6, spawnDelay: 6, spawnStartDelay: 1 },
                { type: 'green', count: 12, spawnDelay: 2, spawnStartDelay: 5 },
                { type: 'diver', count: 10, spawnDelay: 3, spawnStartDelay: 10 },
                { type: 'na', count: 8, spawnDelay: 4, spawnStartDelay: 20 }
            ],
            duration: 90
        },
        {
            level: 6,
            enemies: [
                { type: 'boss', count: 1, spawnDelay: 0, spawnStartDelay: 5 }
            ],
            duration: 120,
            isBossLevel: true
        }
    ];

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
        this.currentLevel = 0;
        this.levelStartTime = 0;
        this.levelConfig = null;
        this.spawnTimers = new Map();
        this.spawnCounts = new Map();
        this.isLevelActive = false;
    }

    public startLevel(level: number): boolean {
        if (level < 1 || level > LevelManager.LEVEL_CONFIGS.length) {
            console.error(`Invalid level: ${level}`);
            return false;
        }

        this.currentLevel = level;
        this.levelConfig = LevelManager.LEVEL_CONFIGS[level - 1];
        this.levelStartTime = Date.now();
        this.isLevelActive = true;

        // Initialize spawn timers and counters
        this.spawnTimers.clear();
        this.spawnCounts.clear();

        for (const enemyConfig of this.levelConfig.enemies) {
            this.spawnTimers.set(enemyConfig.type, enemyConfig.spawnStartDelay || 0);
            this.spawnCounts.set(enemyConfig.type, 0);
        }

        console.log(`Level ${level} started`);
        return true;
    }

    public update(deltaTime: number): void {
        if (!this.isLevelActive || !this.levelConfig) return;

        const currentTime = (Date.now() - this.levelStartTime) / 1000;

        // Update spawn timers and spawn enemies
        for (const enemyConfig of this.levelConfig.enemies) {
            const currentTimer = this.spawnTimers.get(enemyConfig.type) || 0;
            const currentCount = this.spawnCounts.get(enemyConfig.type) || 0;

            // Update timer
            const newTimer = currentTimer - deltaTime;
            this.spawnTimers.set(enemyConfig.type, newTimer);

            // Check if it's time to spawn and we haven't reached the limit
            if (newTimer <= 0 && currentCount < enemyConfig.count) {
                this.spawnEnemy(enemyConfig.type);
                this.spawnCounts.set(enemyConfig.type, currentCount + 1);
                this.spawnTimers.set(enemyConfig.type, enemyConfig.spawnDelay);
            }
        }

        // Check level completion
        if (this.isLevelComplete()) {
            this.completeLevel();
        }
    }

    private async spawnEnemy(type: EnemyType): Promise<void> {
        try {
            const enemy = await this.enemyManager.spawnEnemyAtRandomX(type);
            if (enemy) {
                console.log(`Spawned ${type} enemy`);
            }
        } catch (error) {
            console.error(`Failed to spawn ${type} enemy:`, error);
        }
    }

    private isLevelComplete(): boolean {
        if (!this.levelConfig) return false;

        const currentTime = (Date.now() - this.levelStartTime) / 1000;
        
        // For boss levels, check if boss is defeated
        if (this.levelConfig.isBossLevel) {
            const bossCount = this.enemyManager.getEnemyCountByType('boss');
            return bossCount === 0 && this.getAllEnemiesSpawned();
        }

        // For normal levels, check if time is up and all enemies are cleared
        const timeUp = currentTime >= this.levelConfig.duration;
        const allEnemiesSpawned = this.getAllEnemiesSpawned();
        const noActiveEnemies = this.enemyManager.getActiveEnemyCount() === 0;

        return timeUp && allEnemiesSpawned && noActiveEnemies;
    }

    private getAllEnemiesSpawned(): boolean {
        if (!this.levelConfig) return false;

        for (const enemyConfig of this.levelConfig.enemies) {
            const spawnedCount = this.spawnCounts.get(enemyConfig.type) || 0;
            if (spawnedCount < enemyConfig.count) {
                return false;
            }
        }
        return true;
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
        if (nextLevelNumber <= LevelManager.LEVEL_CONFIGS.length) {
            return this.startLevel(nextLevelNumber);
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

    public pauseLevel(): void {
        this.isLevelActive = false;
    }

    public resumeLevel(): void {
        if (this.levelConfig) {
            this.isLevelActive = true;
            // Adjust start time to account for pause duration
            this.levelStartTime = Date.now() - this.getLevelElapsedTime() * 1000;
        }
    }

    public stopLevel(): void {
        this.isLevelActive = false;
        this.enemyManager.clearAllEnemies();
        this.currentLevel = 0;
        this.levelConfig = null;
    }

    // Getters
    public getCurrentLevel(): number {
        return this.currentLevel;
    }

    public isActive(): boolean {
        return this.isLevelActive;
    }

    public getLevelElapsedTime(): number {
        if (!this.isLevelActive) return 0;
        return (Date.now() - this.levelStartTime) / 1000;
    }

    public getLevelProgress(): number {
        if (!this.levelConfig) return 0;
        const elapsed = this.getLevelElapsedTime();
        return Math.min(elapsed / this.levelConfig.duration, 1);
    }

    public getRemainingTime(): number {
        if (!this.levelConfig) return 0;
        const elapsed = this.getLevelElapsedTime();
        return Math.max(this.levelConfig.duration - elapsed, 0);
    }

    public isBossLevel(): boolean {
        return this.levelConfig?.isBossLevel || false;
    }

    public getTotalLevels(): number {
        return LevelManager.LEVEL_CONFIGS.length;
    }

    public getLevelSpawnStatus(): { [key: string]: { spawned: number; total: number } } {
        const status: { [key: string]: { spawned: number; total: number } } = {};
        
        if (this.levelConfig) {
            for (const enemyConfig of this.levelConfig.enemies) {
                const spawned = this.spawnCounts.get(enemyConfig.type) || 0;
                status[enemyConfig.type] = {
                    spawned,
                    total: enemyConfig.count
                };
            }
        }
        
        return status;
    }

    public setLevelCompleteCallback(callback: () => void): void {
        this.levelCompleteCallback = callback;
    }
} 