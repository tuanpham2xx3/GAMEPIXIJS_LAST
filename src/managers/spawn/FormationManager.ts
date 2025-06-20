import { EnemyManager } from './EnemyManager';
import { EnemyType, Vector2 } from '../../types/EntityTypes';
import { GameConfig, scalePosition } from '../../core/Config';

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

export class FormationManager {
    private enemyManager: EnemyManager;
    private formationData: FormationData | null = null;
    

    private currentLevel: string = '';
    private currentWaveIndex: number = 0;
    private currentWaveSpawns: SpawnTimer[] = [];
    private timeBetweenWaves: number = 0;
    private isActive: boolean = false;
    private isInitialized: boolean = false;

    constructor(enemyManager: EnemyManager) {
        this.enemyManager = enemyManager;
    }

    /**
     * Load formations from JSON file
     */
    public async loadFormations(): Promise<boolean> {
        try {
            console.log('Loading formations from JSON...');
            const response = await fetch('./enemy-formations.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch formations: ${response.status}`);
            }
            
            this.formationData = await response.json();
            this.isInitialized = true;
            
            console.log('Simple Formation Manager initialized');
            console.log('Available formations:', this.getFormationNames());
            console.log('Available levels:', this.getLevelNames());
            
            return true;
        } catch (error) {
            console.error('Failed to load formations:', error);
            this.isInitialized = false;
            return false;
        }
    }



    /**
     * Start a level - simple and direct
     */
    public startLevel(levelId: string): boolean {
        if (!this.isInitialized || !this.formationData || !this.formationData.levels[levelId]) {
            console.error(`Level ${levelId} not found or not initialized`);
            return false;
        }

        this.currentLevel = levelId;
        this.currentWaveIndex = 0;
        this.currentWaveSpawns = [];
        this.timeBetweenWaves = 0;
        this.isActive = true;

        console.log(`Starting level: ${levelId}`);
        this.startCurrentWave();
        return true;
    }

    /**
     * Start current wave based on index
     */
    private startCurrentWave(): void {
        if (!this.formationData) return;
        
        const level = this.formationData.levels[this.currentLevel];
        if (!level || this.currentWaveIndex >= level.waves.length) {
            console.log('All waves completed!');
            this.isActive = false;
            return;
        }

        const waveId = level.waves[this.currentWaveIndex];
        const formation = this.formationData.formations[waveId];
        
        if (!formation) {
            console.error(`Formation ${waveId} not found`);
            return;
        }

        console.log(`Starting wave ${this.currentWaveIndex + 1}/${level.waves.length}: ${formation.name}`);


        this.currentWaveSpawns = formation.enemies.map(enemy => ({
            enemy: {
                ...enemy,

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
        console.log(`Spawned ${spawn.type} at (${spawn.x.toFixed(1)}, ${spawn.y.toFixed(1)})`);
    }

    /**
     * Test a formation directly - for development
     */
    public testFormation(formationId: string): void {
        const formation = this.formationData?.formations[formationId];
        if (!formation) {
            console.error(`Formation ${formationId} not found`);
            return;
        }

        console.log(`Testing formation: ${formation.name}`);
        formation.enemies.forEach(enemy => {
            const scaledPos = scalePosition(enemy.x, enemy.y);
            setTimeout(() => {
                this.spawnEnemy({
                    ...enemy,
                    x: scaledPos.x,
                    y: scaledPos.y
                });
            }, enemy.delay * 1000);
        });
    }


    public getFormationNames(): string[] {
        return Object.keys(this.formationData?.formations || {});
    }

    public getLevelNames(): string[] {
        return Object.keys(this.formationData?.levels || {});
    }

    public getCurrentWave(): number {
        return this.currentWaveIndex + 1;
    }

    public getTotalWaves(): number {
        const level = this.formationData?.levels[this.currentLevel];
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
        console.log('Formation manager stopped');
    }
} 