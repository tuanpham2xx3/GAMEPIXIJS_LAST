import * as PIXI from 'pixi.js';
import { 
    Enemy, 
    DiverEnemy, 
    GreenEnemy, 
    InferiorEnemy, 
    NaEnemy, 
    SoldierEnemy, 
    BossEnemy,
    Enemy1Enemy,
    Enemy2Enemy
} from '../../entities/enemy';
import { Vector2, EnemyType } from '../../types/EntityTypes';
import { GameConfig, scalePosition } from '../../core/Config';

export class EnemyManager {
    private container: PIXI.Container;
    private activeEnemies: Enemy[];

    constructor(container: PIXI.Container) {
        this.container = container;
        this.activeEnemies = [];
    }

    public async initialize(): Promise<void> {
        console.log('EnemyManager initialized');
    }

    private createEnemyByType(type: EnemyType): Enemy {

        switch (type) {
            case 'diver':
                return new DiverEnemy();
            case 'green':
                return new GreenEnemy();
            case 'inferior':
                return new InferiorEnemy();
            case 'na':
                return new NaEnemy();
            case 'soldier':
                return new SoldierEnemy();
            case 'boss':
                return new BossEnemy();
            case 'enemy1':
                return new Enemy1Enemy();
            case 'enemy2':
                return new Enemy2Enemy();
            default:
                throw new Error(`Unknown enemy type: ${type}`);
        }
    }

    public async spawnEnemy(type: EnemyType, position: Vector2): Promise<Enemy | null> {
        const enemy = this.createEnemyByType(type);
        await enemy.setupVisuals();
        enemy.initialize(position);
        
        this.container.addChild(enemy);
        this.activeEnemies.push(enemy);

        return enemy;
    }



    public update(deltaTime: number): void {
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i];
            enemy.update(deltaTime);

            if (!enemy.isActive) {
                this.activeEnemies.splice(i, 1);
                enemy.destroy();
            }
        }
    }







    public getActiveEnemies(): Enemy[] {
        return [...this.activeEnemies];
    }

    public getActiveEnemyCount(): number {
        return this.activeEnemies.length;
    }

    public getEnemyCountByType(type: EnemyType): number {
        return this.activeEnemies.filter(enemy => enemy.getEnemyType() === type).length;
    }

    public clearAllEnemies(): void {
        for (const enemy of this.activeEnemies) {
            enemy.destroy();
        }
        this.activeEnemies = [];
    }

    public destroy(): void {
        for (const enemy of this.activeEnemies) {
            enemy.destroy();
        }
        this.activeEnemies = [];
    }
} 