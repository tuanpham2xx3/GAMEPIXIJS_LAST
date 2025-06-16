import { Howl, Howler } from 'howler';

export interface AudioConfig {
    volume?: number;
    loop?: boolean;
    rate?: number;
    autoplay?: boolean;
}

export interface AudioAsset {
    name: string;
    src: string[];
    config?: AudioConfig;
}

export class AudioManager {
    private static instance: AudioManager;
    private audioCache: Map<string, Howl> = new Map();
    private masterVolume: number = 1.0;
    private musicVolume: number = 0.7;
    private sfxVolume: number = 0.8;

    // Audio paths configuration
    private static readonly AUDIO_PATHS = {
        // Background Music
        MENU_MUSIC: 'audios/music_bg.mp3',
        GAME_MUSIC: 'audios/music_bg_2.mp3',
        BOSS_MUSIC: 'audios/music_bg.mp3', // Using same as menu for now

        // Sound Effects
        SHOOT: 'audios/sfx_shoot.mp3',
        EXPLOSION: 'audios/sfx_explosion.mp3',
        ENEMY_HIT: 'audios/sfx_enemy_explode.mp3',
        PLAYER_HIT: 'audios/sfx_warning.mp3',
        COIN_COLLECT: 'audios/sfx_coin.mp3',
        POWER_UP: 'audios/sfx_booster_collected.mp3',
        BUTTON_CLICK: 'audios/sfx_shoot.mp3', // Using shoot sound as button click
        GAME_OVER: 'audios/sfx_warning.mp3',
        LEVEL_COMPLETE: 'audios/sfx_booster_collected.mp3',

        // Boss Sounds
        BOSS_APPEAR: 'audios/sfx_warning.mp3',
        BOSS_ATTACK: 'audios/sfx_explosion.mp3',
        BOSS_DEATH: 'audios/sfx_enemy_explode.mp3',

        // UI Sounds
        MENU_SELECT: 'audios/sfx_shoot.mp3',
        MENU_BACK: 'audios/sfx_shoot.mp3',
        PAUSE: 'audios/sfx_warning.mp3',
        UNPAUSE: 'audios/sfx_coin.mp3'
    };

