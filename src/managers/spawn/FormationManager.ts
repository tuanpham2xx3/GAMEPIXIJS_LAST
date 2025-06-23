import { EnemyManager } from './EnemyManager';
import { EnemyType, Vector2 } from '../../types/EntityTypes';
import { GameConfig, scalePosition } from '../../core/Config';
import { UIAnimator } from '../animations/effects/UIAnimator';
import { AudioManager } from '../AudioManager';
import { Container, Application } from 'pixi.js';

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

    // Boss warning properties
    private uiAnimator: UIAnimator | null = null;
    private audioManager: AudioManager;
    private app: Application | null = null;
    private uiContainer: Container | null = null;
    private warningContainer: Container | null = null;
    private isShowingWarning: boolean = false;
    private warningTimer: number = 0;
    private readonly WARNING_DURATION = 3.0; // 3 seconds warning
    private bossWarningShown: boolean = false; // Track if warning was already shown for current wave

    constructor(enemyManager: EnemyManager, app?: Application, uiContainer?: Container) {
        this.enemyManager = enemyManager;
        this.app = app || null;
        this.uiContainer = uiContainer || null;
        this.audioManager = AudioManager.getInstance();
        
        if (this.app) {
            this.uiAnimator = new UIAnimator(this.app);
        }
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
        this.bossWarningShown = false; // Reset warning flag for new level

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

        // Check if this is a boss wave and show warning (only if not shown yet)
        if (waveId === 'boss_wave' && !this.bossWarningShown && !this.isShowingWarning) {
            console.log('👾 Detected boss wave, showing warning...');
            this.bossWarningShown = true; // Mark that warning is shown for this wave
            this.showBossWarning();
            return; // Don't start wave yet, wait for warning to finish
        }

        console.log(`🎯 Actually starting wave: ${waveId}, bossWarningShown: ${this.bossWarningShown}`);

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

        // Handle warning timer
        if (this.isShowingWarning) {
            this.warningTimer -= deltaTime;
            if (this.warningTimer <= 0) {
                console.log('🚨 Warning timer finished, hiding warning and starting boss wave...');
                this.hideBossWarning();
                this.startCurrentWave(); // Now actually start the boss wave
            }
            return; // Don't process spawning while warning is showing
        }

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
                this.bossWarningShown = false; // Reset warning flag for next wave
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
        this.bossWarningShown = false; // Reset warning flag
        this.hideBossWarning(); // Clean up warning if active
        console.log('Formation manager stopped');
    }

    /**
     * Show boss warning animation in center of screen
     */
    private async showBossWarning(): Promise<void> {
        if (!this.uiAnimator || !this.uiContainer) {
            console.warn('UIAnimator or UIContainer not available for boss warning');
            return;
        }

        try {
            console.log('🚨 Showing boss warning animation...');
            
            // Play warning sound
            this.audioManager.play('warning', { volume: 0.8 });
            
            // Create warning animation
            this.warningContainer = await this.uiAnimator.createWarningAnimation({
                speed: GameConfig.animation.effects.uiFadeSpeed * 2, // Faster blinking for urgency
                minAlpha: 0.4,
                maxAlpha: 1.0
            });

            // Position in center of screen and scale appropriately
            const centerX = GameConfig.screen.width / 2;
            const centerY = GameConfig.screen.height / 2;
            
            // Scale based on screen size
            const scaleFactor = Math.min(GameConfig.scale.x, GameConfig.scale.y) * 1.5;
            this.warningContainer.scale.set(scaleFactor);
            this.warningContainer.position.set(centerX, centerY);

            // Add to UI container
            this.uiContainer.addChild(this.warningContainer);

            // Set warning state
            this.isShowingWarning = true;
            this.warningTimer = this.WARNING_DURATION;

            console.log('✅ Boss warning animation displayed');
        } catch (error) {
            console.error('❌ Failed to show boss warning:', error);
            // If warning fails, just proceed with the wave
            this.isShowingWarning = false;
            this.warningTimer = 0;
        }
    }

    /**
     * Hide boss warning animation
     */
    private hideBossWarning(): void {
        if (this.warningContainer && this.uiContainer && this.uiAnimator) {
            // Remove animation from ticker
            this.uiAnimator.removeWarningAnimation(this.warningContainer);
            
            // Remove from UI container
            this.uiContainer.removeChild(this.warningContainer);
            
            // Clean up
            this.warningContainer.destroy();
            this.warningContainer = null;
        }

        this.isShowingWarning = false;
        this.warningTimer = 0;
        
        console.log('🚨 Boss warning animation hidden');
    }

    /**
     * Check if currently showing warning
     */
    public isShowingBossWarning(): boolean {
        return this.isShowingWarning;
    }
} 