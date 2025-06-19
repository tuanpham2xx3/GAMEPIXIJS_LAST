import { EnemyManager } from './EnemyManager';
import { EnemyType, Vector2 } from '../types/EntityTypes';
import { scalePosition, GameConfig } from '../core/Config';
import { FORMATIONS_DATA } from '../data/formations';

export interface EnemySpawn {
    type: EnemyType;
    x: number;
    y: number;
    delay: number;
}

export interface Formation {
    name: string;
    enemies: EnemySpawn[];
}

export interface LevelFormation {
    waves: string[];
    waveDelay: number;
}

export interface FormationData {
    formations: { [key: string]: Formation };
    levels?: { [key: string]: LevelFormation };
}

interface PendingSpawn {
    formationId: string;
    spawn: EnemySpawn;
}

export class FormationManager {
    private enemyManager: EnemyManager;
    private formationData: FormationData | null = null;
    private currentWaveIndex: number = 0;
    private currentLevel: string = '';
    private currentLevelData: LevelFormation | null = null;
    private waveTimer: number = 0;
    private spawnTimers: Map<string, number> = new Map();
    private isWaveActive: boolean = false;
    private isLevelActive: boolean = false;
    private pendingSpawns: PendingSpawn[] = [];

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
    }

    /**
     * Load formation data from JSON file
     */
    public async loadFormations(): Promise<boolean> {
        try {
            console.log('Loading enemy formations...');
            
            // First try to use embedded data
            console.log('Using embedded formation data...');
            this.formationData = FORMATIONS_DATA;
            console.log('Formation data loaded from embed:', this.formationData);
            
            // Log available formations
            if (this.formationData?.formations) {
                const formationIds = Object.keys(this.formationData.formations);
                console.log('Available formations:', formationIds);
            }
            
            return true;
        } catch (error) {
            console.error('Failed to load formations:', error);
            this.createDefaultFormations();
            return false;
        }
    }

    /**
     * Create default formations if loading fails
     */
    private createDefaultFormations(): void {
        console.log('Creating default formations...');
        this.formationData = {
            formations: {
                "wave_1": {
                    name: "Simple Infantry Wave",
                    enemies: [
                        { type: "inferior", x: 100, y: -50, delay: 0 },
                        { type: "inferior", x: 250, y: -50, delay: 0.5 },
                        { type: "inferior", x: 400, y: -50, delay: 1.0 },
                        { type: "inferior", x: 550, y: -50, delay: 1.5 },
                        { type: "inferior", x: 700, y: -50, delay: 2.0 }
                    ]
                },
                "wave_2": {
                    name: "V Formation",
                    enemies: [
                        { type: "diver", x: 400, y: -50, delay: 0 },
                        { type: "green", x: 350, y: -100, delay: 0.5 },
                        { type: "green", x: 450, y: -100, delay: 0.5 },
                        { type: "inferior", x: 300, y: -150, delay: 1.0 },
                        { type: "inferior", x: 500, y: -150, delay: 1.0 }
                    ]
                }
            },
            levels: {
                "level_1": {
                    waves: ["wave_1", "wave_2"],
                    waveDelay: 10
                },
                "level_2": {
                    waves: ["wave_1", "wave_2"],
                    waveDelay: 15
                }
            }
        };
        console.log('Default formations created');
    }

    /**
     * Start a level by its ID
     */
    public startLevel(levelId: string): boolean {
        if (!this.formationData || !this.formationData.levels || !this.formationData.levels[levelId]) {
            console.error(`Level ${levelId} not found`);
            return false;
        }

        this.currentLevel = levelId;
        this.currentLevelData = this.formationData.levels[levelId];
        this.currentWaveIndex = 0;
        this.isLevelActive = true;
        this.waveTimer = 0;

        console.log(`Starting level: ${levelId} with ${this.currentLevelData.waves.length} waves`);
        this.startNextWave();
        return true;
    }

    /**
     * Start the next wave in the current level
     */
    private async startNextWave(): Promise<void> {
        if (!this.currentLevelData || this.currentWaveIndex >= this.currentLevelData.waves.length) {
            console.log('All waves completed');
            return;
        }

        const waveId = this.currentLevelData.waves[this.currentWaveIndex];
        console.log(`Starting wave ${this.currentWaveIndex + 1}/${this.currentLevelData.waves.length}: ${waveId}`);
        
        await this.startFormationWave(waveId);
        this.waveTimer = this.currentLevelData.waveDelay;
    }

    /**
     * Start a formation wave với scaled positions
     */
    public async startFormationWave(formationId: string): Promise<void> {
        if (!this.formationData || !this.formationData.formations[formationId]) {
            console.error(`Formation ${formationId} not found`);
            return;
        }

        if (this.isWaveActive) {
            console.warn('A wave is already active');
            return;
        }

        const formation = this.formationData.formations[formationId];
        console.log(`Starting formation wave: ${formation.name}`);

        this.isWaveActive = true;
        this.pendingSpawns = [];
        this.spawnTimers.clear();

        // Schedule all enemies trong formation với scaled positions
        formation.enemies.forEach((spawn, index) => {
            const spawnId = `${formationId}_${index}`;
            
            // Scale position từ reference resolution sang actual screen
            const scaledPosition = scalePosition(spawn.x, spawn.y);
            const scaledSpawn: EnemySpawn = {
                ...spawn,
                x: scaledPosition.x,
                y: scaledPosition.y
            };
            
            this.pendingSpawns.push({
                formationId: spawnId,
                spawn: scaledSpawn
            });
            
            this.spawnTimers.set(spawnId, spawn.delay);
            
            console.log(`Scheduled ${spawn.type} at reference(${spawn.x}, ${spawn.y}) -> scaled(${scaledPosition.x.toFixed(1)}, ${scaledPosition.y.toFixed(1)}) with delay ${spawn.delay}s`);
        });
    }

    /**
     * Update spawn timers và spawn enemies khi ready
     */
    public update(deltaTime: number): void {
        if (!this.isLevelActive) return;

        // Update wave timer
        if (this.waveTimer > 0) {
            this.waveTimer -= deltaTime;
        }

        if (this.isWaveActive) {
            this.updateSpawnTimers(deltaTime);
        } else if (this.waveTimer <= 0 && this.currentWaveIndex + 1 < this.getTotalWaves()) {
            // Start next wave if delay has passed
            this.currentWaveIndex++;
            this.startNextWave();
        }
    }

    private updateSpawnTimers(deltaTime: number): void {
        // Update all spawn timers
        for (const [spawnId, timer] of this.spawnTimers) {
            const newTimer = timer - deltaTime;
            this.spawnTimers.set(spawnId, newTimer);

            // Spawn enemy when timer reaches 0
            if (newTimer <= 0) {
                const spawnData = this.pendingSpawns.find(p => p.formationId === spawnId);
                if (spawnData) {
                    this.spawnEnemyAtPosition(spawnData.spawn);
                    
                    // Remove from pending spawns
                    this.pendingSpawns = this.pendingSpawns.filter(p => p.formationId !== spawnId);
                    this.spawnTimers.delete(spawnId);
                }
            }
        }

        // Check if wave is complete
        if (this.isWaveActive && this.pendingSpawns.length === 0) {
            this.isWaveActive = false;
            console.log(`Wave ${this.currentWaveIndex + 1}/${this.getTotalWaves()} completed`);
            
            // Check if this was the last wave
            if (this.currentWaveIndex >= this.getTotalWaves() - 1) {
                console.log('All waves completed for this level');
            }
        }
    }

    private async spawnEnemyAtPosition(spawn: EnemySpawn): Promise<void> {
        try {
            const position: Vector2 = { x: spawn.x, y: spawn.y };
            const enemy = await this.enemyManager.spawnEnemy(spawn.type, position);
            
            if (enemy) {
                console.log(`Spawned ${spawn.type} at (${spawn.x.toFixed(1)}, ${spawn.y.toFixed(1)})`);
            } else {
                console.warn(`Failed to spawn ${spawn.type} - no available enemies in pool`);
            }
        } catch (error) {
            console.error(`Error spawning ${spawn.type}:`, error);
        }
    }

    /**
     * Get current wave number (1-based)
     */
    public getCurrentWave(): number {
        return this.currentWaveIndex + 1;
    }

    /**
     * Get total waves in current level
     */
    public getTotalWaves(): number {
        return this.currentLevelData?.waves.length || 0;
    }

    /**
     * Check if current level is complete
     */
    public isLevelComplete(): boolean {
        if (!this.isLevelActive) return true;
        
        const totalWaves = this.getTotalWaves();
        const isLastWaveComplete = this.currentWaveIndex >= totalWaves - 1 && !this.isWaveActive;
        
        console.log(`Level completion check: waveIndex=${this.currentWaveIndex}, totalWaves=${totalWaves}, isWaveActive=${this.isWaveActive}, isLastWaveComplete=${isLastWaveComplete}`);
        
        return isLastWaveComplete;
    }

    /**
     * Get available formation names
     */
    public getFormationNames(): string[] {
        if (!this.formationData?.formations) return [];
        return Object.keys(this.formationData.formations);
    }

    /**
     * Get available level names
     */
    public getLevelNames(): string[] {
        if (!this.formationData?.levels) return [];
        return Object.keys(this.formationData.levels);
    }

    /**
     * Get available formations
     */
    public getAvailableFormations(): string[] {
        return this.getFormationNames();
    }

    /**
     * Get formation by ID
     */
    public getFormation(formationId: string): Formation | null {
        if (!this.formationData || !this.formationData.formations[formationId]) {
            return null;
        }
        return this.formationData.formations[formationId];
    }

    /**
     * Check if a wave is currently active
     */
    public isActive(): boolean {
        return this.isWaveActive;
    }

    // Manual spawn methods for testing
    public async spawnFormation(formationId: string): Promise<void> {
        if (!this.formationData || !this.formationData.formations[formationId]) {
            console.error(`Formation ${formationId} not found`);
            return;
        }

        const formation = this.formationData.formations[formationId];
        console.log(`Manually spawning formation: ${formation.name}`);

        for (const spawn of formation.enemies) {
            // Scale position trước khi spawn
            const scaledPosition = scalePosition(spawn.x, spawn.y);
            const scaledSpawn: EnemySpawn = {
                ...spawn,
                x: scaledPosition.x,
                y: scaledPosition.y
            };
            
            // Spawn immediately for manual testing
            setTimeout(() => {
                this.spawnEnemyAtPosition(scaledSpawn);
            }, spawn.delay * 1000);
        }
    }
} 