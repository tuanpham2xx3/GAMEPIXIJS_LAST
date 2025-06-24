import * as PIXI from 'pixi.js';
import { Vector2, ItemType } from '../types/EntityTypes';
import { GameConfig } from '../core/Config';
import { Item } from '../entities/collectibles/Item';
import { CoinItem } from '../entities/collectibles/CoinItem';
import { BoosterItem } from '../entities/collectibles/BoosterItem';

export class ItemManager {
    private static instance: ItemManager;
    
    private itemPool: Item[];
    private activeItems: Item[];
    private playerPosition?: Vector2;
    private parentContainer?: PIXI.Container;

    private constructor() {
        this.itemPool = [];
        this.activeItems = [];
        this.initializePool();
    }

    public static getInstance(): ItemManager {
        if (!ItemManager.instance) {
            ItemManager.instance = new ItemManager();
        }
        return ItemManager.instance;
    }

    private initializePool(): void {
        const maxItems = GameConfig.maxItems;
        
        // Create a mixed pool of coins and boosters
        // Since coins drop more frequently, create more coin items in pool
        const coinRatio = 0.8; // 80% coins, 20% boosters in pool
        const coinCount = Math.floor(maxItems * coinRatio);
        const boosterCount = maxItems - coinCount;

        // Create coin items
        for (let i = 0; i < coinCount; i++) {
            const coin = new CoinItem();
            this.itemPool.push(coin);
        }

        // Create booster items
        for (let i = 0; i < boosterCount; i++) {
            const booster = new BoosterItem();
            this.itemPool.push(booster);
        }

        console.log(`ItemManager initialized with ${coinCount} coins and ${boosterCount} boosters`);
    }

    public async initialize(parentContainer: PIXI.Container): Promise<void> {
        this.parentContainer = parentContainer;
        
        // Setup visuals for all items in pool
        const setupPromises = this.itemPool.map(item => item.setupVisuals());
        await Promise.all(setupPromises);
        
        console.log('ItemManager visual setup completed');
    }

    public setPlayerPosition(playerPosition: Vector2): void {
        this.playerPosition = playerPosition;
        
        // Update player position for all active items
        this.activeItems.forEach(item => {
            item.setPlayerPosition(playerPosition);
        });
    }

    public spawnItemsOnEnemyDeath(enemyPosition: Vector2): void {
        if (!this.parentContainer) {
            console.warn('ItemManager not initialized with parent container');
            return;
        }

        const dropRates = GameConfig.itemDropRates;
        
        // Always spawn coin (100% drop rate)
        if (Math.random() <= dropRates.coin) {
            this.spawnItem('coin', enemyPosition);
        }
        
        // Chance to spawn booster (10% drop rate)
        if (Math.random() <= dropRates.booster) {
            this.spawnItem('booster', enemyPosition);
        }
    }

    private spawnItem(itemType: ItemType, position: Vector2): void {
        const availableItem = this.getAvailableItem(itemType);
        if (!availableItem) {
            console.warn(`No available ${itemType} items in pool`);
            return;
        }

        // Add some randomness to spawn position
        const spawnPosition: Vector2 = {
            x: position.x + (Math.random() - 0.5) * 40, // ±20px horizontal variance
            y: position.y + (Math.random() - 0.5) * 20  // ±10px vertical variance
        };

        availableItem.initialize(spawnPosition);
        
        if (this.playerPosition) {
            availableItem.setPlayerPosition(this.playerPosition);
        }

        // Add to parent container if not already added
        if (!availableItem.parent && this.parentContainer) {
            this.parentContainer.addChild(availableItem);
        }

        this.activeItems.push(availableItem);
        
        console.log(`Spawned ${itemType} at (${spawnPosition.x.toFixed(1)}, ${spawnPosition.y.toFixed(1)})`);
    }

    private getAvailableItem(itemType: ItemType): Item | null {
        return this.itemPool.find(item => 
            !item.isActive && 
            item.getItemType() === itemType
        ) || null;
    }

    public update(deltaTime: number): void {
        // Update all active items
        for (let i = this.activeItems.length - 1; i >= 0; i--) {
            const item = this.activeItems[i];
            
            if (item.isActive) {
                item.update(deltaTime);
            } else {
                // Remove inactive items from active list
                this.activeItems.splice(i, 1);
                
                // Remove from parent container
                if (item.parent) {
                    item.parent.removeChild(item);
                }
            }
        }
    }

    public getActiveItems(): Item[] {
        return [...this.activeItems];
    }

    public getActiveItemCount(): number {
        return this.activeItems.length;
    }

    public getActiveItemCountByType(itemType: ItemType): number {
        return this.activeItems.filter(item => 
            item.isActive && 
            item.getItemType() === itemType
        ).length;
    }

    public reset(): void {
        // Deactivate all active items
        this.activeItems.forEach(item => {
            item.deactivate();
            if (item.parent) {
                item.parent.removeChild(item);
            }
        });
        
        this.activeItems = [];
        console.log('ItemManager reset completed');
    }

    public destroy(): void {
        this.reset();
        
        // Destroy all items in pool
        this.itemPool.forEach(item => item.destroy());
        this.itemPool = [];
        
        this.parentContainer = undefined;
        this.playerPosition = undefined;
        
        console.log('ItemManager destroyed');
    }
} 