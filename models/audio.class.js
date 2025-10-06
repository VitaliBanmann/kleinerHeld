class AudioManager {
    static isAudioUnlocked = false;
    static currentAudioElement = null;
    static currentPlaylist = [];
    static currentPlaylistIndex = 0;
    static isMuted = false;
    static volumeLevels = { music: 0.4, soundEffects: 0.9 };
    static musicTracks = { menu: null, themes: [] };
    static soundEffects = {
        sword: null,
        spear: null,
        bossDemon: null,
        bossDragon: null,
        bossTroll: null,
        death: null,
        gameOver: null,
        jump: null,
        win: null
    };

    /**
     * Init: lädt alle Audio-Ressourcen und stellt Mute/Volume ein.
     */
    static init() {
        const savedMuteSetting = localStorage.getItem('kleinerheld-muted');
        if (savedMuteSetting !== null) {
            this.isMuted = JSON.parse(savedMuteSetting);
        }

        this.initializeMenuMusicTrack();
        this.initializeThemeMusicTracks();
        this.initializeSoundEffects();

        this.setMuteState(this.isMuted);
    }

    static initializeMenuMusicTrack() {
        const menuAudioElement = new Audio('./assets/audio/Music/menu.m4a');
        menuAudioElement.loop = true;
        menuAudioElement.volume = this.volumeLevels.music;
        this.musicTracks.menu = menuAudioElement;
    }

    static initializeThemeMusicTracks() {
        this.musicTracks.themes = [
            new Audio('./assets/audio/Music/theme1.m4a'),
            new Audio('./assets/audio/Music/theme2.m4a'),
            new Audio('./assets/audio/Music/theme3.m4a')
        ];
        this.musicTracks.themes.forEach(themeAudioElement => {
            themeAudioElement.volume = this.volumeLevels.music;
            themeAudioElement.loop = false;
        });
    }

    static initializeSoundEffects() {
        this.soundEffects.sword = new Audio('./assets/audio/sword.mp3');
        this.soundEffects.spear = new Audio('./assets/audio/spear.mp3');
        this.soundEffects.bossDemon = new Audio('./assets/audio/demon.mp3');
        this.soundEffects.bossDragon = new Audio('./assets/audio/dragon.mp3');
        this.soundEffects.bossTroll = new Audio('./assets/audio/troll.mp3');
        this.soundEffects.death = new Audio('./assets/audio/death-sound.mp3');
        this.soundEffects.gameOver = new Audio('./assets/audio/game-over.mp3');
        this.soundEffects.jump = new Audio('./assets/audio/jump2.mp3');
        this.soundEffects.win = new Audio('./assets/audio/win.mp3');
        Object.values(this.soundEffects).forEach(audioElement => {
            if (audioElement) audioElement.volume = this.volumeLevels.soundEffects;
        });
    }

    /**
     * Früher: startUserGestureUnlock
     */
    static startUserGestureHook() {
        const unlockAudio = () => {
            this.isAudioUnlocked = true;
            if (window.world?.currentLevel) {
                this.playThemeForLevel(window.world.currentLevel);
            } else {
                this.playMenu();
            }
        };
        document.addEventListener('pointerdown', unlockAudio, { once: true });
    }

    /**
     * Früher: stopMusicPlayback
     */
    static stopMusic() {
        if (this.currentAudioElement) {
            this.currentAudioElement.pause();
            this.currentAudioElement = null;
        }
        this.stopMusicPlaylist();
    }

    static stopMusicPlaylist() {
        this.currentPlaylist = [];
        this.currentPlaylistIndex = 0;
        this.musicTracks.themes.forEach(themeAudioElement => {
            if (themeAudioElement) {
                themeAudioElement.pause();
                themeAudioElement.currentTime = 0;
            }
        });
    }

    /**
     * Früher: playMenuMusic
     */
    static playMenu() {
        if (!this.isAudioUnlocked) return;
        this.stopMusic();
        this.currentAudioElement = this.musicTracks.menu;
        if (this.currentAudioElement) {
            this.currentAudioElement.currentTime = 0;
            this.currentAudioElement.play().catch(() => {});
        }
    }

    /**
     * Früher: playThemeMusicForLevel
     */
    static playThemeForLevel(levelReference) {
        if (!this.isAudioUnlocked) return;
        this.stopMusic();
        let themeIndex = 0;
        if (levelReference === window.level2) themeIndex = 1;
        if (levelReference === window.level3) themeIndex = 2;
        this.startThemeMusicPlaylist(themeIndex);
    }

    static startThemeMusicPlaylist(startIndex = 0) {
        this.setPlaylistToThemes();
        if (!this.setPlaylistIndex(startIndex)) return;
        this.playPlaylistAtIndex(this.currentPlaylistIndex);
    }

    static setPlaylistToThemes() {
        this.currentPlaylist = this.musicTracks.themes;
    }

    static setPlaylistIndex(playlistIndex) {
        if (!this.currentPlaylist.length) {
            this.currentPlaylistIndex = 0;
            return false;
        }
        const playlistLength = this.currentPlaylist.length;
        this.currentPlaylistIndex = ((playlistIndex % playlistLength) + playlistLength) % playlistLength;
        return true;
    }

    static playPlaylistAtIndex(playlistIndex) {
        const audioElement = this.currentPlaylist[playlistIndex];
        if (!audioElement) return;
        this.currentAudioElement = audioElement;
        audioElement.currentTime = 0;
        audioElement.onended = () => this.playNextInPlaylist();
        audioElement.play().catch(() => {});
    }

    static playNextInPlaylist() {
        this.currentPlaylistIndex = (this.currentPlaylistIndex + 1) % this.currentPlaylist.length;
        this.playPlaylistAtIndex(this.currentPlaylistIndex);
    }

    static setMuteState(muteState) {
        this.isMuted = muteState;
        localStorage.setItem('kleinerheld-muted', JSON.stringify(muteState));

        const allAudioElements = [];
        if (this.musicTracks.menu) allAudioElements.push(this.musicTracks.menu);
        this.musicTracks.themes.forEach(themeAudioElement => themeAudioElement && allAudioElements.push(themeAudioElement));
        Object.values(this.soundEffects).forEach(soundEffectAudioElement => soundEffectAudioElement && allAudioElements.push(soundEffectAudioElement));
        allAudioElements.forEach(audioElement => audioElement.muted = muteState);
    }

    /**
     * Früher: toggleMuteState
     */
    static toggleMute() {
        this.setMuteState(!this.isMuted);
        return this.isMuted;
    }

    /**
     * Früher: playSoundEffect
     * Beinhaltet Legacy-Key-Mapping.
     */
    static playSfx(name) {
        if (this.isMuted) return;
        const map = {
            bosstroll: 'bossTroll',
            bossdragon: 'bossDragon',
            bossdemon: 'bossDemon',
            gameover: 'gameOver'
        };
        const resolved = map[name] || name;
        const soundEffectAudioElement = this.soundEffects[resolved];
        if (!soundEffectAudioElement) return;
        const soundEffectInstance = soundEffectAudioElement.cloneNode(true);
        soundEffectInstance.volume = this.volumeLevels.soundEffects;
        soundEffectInstance.muted = this.isMuted;
        soundEffectInstance.play().catch(() => {});
    }

    // Property wie gehabt für UI
    static get muted() { return this.isMuted; }
    static set muted(v) { this.setMuteState(!!v); }
}

window.AudioManager = AudioManager;