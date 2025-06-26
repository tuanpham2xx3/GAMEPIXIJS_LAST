import * as PIXI from 'pixi.js';
import { Vector2, PlayerState, Entity, CollidableEntity, EntityCategory } from '../types/EntityTypes';
import { GameConfig, getBoundaries } from '../core/Config';
import { InputManager } from '../managers/InputManager';
import { BulletManager } from '../managers/BulletManager';
import { WarningGlowManager } from '../managers/animations/effects/WarningGlowManager';

export class Player extends PIXI.Sprite implements Entity, CollidableEntity {
  public velocity: Vector2;
  public isActive: boolean;
  private state: PlayerState;
  private inputManager: InputManager;
  private bulletManager: BulletManager;
  private lastShootTime: number;
  
  // Engine trail - chỉ 1 sprite
  public engineTrail: PIXI.Sprite | null = null;

  // Hit effect properties
  private warningGlowManager: WarningGlowManager | null = null;
  private hitEffectEndTime: number = 0;
  private hitEffectStartTime: number = 0;
  private readonly HIT_EFFECT_DURATION = GameConfig.warningGlow.duration;
  private readonly PLAYER_BLINK_CYCLE = 800; // Sync với warning glow (ms) - CHẬM HỚN
  private readonly PLAYER_VISIBLE_DURATION = 300; // Thời gian player hiện (ms) - DÀI HỚN
  private readonly PLAYER_MIN_ALPHA = GameConfig.warningGlow.playerMinAlpha;

  constructor(texture: PIXI.Texture, inputManager: InputManager, bulletManager: BulletManager, smokeTexture?: PIXI.Texture) {
    super(texture);
    
    this.inputManager = inputManager;
    this.bulletManager = bulletManager;
    this.velocity = { x: 0, y: 0 };
    this.isActive = true;
    this.lastShootTime = 0;

    this.state = {
      isMoving: false,
      isShooting: false,
      health: GameConfig.player.health,
      maxHealth: GameConfig.player.maxHealth
    };

    this.setupPlayer();
    
    // Setup trail ngay nếu có texture
    if (smokeTexture) {
      this.createEngineTrail(smokeTexture);
    }
  }

  private createEngineTrail(texture: PIXI.Texture): void {
    // Tạo 1 sprite khói đơn giản
    this.engineTrail = new PIXI.Sprite(texture);
    
    this.engineTrail.anchor.set(0.5);
    this.engineTrail.scale.set(0.9); // Size vừa phải
    this.engineTrail.alpha = 0.9;
    this.engineTrail.zIndex = -1; // Khói ở phía sau
    this.engineTrail.visible = true; // Đảm bảo visible
  }

  private setupPlayer(): void {
    // Set player properties
    this.width = GameConfig.player.size.width;
    this.height = GameConfig.player.size.height;
    this.anchor.set(0.5);
    this.zIndex = 0; // Tàu ở phía trước
    
    // Set initial position
    this.x = GameConfig.player.startPosition.x;
    this.y = GameConfig.player.startPosition.y;
  }

  public update(deltaTime: number): void {
    if (!this.isActive) return;

    this.handleInput(deltaTime);
    this.handleShooting();
    this.updateEngineTrail();
    this.updateHitEffect(deltaTime); // Thêm update hit effect
  }

  private updateEngineTrail(): void {
    if (!this.engineTrail) return;

    // Đảm bảo engineTrail được add vào parent nếu chưa có
    if (!this.engineTrail.parent && this.parent) {
      this.parent.addChild(this.engineTrail);
    }

    // Position khói ở đít tàu
    this.engineTrail.x = this.x;
    this.engineTrail.y = this.y + this.height/2 ;

    // Hiệu ứng nhấp nháy như khói
    const time = Date.now() * 0.01; // Tốc độ nhấp nháy
    this.engineTrail.alpha = 0.5 + Math.sin(time) * 0.1; // Nhấp nháy từ 0.2 đến 0.8
    
    // Thêm hiệu ứng scale nhẹ để sống động
    this.engineTrail.scale.set(0.35 + Math.sin(time * 1.5) * 0.05);
  }

