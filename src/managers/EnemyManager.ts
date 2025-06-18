import * as PIXI from 'pixi.js';
import { Enemy } from '../entities/Enemy';
import { DiverEnemy } from '../entities/DiverEnemy';
import { GreenEnemy } from '../entities/GreenEnemy';
import { InferiorEnemy } from '../entities/InferiorEnemy';
import { NaEnemy } from '../entities/NaEnemy';
import { SoldierEnemy } from '../entities/SoldierEnemy';
import { BossEnemy } from '../entities/BossEnemy';
import { Vector2, EnemyType } from '../types/EntityTypes';
import { GameConfig } from '../core/Config';

export class EnemyManager {
    private container: PIXI.Container;
    private enemyPools: Map<EnemyType, Enemy[]>;
    private activeEnemies: Enemy[];
    private inactiveEnemies: Map<EnemyType, Enemy[]>;

    constructor(container: PIXI.Container) {
        this.container = container;
        this.enemyPools = new Map();
        this.activeEnemies = [];
        this.inactiveEnemies = new Map();
    }

    public async initialize(): Promise<void> {
        await this.initializeEnemyPools();
    }

    private async initializeEnemyPools(): Promise<void> {
        const poolSizes = {
            diver: 8,
            green: 6,
            inferior: 10,
            na: 8,
            soldier: 4,
            boss: 1
        };

        for (const [enemyType, poolSize] of Object.entries(poolSizes)) {
            const type = enemyType as EnemyType;
            const pool: Enemy[] = [];
            const inactive: Enemy[] = [];

            for (let i = 0; i < poolSize; i++) {
                const enemy = this.createEnemyByType(type);
                console.log(`Creating enemy ${i + 1}/${poolSize} of type ${type}`);
                await enemy.setupVisuals();
                enemy.visible = false;
                pool.push(enemy);
                inactive.push(enemy);
                this.container.addChild(enemy);
                console.log(`Enemy ${type} ${i + 1} added to container`);
            }

            this.enemyPools.set(type, pool);
            this.inactiveEnemies.set(type, inactive);
        }

        console.log('Enemy pools initialized');
    }

    private createEnemyByType(type: EnemyType): Enemy {
        console.log(`Creating enemy of type: ${type}`);
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
            default:
                throw new Error(`Unknown enemy type: ${type}`);
        }
    }

    public async spawnEnemy(type: EnemyType, position: Vector2): Promise<Enemy | null> {
        const inactivePool = this.inactiveEnemies.get(type);
        if (!inactivePool || inactivePool.length === 0) {
            console.warn(`No available enemies in pool for type: ${type}`);
            return null;
        }

        const enemy = inactivePool.pop()!;
        enemy.initialize(position);
        this.activeEnemies.push(enemy);

        return enemy;
    }

    public spawnEnemyAtRandomX(type: EnemyType, y: number = -50): Promise<Enemy | null> {
        const config = GameConfig.enemies[type];
        const margin = config.size.width;
        const randomX = margin + Math.random() * (GameConfig.screen.width - 2 * margin);
        
        return this.spawnEnemy(type, { x: randomX, y });
    }

    public update(deltaTime: number): void {
        // Update all active enemies
        for (let i = this.activeEnemies.length - 1; i >= 0; i--) {
            const enemy = this.activeEnemies[i];
            enemy.update(deltaTime);

            // Remove inactive enemies and return to pool
            if (!enemy.isActive) {
                this.activeEnemies.splice(i, 1);
                const enemyType = enemy.getEnemyType();
                const inactivePool = this.inactiveEnemies.get(enemyType);
                if (inactivePool) {
                    inactivePool.push(enemy);
                }
            }
        }
    }

    public checkBulletCollisions(bullets: any[]): { enemy: Enemy; bullet: any; score: number }[] {
        const collisions: { enemy: Enemy; bullet: any; score: number }[] = [];

        for (const enemy of this.activeEnemies) {
            if (!enemy.isActive) continue;

            const enemyBounds = enemy.getBounds();
            
            for (const bullet of bullets) {
                if (!bullet.isActive) continue;

                const bulletBounds = bullet.getBounds();
                
                if (this.boundsIntersect(enemyBounds, bulletBounds)) {
                    const bulletDamage = bullet.getDamage();
                    const enemyDestroyed = enemy.takeDamage(bulletDamage);
                    
                    bullet.deactivate();
                    
                    if (enemyDestroyed) {
                        const score = enemy.getScoreValue();
                        collisions.push({ enemy, bullet, score });
                    }
                    
                    break; // One bullet can only hit one enemy
                }
            }
        }

        return collisions;
    }

    public checkPlayerCollisions(player: any): Enemy | null {
        if (!player.isActive) return null;

        const playerBounds = player.getBounds();

        for (const enemy of this.activeEnemies) {
            if (!enemy.isActive) continue;

            const enemyBounds = enemy.getBounds();
            
            if (this.boundsIntersect(playerBounds, enemyBounds)) {
                return enemy;
            }
        }

        return null;
    }

    private boundsIntersect(bounds1: PIXI.Rectangle, bounds2: PIXI.Rectangle): boolean {
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
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
            enemy.deactivate();
            const enemyType = enemy.getEnemyType();
            const inactivePool = this.inactiveEnemies.get(enemyType);
            if (inactivePool) {
                inactivePool.push(enemy);
            }
        }
        this.activeEnemies = [];
    }

    public destroy(): void {
        // Destroy all enemies
        for (const [type, pool] of this.enemyPools) {
            for (const enemy of pool) {
                enemy.destroy();
            }
        }
        
        this.enemyPools.clear();
        this.activeEnemies = [];
        this.inactiveEnemies.clear();
    }

    // Debug methods
    public getPoolStats(): { [key: string]: { total: number; active: number; inactive: number } } {
        const stats: { [key: string]: { total: number; active: number; inactive: number } } = {};
        
        for (const [type, pool] of this.enemyPools) {
            const activeCount = this.activeEnemies.filter(e => e.getEnemyType() === type).length;
            const inactiveCount = this.inactiveEnemies.get(type)?.length || 0;
            
            stats[type] = {
                total: pool.length,
                active: activeCount,
                inactive: inactiveCount
            };
        }
        
        return stats;
    }
} 