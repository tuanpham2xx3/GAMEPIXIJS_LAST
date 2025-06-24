import { Howl, Howler } from 'howler';

export interface AudioConfig {
    volume?: number;
    loop?: boolean;
}

export class AudioManager {
    private static instance: AudioManager;
    private audioCache: Map<string, Howl> = new Map();
    private masterVolume: number = 1.0;
    private musicVolume: number = 0.7;
    private sfxVolume: number = 0.8;
    
    // Track current music state
    private currentMusic: string | null = null;
    private isAudioLoaded: boolean = false;

    // Audio paths - simplified according to requirements
    private static readonly AUDIO_PATHS = {
        // Background Music
        BACKGROUND_MUSIC: 'audios/music_bg.mp3',      // Chạy mọi lúc trong game
        BOSS_MUSIC: 'audios/music_bg_2.mp3',          // Khi có boss

        // Sound Effects
        BOOSTER_COLLECTED: 'audios/sfx_booster_collected.mp3',  // Player chạm booster
        COIN_COLLECT: 'audios/sfx_coin.mp3',                    // Player chạm coin
        ENEMY_EXPLOSION: 'audios/sfx_enemy_explode.mp3',        // Quái die
        PLAYER_EXPLOSION: 'audios/sfx_explosion.mp3',           // Player die
        SHOOT: 'audios/sfx_shoot.mp3',                          // Player shooting
        WARNING: 'audios/sfx_warning.mp3',                      // Warning bosswave
        WIN: 'audios/sfx_win.mp3',                               // Chiến thắng game
        LOSE: 'audios/sfx_lose.mp3'                             // Thua game
    };

    private constructor() {
        console.log('Initializing AudioManager...');
        this.setupHowler();
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    private setupHowler(): void {
        Howler.volume(this.masterVolume);
        Howler.autoUnlock = true;
        console.log('AudioManager initialized');
    }

    /**
     * Load essential game audio
     */
    public async loadGameAudio(): Promise<void> {
        if (this.isAudioLoaded) {
            console.log('Audio already loaded, skipping...');
            return;
        }

        console.log('🎵 Loading game audio...');

        const audioPromises = [
            // Background Music
            this.loadAudio('backgroundMusic', AudioManager.AUDIO_PATHS.BACKGROUND_MUSIC, { 
                loop: true, 
                volume: this.musicVolume 
            }),
            this.loadAudio('bossMusic', AudioManager.AUDIO_PATHS.BOSS_MUSIC, { 
                loop: true, 
                volume: this.musicVolume 
            }),

            // Sound Effects
            this.loadAudio('boosterCollected', AudioManager.AUDIO_PATHS.BOOSTER_COLLECTED, { 
                volume: this.sfxVolume 
            }),
            this.loadAudio('coinCollect', AudioManager.AUDIO_PATHS.COIN_COLLECT, { 
                volume: this.sfxVolume 
            }),
            this.loadAudio('enemyExplosion', AudioManager.AUDIO_PATHS.ENEMY_EXPLOSION, { 
                volume: this.sfxVolume 
            }),
            this.loadAudio('playerExplosion', AudioManager.AUDIO_PATHS.PLAYER_EXPLOSION, { 
                volume: this.sfxVolume 
            }),
            this.loadAudio('shoot', AudioManager.AUDIO_PATHS.SHOOT, { 
                volume: this.sfxVolume 
            }),
            this.loadAudio('warning', AudioManager.AUDIO_PATHS.WARNING, { 
                volume: this.sfxVolume 
            }),
            this.loadAudio('win', AudioManager.AUDIO_PATHS.WIN, { 
                volume: this.sfxVolume 
            }),
            this.loadAudio('lose', AudioManager.AUDIO_PATHS.LOSE, { 
                volume: this.sfxVolume 
            })
        ];

        try {
            await Promise.all(audioPromises);
            this.isAudioLoaded = true;
            console.log('All game audio loaded successfully!');
        } catch (error) {
            console.error('Failed to load some audio files:', error);
        }
    }

    private async loadAudio(name: string, src: string, config: AudioConfig = {}): Promise<Howl> {
        if (this.audioCache.has(name)) {
            return this.audioCache.get(name)!;
        }

        return new Promise((resolve, reject) => {
            const howl = new Howl({
                src: [src],
                volume: config.volume || 1.0,
                loop: config.loop || false,
                onload: () => {
                    this.audioCache.set(name, howl);
                    resolve(howl);
                },
                onloaderror: (id, error) => {
                    console.error(`Failed to load audio: ${name}`, error);
                    reject(error);
                }
            });
        });
    }

    // Music methods
    public playBackgroundMusic(): void {
        if (this.currentMusic === 'backgroundMusic') {
            console.log('Background music already playing');
            return;
        }
        
        this.stopAllMusic();
        this.currentMusic = 'backgroundMusic';
        this.play('backgroundMusic');
        console.log('Started background music');
    }

    public playBossMusic(): void {
        if (this.currentMusic === 'bossMusic') {
            console.log('Boss music already playing');
            return;
        }
        
        this.stopAllMusic();
        this.currentMusic = 'bossMusic';
        this.play('bossMusic');
        console.log('Started boss music');
    }

    public stopAllMusic(): void {
        this.stop('backgroundMusic');
        this.stop('bossMusic');
        this.currentMusic = null;
    }

    // SFX methods
    public playBoosterCollected(): void {
        this.play('boosterCollected');
    }

    public playCoinCollect(): void {
        this.play('coinCollect');
    }

    public playEnemyExplosion(): void {
        this.play('enemyExplosion');
    }

    public playPlayerExplosion(): void {
        this.play('playerExplosion');
    }

    public playShoot(): void {
        this.play('shoot');
    }

    public playWarning(): void {
        this.play('warning');
    }

    public playWin(): void {
        this.play('win');
    }

    public playLose(): void {
        this.play('lose');
    }

    // Basic audio control
    private play(name: string): number | null {
        const audio = this.audioCache.get(name);
        if (!audio) {
            console.warn(`Audio not found: ${name}`);
            return null;
        }
        return audio.play();
    }

    private stop(name: string): void {
        const audio = this.audioCache.get(name);
        if (audio) {
            audio.stop();
        }
    }

    // Volume controls
    public setMasterVolume(volume: number): void {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        Howler.volume(this.masterVolume);
    }

    public setMusicVolume(volume: number): void {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.setVolume('backgroundMusic', this.musicVolume);
        this.setVolume('bossMusic', this.musicVolume);
    }

    public setSfxVolume(volume: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        // Update all SFX volumes
        const sfxList = ['boosterCollected', 'coinCollect', 'enemyExplosion', 'playerExplosion', 'shoot', 'warning', 'win', 'lose'];
        sfxList.forEach(sfx => this.setVolume(sfx, this.sfxVolume));
    }

    private setVolume(name: string, volume: number): void {
        const audio = this.audioCache.get(name);
        if (audio) {
            audio.volume(volume);
        }
    }

    // Global controls
    public mute(): void {
        Howler.mute(true);
    }

    public unmute(): void {
        Howler.mute(false);
    }

    public stopAll(): void {
        this.audioCache.forEach(audio => audio.stop());
    }
} 