import { EnemyManager } from './EnemyManager';
import { EnemyType, Vector2 } from '../types/EntityTypes';

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
    levels: { [key: string]: LevelFormation };
}

export class FormationManager {
    private enemyManager: EnemyManager;
    private formationData: FormationData | null = null;
    private currentWaveIndex: number = 0;
    private currentLevel: string = '';
    private waveTimer: number = 0;
    private spawnTimers: Map<string, number> = new Map();
    private isWaveActive: boolean = false;
    private pendingSpawns: Array<{spawn: EnemySpawn, formationId: string}> = [];

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
    }

    public async loadFormations(): Promise<boolean> {
        try {
            const basePath = document.querySelector('base')?.href || window.location.origin + '/GAMEPIXIJS_LAST/';
            const response = await fetch(`${basePath}enemy-formations.json`);
            this.formationData = await response.json();
            console.log('Formation data loaded successfully');
            return true;
        } catch (error) {
            console.error('Failed to load formation data:', error);
            return false;
        }
    }

    public startLevel(levelId: string): boolean {
        if (!this.formationData || !this.formationData.levels[levelId]) {
            console.error(`Level ${levelId} not found in formation data`);
            return false;
        }

        this.currentLevel = levelId;
        this.currentWaveIndex = 0;
        this.waveTimer = 0;
        this.isWaveActive = false;
        this.spawnTimers.clear();
        this.pendingSpawns = [];

        console.log(`Formation level ${levelId} started`);
        return true;
    }

    public update(deltaTime: number): void {
        if (!this.formationData || !this.currentLevel) return;

        const levelConfig = this.formationData.levels[this.currentLevel];
        
        // Start next wave if needed
        if (!this.isWaveActive && this.currentWaveIndex < levelConfig.waves.length) {
            this.waveTimer += deltaTime;
            
            if (this.waveTimer >= (this.currentWaveIndex === 0 ? 0 : levelConfig.waveDelay)) {
                this.startWave(levelConfig.waves[this.currentWaveIndex]);
                this.currentWaveIndex++;
                this.waveTimer = 0;
            }
        }

        // Update spawn timers
        this.updateSpawnTimers(deltaTime);
    }

    private startWave(waveId: string): void {
        if (!this.formationData || !this.formationData.formations[waveId]) {
            console.error(`Wave ${waveId} not found`);
            return;
        }

        const formation = this.formationData.formations[waveId];
        this.isWaveActive = true;

        console.log(`Starting wave: ${formation.name}`);

        // Setup spawn timers for each enemy in the formation
        formation.enemies.forEach((spawn, index) => {
            const spawnId = `${waveId}_${index}`;
            this.spawnTimers.set(spawnId, spawn.delay);
            this.pendingSpawns.push({ spawn, formationId: spawnId });
        });
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
            console.log('Wave completed');
        }
    }

    private async spawnEnemyAtPosition(spawn: EnemySpawn): Promise<void> {
        try {
            const position: Vector2 = { x: spawn.x, y: spawn.y };
            const enemy = await this.enemyManager.spawnEnemy(spawn.type, position);
            
            if (enemy) {
                console.log(`Spawned ${spawn.type} at (${spawn.x}, ${spawn.y})`);
            } else {
                console.warn(`Failed to spawn ${spawn.type} - no available enemies in pool`);
            }
        } catch (error) {
            console.error(`Error spawning ${spawn.type}:`, error);
        }
    }

    // Helper methods for game management
    public isLevelComplete(): boolean {
        return this.currentWaveIndex >= (this.formationData?.levels[this.currentLevel]?.waves.length || 0) 
               && !this.isWaveActive;
    }

    public getCurrentWave(): number {
        return this.currentWaveIndex;
    }

    public getTotalWaves(): number {
        return this.formationData?.levels[this.currentLevel]?.waves.length || 0;
    }

    public getFormationNames(): string[] {
        return this.formationData ? Object.keys(this.formationData.formations) : [];
    }

    public getLevelNames(): string[] {
        return this.formationData ? Object.keys(this.formationData.levels) : [];
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
            // Spawn immediately for manual testing
            setTimeout(() => {
                this.spawnEnemyAtPosition(spawn);
            }, spawn.delay * 1000);
        }
    }
} 