    private constructor() {
        console.log('🔊 Initializing AudioManager...');
        this.setupHowler();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            console.log('🆕 Creating new AudioManager instance...');
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * Setup Howler global settings
     */
    private setupHowler(): void {
        // Set global volume
        Howler.volume(this.masterVolume);
        
        // Setup audio context unlock for mobile
        Howler.autoUnlock = true;
        
        console.log('✅ Howler setup complete');
    }

    /**
     * Get audio paths
     */
    public static get paths() {
        return this.AUDIO_PATHS;
    }

    /**
     * Load a single audio file
     */
    public async loadAudio(name: string, src: string | string[], config: AudioConfig = {}): Promise<Howl> {
        console.log(`🎵 Loading audio: ${name}`);
        
        if (this.audioCache.has(name)) {
            console.log(`✅ Audio already loaded: ${name}`);
            return this.audioCache.get(name)!;
        }

        return new Promise((resolve, reject) => {
            const howl = new Howl({
                src: Array.isArray(src) ? src : [src],
                volume: config.volume || 1.0,
                loop: config.loop || false,
                rate: config.rate || 1.0,
                autoplay: config.autoplay || false,
                onload: () => {
                    console.log(`✅ Audio loaded successfully: ${name}`);
                    this.audioCache.set(name, howl);
                    resolve(howl);
                },
                onloaderror: (id, error) => {
                    console.error(`❌ Failed to load audio: ${name}`, error);
                    reject(error);
                }
            });
        });
    }

    /**
     * Load multiple audio files
     */
    public async loadMultipleAudios(assets: AudioAsset[]): Promise<void> {
        console.log(`🎵 Loading ${assets.length} audio files...`);
        
        const promises = assets.map(asset => 
            this.loadAudio(asset.name, asset.src, asset.config)
        );

        try {
            await Promise.all(promises);
            console.log('✅ All audio files loaded successfully!');
        } catch (error) {
            console.error('❌ Failed to load some audio files:', error);
            throw error;
        }
    }

    /**
     * Preload essential game audio
     */
    public async preloadEssentialAudio(): Promise<void> {
        console.log('🎵 Preloading essential audio...');

        const essentialAudio: AudioAsset[] = [
            // Music
            { 
                name: 'menuMusic', 
                src: [AudioManager.paths.MENU_MUSIC], 
                config: { loop: true, volume: this.musicVolume } 
            },
            { 
                name: 'gameMusic', 
                src: [AudioManager.paths.GAME_MUSIC], 
                config: { loop: true, volume: this.musicVolume } 
            },

            // Essential SFX
            { 
                name: 'shoot', 
                src: [AudioManager.paths.SHOOT], 
                config: { volume: this.sfxVolume } 
            },
            { 
                name: 'explosion', 
                src: [AudioManager.paths.EXPLOSION], 
                config: { volume: this.sfxVolume } 
            },
            { 
                name: 'coinCollect', 
                src: [AudioManager.paths.COIN_COLLECT], 
                config: { volume: this.sfxVolume } 
            },
            { 
                name: 'buttonClick', 
                src: [AudioManager.paths.BUTTON_CLICK], 
                config: { volume: this.sfxVolume } 
            }
        ];

        try {
            await this.loadMultipleAudios(essentialAudio);
            console.log('✅ Essential audio preloaded successfully!');
        } catch (error) {
            console.error('❌ Failed to preload essential audio:', error);
            // Don't throw error, game should continue without audio
        }
    }

    /**
     * Play audio by name
     */
    public play(name: string, config?: { volume?: number; rate?: number; loop?: boolean }): number | null {
        const audio = this.audioCache.get(name);
        if (!audio) {
            console.warn(`⚠️ Audio not found: ${name}`);
            return null;
        }

        // Apply temporary config if provided
        if (config) {
            if (config.volume !== undefined) audio.volume(config.volume);
            if (config.rate !== undefined) audio.rate(config.rate);
            if (config.loop !== undefined) audio.loop(config.loop);
        }

        const soundId = audio.play();
        console.log(`🔊 Playing audio: ${name} (ID: ${soundId})`);
        return soundId;
    }

    /**
     * Stop audio by name
     */
    public stop(name: string, soundId?: number): void {
        const audio = this.audioCache.get(name);
        if (!audio) {
            console.warn(`⚠️ Audio not found: ${name}`);
            return;
        }

        if (soundId !== undefined) {
            audio.stop(soundId);
        } else {
            audio.stop();
        }
        console.log(`⏹️ Stopped audio: ${name}`);
    }

    /**
     * Pause audio by name
     */
    public pause(name: string, soundId?: number): void {
        const audio = this.audioCache.get(name);
        if (!audio) {
            console.warn(`⚠️ Audio not found: ${name}`);
            return;
        }

        if (soundId !== undefined) {
            audio.pause(soundId);
        } else {
            audio.pause();
        }
        console.log(`⏸️ Paused audio: ${name}`);
    }

    /**
     * Resume audio by name
     */
    public resume(name: string, soundId?: number): void {
        const audio = this.audioCache.get(name);
        if (!audio) {
            console.warn(`⚠️ Audio not found: ${name}`);
            return;
        }

        if (soundId !== undefined) {
            audio.play(soundId);
        } else {
            audio.play();
        }
        console.log(`▶️ Resumed audio: ${name}`);
    }

    /**
     * Set volume for specific audio
     */
    public setVolume(name: string, volume: number, soundId?: number): void {
        const audio = this.audioCache.get(name);
        if (!audio) {
            console.warn(`⚠️ Audio not found: ${name}`);
            return;
        }

        if (soundId !== undefined) {
            audio.volume(volume, soundId);
        } else {
            audio.volume(volume);
        }
        console.log(`🔊 Set volume for ${name}: ${volume}`);
    }

    /**
     * Set master volume
     */
    public setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        Howler.volume(this.masterVolume);
        console.log(`🔊 Master volume set to: ${this.masterVolume}`);
    }

    /**
     * Set music volume
     */
    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        
        // Update all music tracks
        const musicTracks = ['menuMusic', 'gameMusic', 'bossMusic'];
        musicTracks.forEach(track => {
            if (this.audioCache.has(track)) {
                this.setVolume(track, this.musicVolume);
            }
        });
        
        console.log(`🎵 Music volume set to: ${this.musicVolume}`);
    }

    /**
     * Set SFX volume
     */
    public setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 SFX volume set to: ${this.sfxVolume}`);
    }

    /**
     * Mute all audio
     */
    public mute(): void {
        Howler.mute(true);
        console.log('🔇 All audio muted');
    }

    /**
     * Unmute all audio
     */
    public unmute(): void {
        Howler.mute(false);
        console.log('🔊 All audio unmuted');
    }

    /**
     * Stop all audio
     */
    public stopAll(): void {
        this.audioCache.forEach((audio, name) => {
            audio.stop();
        });
        console.log('⏹️ All audio stopped');
    }

    /**
     * Get audio info
     */
    public getAudioInfo(name: string): any {
        const audio = this.audioCache.get(name);
        if (!audio) {
            return null;
        }

        return {
            name,
            duration: audio.duration(),
            volume: audio.volume(),
            rate: audio.rate(),
            loop: audio.loop(),
            playing: audio.playing(),
            state: audio.state()
        };
    }

    /**
     * Get all loaded audio names
     */
    public getLoadedAudioNames(): string[] {
        return Array.from(this.audioCache.keys());
    }

    /**
     * Clear audio cache
     */
    public clearCache(): void {
        this.audioCache.forEach((audio, name) => {
            audio.unload();
        });
        this.audioCache.clear();
        console.log('🗑️ Audio cache cleared');
    }

    /**
     * Check if audio is loaded
     */
    public isLoaded(name: string): boolean {
        return this.audioCache.has(name);
    }

    /**
     * Get cache info
     */
    public getCacheInfo(): { [key: string]: any } {
        const info: { [key: string]: any } = {};
        this.audioCache.forEach((audio, name) => {
            info[name] = this.getAudioInfo(name);
        });
        return info;
    }
} 