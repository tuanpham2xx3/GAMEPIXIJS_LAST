import * as PIXI from 'pixi.js';
import { EntityCategory, CollisionResult, CollidableEntity, CollisionRule } from '../types/EntityTypes';
import { GameConfig } from '../core/Config';

export class CollisionManager {
  private collisionRules: Map<string, CollisionRule>;
  private collisionChecks: number = 0;

  constructor() {
    this.collisionRules = new Map();
    this.setupDefaultCollisionRules();
  }

  private setupDefaultCollisionRules(): void {
    // Player vs Enemy/Boss
    this.addCollisionRule(EntityCategory.PLAYER, EntityCategory.ENEMY, {
      enabled: true,
      damageToA: GameConfig.collision.defaultDamage.enemy,
      deactivateB: true, // Destroy enemy on contact
      scoreValue: 0 // No score for being hit
    });

    this.addCollisionRule(EntityCategory.PLAYER, EntityCategory.BOSS, {
      enabled: true,
      damageToA: GameConfig.collision.defaultDamage.boss,
      deactivateB: false, // Boss doesn't get destroyed by contact
      scoreValue: 0
    });

    // Player vs Enemy/Boss Bullets
    this.addCollisionRule(EntityCategory.PLAYER, EntityCategory.ENEMY_BULLET, {
      enabled: true,
      damageToA: GameConfig.collision.defaultDamage.enemyBullet,
      deactivateB: true, // Destroy bullet
      scoreValue: 0
    });

    this.addCollisionRule(EntityCategory.PLAYER, EntityCategory.BOSS_BULLET, {
      enabled: true,
      damageToA: GameConfig.collision.defaultDamage.bossBullet,
      deactivateB: true,
      scoreValue: 0
    });

    // Player Bullets vs Enemy/Boss
    this.addCollisionRule(EntityCategory.PLAYER_BULLET, EntityCategory.ENEMY, {
      enabled: true,
      damageToB: GameConfig.collision.defaultDamage.playerBullet,
      deactivateA: true, // Destroy bullet
      scoreValue: 100, // Will be overridden by enemy's score value
      callback: (bullet: any, enemy: any) => {
        console.log('Bullet hit enemy!', bullet, enemy);
        const enemyType = enemy.getEnemyType?.();
        const damage = GameConfig.collision.defaultDamage.playerBullet;
        const score = enemyType ? (GameConfig.collision.scoreValues as any)[enemyType] || 100 : 100;
        
        console.log(`Enemy ${enemyType} hit by bullet for ${damage} damage`);
        
        return {
          entityA: bullet,
          entityB: enemy,
          categoryA: EntityCategory.PLAYER_BULLET,
          categoryB: EntityCategory.ENEMY,
          damageToB: damage,
          shouldDeactivateA: true, // Deactivate bullet
          shouldDeactivateB: false, // Will be determined after async takeDamage
          score: score // Score will be applied if enemy is destroyed
        };
      }
    });

    this.addCollisionRule(EntityCategory.PLAYER_BULLET, EntityCategory.BOSS, {
      enabled: true,
      damageToB: GameConfig.collision.defaultDamage.playerBullet,
      deactivateA: true,
      scoreValue: GameConfig.collision.scoreValues.boss, // Only when boss is destroyed
      callback: (bullet: any, boss: any) => {
        const damage = GameConfig.collision.defaultDamage.playerBullet;
        console.log(`Boss hit by bullet for ${damage} damage`);
        return {
          entityA: bullet,
          entityB: boss,
          categoryA: EntityCategory.PLAYER_BULLET,
          categoryB: EntityCategory.BOSS,
          damageToB: damage,
          shouldDeactivateA: true,
          shouldDeactivateB: false, // Will be determined after async takeDamage
          score: GameConfig.collision.scoreValues.boss // Score will be applied if boss is destroyed
        };
      }
    });

    // Optional: Bullet vs Bullet (can be enabled later)
    this.addCollisionRule(EntityCategory.PLAYER_BULLET, EntityCategory.ENEMY_BULLET, {
      enabled: false, // Disabled by default
      deactivateA: true,
      deactivateB: true,
      scoreValue: 10
    });

    // Player vs Items (collection)
    this.addCollisionRule(EntityCategory.PLAYER, EntityCategory.ITEM, {
      enabled: true,
      damageToA: 0, // No damage to player
      damageToB: 0, // No damage to item
      deactivateA: false, // Don't deactivate player
      deactivateB: true, // Deactivate item (collect it)
      scoreValue: 0, // Items handle their own effects
      callback: (player: any, item: any) => {
        console.log('Player collected item!', item);
        
        // Get item type and apply effects
        const itemType = item.getItemType?.();
        
        if (itemType === 'coin') {
          // Will be handled by GameOrchestrator.collectCoin()
        } else if (itemType === 'booster') {
          // Will be handled by GameOrchestrator.collectBooster()
        }
        
        return {
          entityA: player,
          entityB: item,
          categoryA: EntityCategory.PLAYER,
          categoryB: EntityCategory.ITEM,
          damageToA: 0,
          damageToB: 0,
          shouldDeactivateA: false,
          shouldDeactivateB: true, // Collect the item
          score: 0 // Items provide their own effects
        };
      }
    });
  }

