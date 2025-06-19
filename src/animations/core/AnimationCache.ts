import { Texture } from 'pixi.js';
import { AnimationCacheInfo } from './AnimationConfig';

/**
 * Animation Cache Manager
 * Chuyên quản lý cache cho tất cả animation textures
 */
export class AnimationCache {
    private static instance: AnimationCache;
    private cache: Map<string, Texture[]> = new Map();

    private constructor() {}

    public static getInstance(): AnimationCache {
        if (!AnimationCache.instance) {
            AnimationCache.instance = new AnimationCache();
        }
        return AnimationCache.instance;
    }

    /**
     * Get cached frames by key
     */
    public get(key: string): Texture[] | undefined {
        return this.cache.get(key);
    }

    /**
     * Set frames to cache
     */
    public set(key: string, frames: Texture[]): void {
        this.cache.set(key, frames);
        console.log(`🎬 Cached ${frames.length} frames for key: ${key}`);
    }

    /**
     * Check if key exists in cache
     */
    public has(key: string): boolean {
        return this.cache.has(key);
    }

    /**
     * Clear specific cache entry
     */
    public delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            console.log(`🗑️ Cleared cache for key: ${key}`);
        }
        return deleted;
    }

    /**
     * Clear all cache
     */
    public clear(): void {
        this.cache.clear();
        console.log('🧹 Animation cache cleared completely');
    }

    /**
     * Get cache statistics
     */
    public getCacheInfo(): AnimationCacheInfo {
        const info: AnimationCacheInfo = {};
        this.cache.forEach((frames, key) => {
            info[key] = frames.length;
        });
        return info;
    }

    /**
     * Get total memory usage estimation
     */
    public getMemoryUsage(): number {
        let totalFrames = 0;
        this.cache.forEach((frames) => {
            totalFrames += frames.length;
        });
        return totalFrames;
    }

    /**
     * Preload multiple cache entries
     */
    public async preloadMultiple(entries: { key: string; loader: () => Promise<Texture[]> }[]): Promise<void> {
        console.log(`🔄 Preloading ${entries.length} animation cache entries...`);
        
        const promises = entries.map(async (entry) => {
            if (!this.has(entry.key)) {
                const frames = await entry.loader();
                this.set(entry.key, frames);
            }
        });

        await Promise.all(promises);
        console.log('✅ All animation cache entries preloaded');
    }
} 