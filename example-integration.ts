import { LevelManagerWithFormations } from './managers/LevelManagerWithFormations';
import { EnemyManager } from './managers/EnemyManager';

// In your Game class initialization:
class Game {
    private levelManager: LevelManagerWithFormations;
    private enemyManager: EnemyManager;

    async initializeGame() {
        // Initialize managers
        this.enemyManager = new EnemyManager(this.gameContainer);
        this.levelManager = new LevelManagerWithFormations(this.enemyManager);

        // Wait for formation data to load
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Start first level
        this.levelManager.startLevel(1);

        // Optional: Test a specific formation
        // await this.levelManager.testFormation('wave_1');
    }

    update(deltaTime: number) {
        this.levelManager.update(deltaTime);
        this.enemyManager.update(deltaTime);

        // Check level progression
        if (!this.levelManager.isActive()) {
            // Level completed, show UI or start next level
            if (this.levelManager.nextLevel()) {
                console.log('Starting next level...');
            } else {
                console.log('All levels completed!');
            }
        }
    }

    // Debug methods for testing formations
    testFormation(formationId: string) {
        this.levelManager.testFormation(formationId);
    }

    getDebugInfo() {
        return {
            currentLevel: this.levelManager.getCurrentLevel(),
            waveProgress: this.levelManager.getWaveProgress(),
            usingFormations: this.levelManager.isUsingFormations(),
            availableFormations: this.levelManager.getAvailableFormations()
        };
    }
}

// Console commands for testing (add to window for dev mode)
if (GameConfig.debug) {
    (window as any).gameDebug = {
        testFormation: (id: string) => game.testFormation(id),
        listFormations: () => game.getAvailableFormations(),
        getInfo: () => game.getDebugInfo()
    };
} 