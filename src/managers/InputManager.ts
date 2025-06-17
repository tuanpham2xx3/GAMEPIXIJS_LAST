import { InputState, Vector2 } from '../types/EntityTypes';

export class InputManager {
  private inputState: InputState;
  private canvas: HTMLCanvasElement;
  
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.inputState = {
      isPointerDown: false,
      previousPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
      frameMovement: { x: 0, y: 0 }
    };
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.onPointerStart.bind(this));
    this.canvas.addEventListener('mousemove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onPointerEnd.bind(this));
    this.canvas.addEventListener('mouseleave', this.onPointerEnd.bind(this));

    // Touch events
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onPointerEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.onPointerEnd.bind(this));

    // Prevent context menu on right click
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onPointerStart(event: MouseEvent): void {
    const position = this.getMousePosition(event);
    this.startPointer(position);
  }

  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const position = this.getTouchPosition(event.touches[0]);
      this.startPointer(position);
    }
  }

  private startPointer(position: Vector2): void {
    this.inputState.isPointerDown = true;
    this.inputState.previousPosition = position;
    this.inputState.currentPosition = position;
    this.inputState.frameMovement = { x: 0, y: 0 };
  }

  private onPointerMove(event: MouseEvent): void {
    if (this.inputState.isPointerDown) {
      const position = this.getMousePosition(event);
      this.updatePointer(position);
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (this.inputState.isPointerDown && event.touches.length > 0) {
      const position = this.getTouchPosition(event.touches[0]);
      this.updatePointer(position);
    }
  }

  private updatePointer(position: Vector2): void {
    // Calculate movement from current position (not previous)
    const movement = {
      x: position.x - this.inputState.currentPosition.x,
      y: position.y - this.inputState.currentPosition.y
    };
    
    // Only update frameMovement if there's actual movement
    const threshold = 0.1; // Minimum movement threshold
    if (Math.abs(movement.x) > threshold || Math.abs(movement.y) > threshold) {
      this.inputState.frameMovement = movement;
    } else {
      this.inputState.frameMovement = { x: 0, y: 0 };
    }
    
    // Update positions
    this.inputState.previousPosition = this.inputState.currentPosition;
    this.inputState.currentPosition = position;
  }

  private onPointerEnd(): void {
    this.inputState.isPointerDown = false;
    // Reset movement when pointer is released
    this.inputState.frameMovement = { x: 0, y: 0 };
    this.inputState.previousPosition = { x: 0, y: 0 };
    this.inputState.currentPosition = { x: 0, y: 0 };
  }

  private getMousePosition(event: MouseEvent): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  private getTouchPosition(touch: Touch): Vector2 {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  // Public methods
  public getInputState(): InputState {
    return { ...this.inputState };
  }

  public isPointerDown(): boolean {
    return this.inputState.isPointerDown;
  }

  public getFrameMovement(): Vector2 {
    const movement = { ...this.inputState.frameMovement };
    // Reset frame movement after reading it to ensure it's only used once per frame
    this.inputState.frameMovement = { x: 0, y: 0 };
    return movement;
  }

  public getCurrentPosition(): Vector2 {
    return { ...this.inputState.currentPosition };
  }

  public destroy(): void {
    // Remove all event listeners
    this.canvas.removeEventListener('mousedown', this.onPointerStart.bind(this));
    this.canvas.removeEventListener('mousemove', this.onPointerMove.bind(this));
    this.canvas.removeEventListener('mouseup', this.onPointerEnd.bind(this));
    this.canvas.removeEventListener('mouseleave', this.onPointerEnd.bind(this));
    this.canvas.removeEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.removeEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.removeEventListener('touchend', this.onPointerEnd.bind(this));
    this.canvas.removeEventListener('touchcancel', this.onPointerEnd.bind(this));
  }
} 