  public addCollisionRule(categoryA: EntityCategory, categoryB: EntityCategory, rule: Partial<CollisionRule>): void {
    const key = this.getRuleKey(categoryA, categoryB);
    const reverseKey = this.getRuleKey(categoryB, categoryA);
    
    const fullRule: CollisionRule = {
      categoryA,
      categoryB,
      enabled: true,
      ...rule
    };

    this.collisionRules.set(key, fullRule);
    // Also set reverse rule for bidirectional checking
    this.collisionRules.set(reverseKey, {
      ...fullRule,
      categoryA: categoryB,
      categoryB: categoryA,
      damageToA: rule.damageToB,
      damageToB: rule.damageToA,
      destroyA: rule.destroyB,
      destroyB: rule.destroyA,
      deactivateA: rule.deactivateB,
      deactivateB: rule.deactivateA
    });
  }

  public checkAllCollisions(entityGroups: Map<EntityCategory, CollidableEntity[]>): CollisionResult[] {
    const results: CollisionResult[] = [];
    this.collisionChecks = 0;

    // Get all entity categories that have entities
    const categories = Array.from(entityGroups.keys()).filter(category => {
      const entities = entityGroups.get(category);
      return entities && entities.length > 0;
    });

    // Check collisions between all category pairs
    for (let i = 0; i < categories.length; i++) {
      for (let j = i; j < categories.length; j++) {
        const categoryA = categories[i];
        const categoryB = categories[j];
        
        // Skip if checking same category against itself (unless it's a special case)
        if (categoryA === categoryB) continue;

        const entitiesA = entityGroups.get(categoryA) || [];
        const entitiesB = entityGroups.get(categoryB) || [];

        const collisions = this.checkCollisionBetweenGroups(entitiesA, entitiesB, categoryA, categoryB);
        results.push(...collisions);

        // Limit collision checks per frame for performance
        if (this.collisionChecks >= GameConfig.collision.maxChecksPerFrame) {
          console.warn(`Collision check limit reached: ${this.collisionChecks}`);
          break;
        }
      }
    }

    return results;
  }

  private checkCollisionBetweenGroups(
    entitiesA: CollidableEntity[], 
    entitiesB: CollidableEntity[], 
    categoryA: EntityCategory, 
    categoryB: EntityCategory
  ): CollisionResult[] {
    const results: CollisionResult[] = [];
    const ruleKey = this.getRuleKey(categoryA, categoryB);
    const rule = this.collisionRules.get(ruleKey);

    if (!rule || !rule.enabled) return results;

    for (const entityA of entitiesA) {
      if (!entityA.isActive) continue;

      for (const entityB of entitiesB) {
        if (!entityB.isActive) continue;

        this.collisionChecks++;

        if (this.checkCollision(entityA, entityB)) {
          // Use custom callback if available, otherwise use default rule
          let result: CollisionResult | null = null;

          if (rule.callback) {
            result = rule.callback(entityA, entityB);
          } else {
            result = this.createDefaultCollisionResult(entityA, entityB, categoryA, categoryB, rule);
          }

          if (result) {
            results.push(result);
          }
        }
      }
    }

    return results;
  }

  private checkCollision(entityA: CollidableEntity, entityB: CollidableEntity): boolean {
    const boundsA = entityA.getBounds();
    const boundsB = entityB.getBounds();
    
    return this.boundsIntersect(boundsA, boundsB);
  }

  private boundsIntersect(bounds1: PIXI.Rectangle, bounds2: PIXI.Rectangle): boolean {
    return bounds1.x < bounds2.x + bounds2.width &&
           bounds1.x + bounds1.width > bounds2.x &&
           bounds1.y < bounds2.y + bounds2.height &&
           bounds1.y + bounds1.height > bounds2.y;
  }

  private createDefaultCollisionResult(
    entityA: CollidableEntity, 
    entityB: CollidableEntity, 
    categoryA: EntityCategory, 
    categoryB: EntityCategory, 
    rule: CollisionRule
  ): CollisionResult {
    return {
      entityA,
      entityB,
      categoryA,
      categoryB,
      damage: rule.damageToB || rule.damageToA, // Backward compatibility
      damageToA: rule.damageToA,
      damageToB: rule.damageToB,
      score: rule.scoreValue || 0,
      shouldDestroyA: rule.destroyA || false,
      shouldDestroyB: rule.destroyB || false,
      shouldDeactivateA: rule.deactivateA || false,
      shouldDeactivateB: rule.deactivateB || false
    };
  }

  private getRuleKey(categoryA: EntityCategory, categoryB: EntityCategory): string {
    // Create a consistent key regardless of parameter order
    return categoryA <= categoryB ? `${categoryA}_${categoryB}` : `${categoryB}_${categoryA}`;
  }

  public enableCollisionRule(categoryA: EntityCategory, categoryB: EntityCategory): void {
    const key = this.getRuleKey(categoryA, categoryB);
    const rule = this.collisionRules.get(key);
    if (rule) {
      rule.enabled = true;
    }
  }

  public disableCollisionRule(categoryA: EntityCategory, categoryB: EntityCategory): void {
    const key = this.getRuleKey(categoryA, categoryB);
    const rule = this.collisionRules.get(key);
    if (rule) {
      rule.enabled = false;
    }
  }

  public getCollisionStats(): { totalChecks: number; totalRules: number } {
    return {
      totalChecks: this.collisionChecks,
      totalRules: this.collisionRules.size
    };
  }
} 