import { GameConfig } from '../core/Config';

export interface ScaledPosition {
    x: number;
    y: number;
}

export interface ReferencePosition {
    x: number;
    y: number;
}

/**
 * Utility class để xử lý scaling positions giữa reference resolution và actual screen
 */
export class ScreenScaler {
    private static instance: ScreenScaler;

    private constructor() {}

    public static getInstance(): ScreenScaler {
        if (!ScreenScaler.instance) {
            ScreenScaler.instance = new ScreenScaler();
        }
        return ScreenScaler.instance;
    }

    /**
     * Scale position từ reference resolution sang actual screen
     */
    public scalePosition(refX: number, refY: number): ScaledPosition {
        return {
            x: refX * GameConfig.scale.x,
            y: refY * GameConfig.scale.y
        };
    }

    /**
     * Scale position với uniform scale (giữ aspect ratio)
     */
    public scalePositionUniform(refX: number, refY: number): ScaledPosition {
        return {
            x: refX * GameConfig.scale.uniform,
            y: refY * GameConfig.scale.uniform
        };
    }

    /**
     * Unscale position từ actual screen về reference resolution
     */
    public unscalePosition(screenX: number, screenY: number): ReferencePosition {
        return {
            x: screenX / GameConfig.scale.x,
            y: screenY / GameConfig.scale.y
        };
    }

    /**
     * Scale size values
     */
    public scaleSize(refSize: number): number {
        return refSize * GameConfig.scale.uniform;
    }

    /**
     * Get screen boundaries trong reference coordinates
     */
    public getReferenceBoundaries(): {
        left: number;
        right: number; 
        top: number;
        bottom: number;
    } {
        const ref = GameConfig.referenceResolution;
        const padding = 32; // Reference padding
        
        return {
            left: padding,
            right: ref.width - padding,
            top: padding,
            bottom: ref.height - padding
        };
    }

    /**
     * Check if reference position is within bounds
     */
    public isWithinReferenceBounds(refX: number, refY: number, margin: number = 0): boolean {
        const bounds = this.getReferenceBoundaries();
        return refX >= bounds.left - margin && 
               refX <= bounds.right + margin &&
               refY >= bounds.top - margin && 
               refY <= bounds.bottom + margin;
    }

    /**
     * Clamp position to reference bounds
     */
    public clampToReferenceBounds(refX: number, refY: number): ReferencePosition {
        const bounds = this.getReferenceBoundaries();
        return {
            x: Math.max(bounds.left, Math.min(bounds.right, refX)),
            y: Math.max(bounds.top, Math.min(bounds.bottom, refY))
        };
    }

    /**
     * Get scale factors info for debugging
     */
    public getScaleInfo(): {
        scaleX: number;
        scaleY: number;
        uniform: number;
        referenceSize: { width: number; height: number };
        actualSize: { width: number; height: number };
    } {
        return {
            scaleX: GameConfig.scale.x,
            scaleY: GameConfig.scale.y,
            uniform: GameConfig.scale.uniform,
            referenceSize: { ...GameConfig.referenceResolution },
            actualSize: { 
                width: GameConfig.screen.width, 
                height: GameConfig.screen.height 
            }
        };
    }

    /**
     * Calculate optimal spawn positions for screen width
     */
    public getOptimalSpawnPositions(count: number, margin: number = 50): ReferencePosition[] {
        const bounds = this.getReferenceBoundaries();
        const availableWidth = bounds.right - bounds.left - (2 * margin);
        const spacing = availableWidth / (count + 1);
        
        const positions: ReferencePosition[] = [];
        
        for (let i = 1; i <= count; i++) {
            positions.push({
                x: bounds.left + margin + (spacing * i),
                y: -50 // Standard spawn Y
            });
        }
        
        return positions;
    }

    /**
     * Create formation patterns
     */
    public createFormationPattern(
        pattern: 'line' | 'v' | 'diamond' | 'cross',
        enemyCount: number,
        centerX: number = 400,
        startY: number = -50
    ): ReferencePosition[] {
        const positions: ReferencePosition[] = [];
        
        switch (pattern) {
            case 'line':
                return this.getOptimalSpawnPositions(enemyCount);
                
            case 'v':
                const vSpacing = 50;
                const vRows = Math.ceil(enemyCount / 2);
                let enemyIndex = 0;
                
                for (let row = 0; row < vRows && enemyIndex < enemyCount; row++) {
                    const y = startY - (row * 50);
                    const enemiesInRow = row === 0 ? 1 : 2;
                    
                    if (row === 0) {
                        positions.push({ x: centerX, y });
                        enemyIndex++;
                    } else {
                        const offset = row * vSpacing;
                        if (enemyIndex < enemyCount) {
                            positions.push({ x: centerX - offset, y });
                            enemyIndex++;
                        }
                        if (enemyIndex < enemyCount) {
                            positions.push({ x: centerX + offset, y });
                            enemyIndex++;
                        }
                    }
                }
                break;
                
            case 'diamond':
                // Center enemy
                positions.push({ x: centerX, y: startY });
                if (enemyCount > 1) {
                    // Side enemies
                    positions.push({ x: centerX - 50, y: startY - 50 });
                    positions.push({ x: centerX + 50, y: startY - 50 });
                }
                if (enemyCount > 3) {
                    // Bottom enemy
                    positions.push({ x: centerX, y: startY - 100 });
                }
                if (enemyCount > 4) {
                    // Outer side enemies
                    positions.push({ x: centerX - 100, y: startY - 75 });
                    positions.push({ x: centerX + 100, y: startY - 75 });
                }
                break;
                
            case 'cross':
                // Center
                positions.push({ x: centerX, y: startY });
                if (enemyCount > 1) {
                    // Horizontal arms
                    positions.push({ x: centerX - 100, y: startY - 50 });
                    positions.push({ x: centerX + 100, y: startY - 50 });
                }
                if (enemyCount > 3) {
                    // Vertical arms
                    positions.push({ x: centerX, y: startY - 100 });
                }
                if (enemyCount > 4) {
                    // Extended arms
                    positions.push({ x: centerX - 200, y: startY - 100 });
                    positions.push({ x: centerX + 200, y: startY - 100 });
                }
                break;
        }
        
        return positions.slice(0, enemyCount);
    }
} 