  private handleInput(deltaTime: number): void {
    const isPointerDown = this.inputManager.isPointerDown();
    
    if (isPointerDown) {
      const frameMovement = this.inputManager.getFrameMovement();
      this.moveByFrameMovement(frameMovement, deltaTime);
      
      // Check if actually moving this frame (more strict threshold)
      const isMovingThisFrame = Math.abs(frameMovement.x) > 0.01 || Math.abs(frameMovement.y) > 0.01;
      this.state.isMoving = isMovingThisFrame;
      this.state.isShooting = true; // Shoot whenever mouse/finger is down
      
      // Debug log
      if (GameConfig.debug && isMovingThisFrame) {
        console.log(`Moving: (${frameMovement.x.toFixed(2)}, ${frameMovement.y.toFixed(2)})`);
      }
    } else {
      // Immediately stop movement when pointer is released
      this.velocity.x = 0;
      this.velocity.y = 0;
      this.state.isMoving = false;
      this.state.isShooting = false;
    }
  }

  private moveByFrameMovement(frameMovement: Vector2, deltaTime: number): void {
    // Only move if there's actual movement
    const hasMovement = Math.abs(frameMovement.x) > 0.01 || Math.abs(frameMovement.y) > 0.01;
    
    if (hasMovement) {
      // Direct movement mapping - player moves exactly as much as mouse/finger moves
      const movementScale = 1.0; // Scale factor for sensitivity adjustment
      
      // Move player by the exact amount of frame movement
      this.x += frameMovement.x * movementScale;
      this.y += frameMovement.y * movementScale;
      
      // Set velocity for smooth animation and other systems that might need it
      if (deltaTime > 0) {
        this.velocity.x = (frameMovement.x * movementScale) / deltaTime;
        this.velocity.y = (frameMovement.y * movementScale) / deltaTime;
      }
      
      // Apply boundaries after movement
      this.applyBoundaries();
    } else {
      // No movement - stop velocity
      this.velocity.x = 0;
      this.velocity.y = 0;
    }
  }

  private handleShooting(): void {
    if (!this.state.isShooting) return;

    const currentTime = Date.now();
    const shootInterval = 1000 / GameConfig.player.shootingRate; // Convert to milliseconds

    if (currentTime - this.lastShootTime >= shootInterval) {
      this.shoot();
      this.lastShootTime = currentTime;
    }
  }

  private shoot(): void {
    const bulletStartPosition: Vector2 = {
      x: this.x,
      y: this.y - this.height / 2 // Shoot from top of player
    };

    const shootDirection: Vector2 = { x: 0, y: -1 }; // Shoot upward
    
    this.bulletManager.shootBullet(bulletStartPosition, shootDirection);
  }

  private applyBoundaries(): void {
    const boundaries = getBoundaries();
    const screenWidth = GameConfig.screen.width;
    const screenHeight = GameConfig.screen.height;
    const playerHalfWidth = this.width / 2;
    const playerHalfHeight = this.height / 2;

    if (this.x < playerHalfWidth) {
      this.x = playerHalfWidth;
      this.velocity.x = 0;
    } else if (this.x > screenWidth - playerHalfWidth) {
      this.x = screenWidth - playerHalfWidth;
      this.velocity.x = 0;
    }

    if (this.y < playerHalfHeight) {
      this.y = playerHalfHeight;
      this.velocity.y = 0;
    } else if (this.y > screenHeight - playerHalfHeight) {
      this.y = screenHeight - playerHalfHeight;
      this.velocity.y = 0;
    }
  }

  // Hit Effect Methods
  private updateHitEffect(deltaTime: number): void {
    const currentTime = Date.now();
    
    if (this.hitEffectEndTime > 0) {
      if (currentTime >= this.hitEffectEndTime) {
        // Kết thúc hit effect
        this.endHitEffect();
      } else {
        // Update player blinking
        this.updatePlayerBlinking(currentTime);
      }
    }
  }

  private updatePlayerBlinking(currentTime: number): void {
    // Tính time elapsed từ khi bắt đầu effect
    const elapsed = currentTime - this.hitEffectStartTime;
    
    // Discrete blinking pattern - sync với warning glow
    const cycleProgress = elapsed % this.PLAYER_BLINK_CYCLE;
    
    let alpha = this.PLAYER_MIN_ALPHA;
    if (cycleProgress < this.PLAYER_VISIBLE_DURATION) {
      // Visible phase - full alpha
      alpha = 1.0;
    } else {
      // Invisible phase - minimum alpha
      alpha = this.PLAYER_MIN_ALPHA;
    }
    
    this.alpha = alpha;
    
    // Cũng áp dụng cho engine trail nếu có
    if (this.engineTrail) {
      const trailBaseAlpha = 0.5; // Alpha cơ bản của trail
      this.engineTrail.alpha = trailBaseAlpha * this.alpha;
    }
  }

