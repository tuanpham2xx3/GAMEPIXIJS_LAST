import { InputState, Vector2 } from "../types/EntityTypes";
import { GameConfig } from "../core/Config";

export class InputManager {
    private inputState: InputState;
    private canvas: HTMLCanvasElement;
    private accumulatedMovement: Vector2 = { x: 0, y: 0 }; // Accumulate movement for high FPS

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.inputState = {
            isPointerDown: false,
            previousPosition: {x: 0, y: 0},
            currentPosition: {x: 0, y: 0},
            frameMovement: {x: 0, y: 0}
        };

        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        //Mouse event
        this.canvas.addEventListener('mousedown', this.onPointerStart.bind(this));
        this.canvas.addEventListener('mousemove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onPointerEnd.bind(this));
        this.canvas.addEventListener('mouseleave', this.onPointerEnd.bind(this));

        // Touch events
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false});
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false});
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
            const position = this.getTouchPositon(event.touches[0]);
            this.startPointer(position);
        }
    }

    private getTouchPositon(touch : Touch): Vector2 {
        const rect = this.canvas.getBoundingClientRect();
        const rawPosition = {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
        
        // Apply scaling if needed for touch coordinates
        return this.scaleInputPosition(rawPosition);
    }

    private startPointer(position: Vector2): void {
        this.inputState.isPointerDown = true;
        this.inputState.previousPosition = position;
        this.inputState.currentPosition = position;
        this.inputState.frameMovement = { x: 0, y:0};
    }

    private getMousePosition(event: MouseEvent): Vector2 {
        const rect = this.canvas.getBoundingClientRect();
        const rawPosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        // Apply scaling to convert from screen coordinates to game coordinates
        return this.scaleInputPosition(rawPosition);
    }

    private scaleInputPosition(screenPosition: Vector2): Vector2 {
        // If canvas is scaled differently from window, we need to account for that
        const canvasDisplayWidth = this.canvas.offsetWidth;
        const canvasDisplayHeight = this.canvas.offsetHeight;
        const canvasActualWidth = this.canvas.width;
        const canvasActualHeight = this.canvas.height;
        
        // Calculate canvas scaling factors
        const canvasScaleX = canvasActualWidth / canvasDisplayWidth;
        const canvasScaleY = canvasActualHeight / canvasDisplayHeight;
        
        const scaledPosition = {
            x: screenPosition.x * canvasScaleX,
            y: screenPosition.y * canvasScaleY
        };
        
        // Debug scaling if needed
        if (GameConfig.debug && (canvasScaleX !== 1 || canvasScaleY !== 1)) {
            console.log(`Input Scaling - Display: ${canvasDisplayWidth}x${canvasDisplayHeight}, Actual: ${canvasActualWidth}x${canvasActualHeight}, Scale: ${canvasScaleX.toFixed(3)}x${canvasScaleY.toFixed(3)}`);
        }
        
        return scaledPosition;
    }

    private onPointerMove(event: MouseEvent): void {
        if (this.inputState.isPointerDown) {
            const position = this.getMousePosition(event);
            this.updatePointer(position);
        }
    }

    private updatePointer(position: Vector2): void {
        //Calculate movement from current position , not previous
        const movement = {
            x: position.x - this.inputState.currentPosition.x,
            y: position.y - this.inputState.currentPosition.y
        };

        // Add to accumulated movement instead of using threshold
        this.accumulatedMovement.x += movement.x;
        this.accumulatedMovement.y += movement.y;

        // Use much smaller threshold or no threshold for better precision
        const threshold = 0.01;
        if (Math.abs(this.accumulatedMovement.x) > threshold || Math.abs(this.accumulatedMovement.y) > threshold) {
            this.inputState.frameMovement = { ...this.accumulatedMovement };
            // Don't reset accumulated movement here - let getFrameMovement() handle it
        }

        //Update position
        this.inputState.previousPosition = this.inputState.currentPosition;
        this.inputState.currentPosition = position;
    }

    private onTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (this.inputState.isPointerDown && event.touches.length > 0) {
            const position = this.getTouchPositon(event.touches[0]);
            this.updatePointer(position);
        }
    }

    private onPointerEnd(): void {
        this.inputState.isPointerDown = false;
        //Reset movement when pointer is released
        this.inputState.frameMovement = {x: 0, y: 0};
        this.accumulatedMovement = {x: 0, y: 0};
        this.inputState.previousPosition = {x: 0, y: 0};
        this.inputState.currentPosition = {x: 0, y: 0};
    }

    //Public methods
    public getInputState(): InputState {
        return { ...this.inputState};
    }

    public isPointerDown(): boolean {
        return this.inputState.isPointerDown;
    }

    public getFrameMovement(): Vector2 {
        const movement = { ...this.inputState.frameMovement };
        
        // Reset both frame movement and accumulated movement after reading
        this.inputState.frameMovement = {x: 0, y: 0};
        this.accumulatedMovement = {x: 0, y: 0};
        
        return movement;
    }

    public getCurrentPosition(): Vector2 {
        return { ...this.inputState.currentPosition };
    }

    public destroy(): void {
        //Remove all event listeners
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