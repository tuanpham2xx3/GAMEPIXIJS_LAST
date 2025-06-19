import { EnemyManager } from './EnemyManager';
import { EnemyType, Vector2 } from '../types/EntityTypes';
import { scalePosition } from '../core/Config';
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

export interface Level {
    waves: string[];
    waveDelay: number;
}

export interface FormationData {
    formations: { [key: string]: Formation };
    levels: { [key: string]: Level };
}

interface SpawnTimer {
    enemy: EnemySpawn;
    timeLeft: number;
    spawned: boolean;
}

export class SimpleFormationManager {
    private enemyManager: EnemyManager;
    private formationData: FormationData;
    
    // Current state - simple properties
    private currentLevel: string = '';
    private currentWaveIndex: number = 0;
    private currentWaveSpawns: SpawnTimer[] = [];
    private timeBetweenWaves: number = 0;
    private isActive: boolean = false;

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
        this.formationData = FORMATIONS_DATA;
        console.log('✅ Simple Formation Manager initialized');
        console.log('📋 Available formations:', this.getFormationNames());
        console.log('🎮 Available levels:', this.getLevelNames());
    }

    /**
     * Start a level - simple and direct
     */
    public startLevel(levelId: string): boolean {
        if (!this.formationData.levels[levelId]) {
            console.error(`❌ Level ${levelId} not found`);
            return false;
        }

        this.currentLevel = levelId;
        this.currentWaveIndex = 0;
        this.currentWaveSpawns = [];
        this.timeBetweenWaves = 0;
        this.isActive = true;

        console.log(`🚀 Starting level: ${levelId}`);
        this.startCurrentWave();
        return true;
    }

    /**
     * Start current wave based on index
     */
    private startCurrentWave(): void {
        const level = this.formationData.levels[this.currentLevel];
        if (!level || this.currentWaveIndex >= level.waves.length) {
            console.log('🎉 All waves completed!');
            this.isActive = false;
            return;
        }

        const waveId = level.waves[this.currentWaveIndex];
        const formation = this.formationData.formations[waveId];
        
        if (!formation) {
            console.error(`❌ Formation ${waveId} not found`);
            return;
        }

        console.log(`🌊 Starting wave ${this.currentWaveIndex + 1}/${level.waves.length}: ${formation.name}`);

        // Setup spawn timers for this wave
        this.currentWaveSpawns = formation.enemies.map(enemy => ({
            enemy: {
                ...enemy,
                // Scale positions immediately when setting up
                ...scalePosition(enemy.x, enemy.y)
            },
            timeLeft: enemy.delay,
            spawned: false
        }));

        this.timeBetweenWaves = level.waveDelay;
    }

    /**
     * Update - simple time-based spawning
     */
    public update(deltaTime: number): void {
        if (!this.isActive) return;

        // Update spawn timers
        let allSpawned = true;
        for (const spawn of this.currentWaveSpawns) {
            if (!spawn.spawned) {
                spawn.timeLeft -= deltaTime;
                if (spawn.timeLeft <= 0) {
                    this.spawnEnemy(spawn.enemy);
                    spawn.spawned = true;
                }
                allSpawned = false;
            }
        }

        // If all enemies spawned, wait for wave delay then start next wave
        if (allSpawned && this.timeBetweenWaves > 0) {
            this.timeBetweenWaves -= deltaTime;
            if (this.timeBetweenWaves <= 0) {
                this.currentWaveIndex++;
                this.startCurrentWave();
            }
        }
    }

    /**
     * Spawn enemy - simple direct call
     */
    private spawnEnemy(spawn: EnemySpawn): void {
        const position: Vector2 = { x: spawn.x, y: spawn.y };
        this.enemyManager.spawnEnemy(spawn.type, position);
        console.log(`👾 Spawned ${spawn.type} at (${spawn.x.toFixed(1)}, ${spawn.y.toFixed(1)})`);
    }

    /**
     * Test a formation directly - for development
     */
    public testFormation(formationId: string): void {
        const formation = this.formationData.formations[formationId];
        if (!formation) {
            console.error(`❌ Formation ${formationId} not found`);
            return;
        }

        console.log(`🧪 Testing formation: ${formation.name}`);
        formation.enemies.forEach(enemy => {
            const scaledPosition = scalePosition(enemy.x, enemy.y);
            setTimeout(() => {
                this.spawnEnemy({
                    ...enemy,
                    x: scaledPosition.x,
                    y: scaledPosition.y
                });
            }, enemy.delay * 1000);
        });
    }

    // Simple getters
    public getFormationNames(): string[] {
        return Object.keys(this.formationData.formations);
    }

    public getLevelNames(): string[] {
        return Object.keys(this.formationData.levels);
    }

    public getCurrentWave(): number {
        return this.currentWaveIndex + 1;
    }

    public getTotalWaves(): number {
        const level = this.formationData.levels[this.currentLevel];
        return level ? level.waves.length : 0;
    }

    public isLevelActive(): boolean {
        return this.isActive;
    }

    public isLevelComplete(): boolean {
        return !this.isActive && this.currentLevel !== '';
    }

    public stop(): void {
        this.isActive = false;
        this.currentWaveSpawns = [];
        console.log('⏹️ Formation manager stopped');
    }
} 