  private triggerHitEffect(): void {
    const currentTime = Date.now();
    this.hitEffectStartTime = currentTime;
    this.hitEffectEndTime = currentTime + this.HIT_EFFECT_DURATION;
    
    // Start warning glow effect
    if (this.warningGlowManager) {
      this.warningGlowManager.startWarningGlow();
    }
    
    console.log('Hit effect started - Player and warning glow blinking');
  }

  private endHitEffect(): void {
    // Reset hit effect variables
    this.hitEffectEndTime = 0;
    this.hitEffectStartTime = 0;
    
    // Restore player normal alpha
    this.alpha = 1.0;
    
    // Restore engine trail normal alpha
    if (this.engineTrail) {
      this.engineTrail.alpha = 0.5; // Alpha bình thường
    }
    
    // Stop warning glow
    if (this.warningGlowManager) {
      this.warningGlowManager.stopWarningGlow();
    }
    
    console.log('Hit effect ended - Player and warning glow restored');
  }

  // Public methods
  public takeDamage(damage: number): boolean {
    // Ignore damage nếu đang trong invincibility frames
    if (this.isInvincible()) {
      console.log('Player is invincible, damage ignored');
      return false;
    }

    this.state.health = Math.max(0, this.state.health - damage);
    
    // Trigger hit effect
    this.triggerHitEffect();
    
    if (this.state.health <= 0) {
      this.isActive = false;
      return true; // Player destroyed
    }
    return false; // Player still alive
  }

  public getCategory(): EntityCategory {
    return EntityCategory.PLAYER;
  }

  public heal(amount: number): void {
    this.state.health = Math.min(this.state.maxHealth, this.state.health + amount);
  }

  public destroy(): void {
    this.isActive = false;
    
    // Clean up engine trail
    if (this.engineTrail && this.engineTrail.parent) {
      this.engineTrail.parent.removeChild(this.engineTrail);
      this.engineTrail.destroy();
    }
    
    super.destroy();
  }

  // Getters
  public getPosition(): Vector2 {
    return { x: this.x, y: this.y };
  }

  public getState(): PlayerState {
    return { ...this.state };
  }

  public getHealth(): number {
    return this.state.health;
  }

  public getMaxHealth(): number {
    return this.state.maxHealth;
  }

  public isMoving(): boolean {
    return this.state.isMoving;
  }

  public isShooting(): boolean {
    return this.state.isShooting;
  }

  // Method để đảm bảo engineTrail được add vào scene
  public addToParent(parent: PIXI.Container): void {
    // Add engineTrail vào parent trước (để nằm dưới)
    if (this.engineTrail && !this.engineTrail.parent) {
      parent.addChild(this.engineTrail);
    }
    
    // Add player vào parent sau (để nằm trên)
    parent.addChild(this);
  }

  public getBulletLevel(): number {
    return this.bulletManager.getBulletLevel();
  }

  public upgradeBulletLevel(): void {
    const result = this.bulletManager.upgradeBulletLevel();
    
    const damageIncrease = result.newDamage - result.oldDamage;
    
    if (result.isSpecialLevel) {
      console.log(`LEVEL UP! Level ${result.newLevel} - New pattern unlocked! Damage: ${result.newDamage} (+${damageIncrease})`);
    } else {
      console.log(`POWER UP! Level ${result.newLevel} - Damage increased to ${result.newDamage} (+${damageIncrease})`);
    }
  }

  public resetBulletLevel(): void {
    this.bulletManager.resetBulletLevel();
    console.log('Player: Bullet level reset to 1');
  }

  public getCurrentDamage(): number {
    return this.bulletManager.getCurrentDamage();
  }

  public getBulletCount(): number {
    return this.bulletManager.getBulletCount();
  }

  // Hit Effect getter methods
  public isInvincible(): boolean {
    return this.hitEffectEndTime > 0;
  }

  public isInHitEffect(): boolean {
    return this.hitEffectEndTime > 0;
  }

  // Method để set WarningGlowManager từ GameOrchestrator
  public setWarningGlowManager(manager: WarningGlowManager): void {
    this.warningGlowManager = manager;
  }
} 