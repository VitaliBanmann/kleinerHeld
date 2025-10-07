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
        jump: null,
        win: null
    };

    /**
     * Initializes the audio system:
     * - Restores mute state from localStorage.
     * - Preloads menu/theme tracks and SFX.
     * - Applies the mute state to all audio elements.
     * @returns {void}
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

    /**
     * Creates and configures the looping menu music track.
     * @returns {void}
     */
    static initializeMenuMusicTrack() {
        const menuAudioElement = new Audio('./assets/audio/Music/menu.m4a');
        menuAudioElement.loop = true;
        menuAudioElement.volume = this.volumeLevels.music;
        this.musicTracks.menu = menuAudioElement;
    }

    /**
     * Creates and configures the non-looping theme music tracks.
     * @returns {void}
     */
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

    /**
     * Preloads all sound effects and sets their default volume.
     * @returns {void}
     */
    static initializeSoundEffects() {
        this.soundEffects.sword = new Audio('./assets/audio/sword.mp3');
        this.soundEffects.spear = new Audio('./assets/audio/spear.mp3');
        this.soundEffects.bossDemon = new Audio('./assets/audio/demon.mp3');
        this.soundEffects.bossDragon = new Audio('./assets/audio/dragon.mp3');
        this.soundEffects.bossTroll = new Audio('./assets/audio/troll.mp3');
        this.soundEffects.death = new Audio('./assets/audio/death-sound.mp3');
        this.soundEffects.jump = new Audio('./assets/audio/jump2.mp3');
        this.soundEffects.win = new Audio('./assets/audio/win.mp3');
        Object.values(this.soundEffects).forEach(audioElement => {
            if (audioElement) audioElement.volume = this.volumeLevels.soundEffects;
        });
    }

    /**
     * Installs a one-time user-gesture hook to unlock audio playback.
     * Starts menu music or the level theme after the first pointerdown.
     * @returns {void}
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
     * Stops any currently playing music and resets the playlist.
     * @returns {void}
     */
    static stopMusic() {
        if (this.currentAudioElement) {
            this.currentAudioElement.pause();
            this.currentAudioElement = null;
        }
        this.stopMusicPlaylist();
    }

    /**
     * Clears the active playlist and resets/rewinds theme tracks.
     * @returns {void}
     */
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
     * Plays the looping menu music (if audio is unlocked).
     * @returns {void}
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
     * Selects and plays a theme playlist based on the level reference.
     * Level 1 -> index 0, level 2 -> index 1, level 3 -> index 2.
     * @param {any} levelReference Reference to the active level (e.g., window.level2)
     * @returns {void}
     */
    static playThemeForLevel(levelReference) {
        if (!this.isAudioUnlocked) return;
        this.stopMusic();
        let themeIndex = 0;
        if (levelReference === window.level2) themeIndex = 1;
        if (levelReference === window.level3) themeIndex = 2;
        this.startThemeMusicPlaylist(themeIndex);
    }

    /**
     * Starts the theme music playlist at the given index and begins playback.
     * @param {number} [startIndex=0] Initial track index
     * @returns {void}
     */
    static startThemeMusicPlaylist(startIndex = 0) {
        this.setPlaylistToThemes();
        if (!this.setPlaylistIndex(startIndex)) return;
        this.playPlaylistAtIndex(this.currentPlaylistIndex);
    }

    /**
     * Sets the active playlist to the preloaded theme tracks.
     * @returns {void}
     */
    static setPlaylistToThemes() {
        this.currentPlaylist = this.musicTracks.themes;
    }

    /**
     * Sets the current playlist index with proper wrap-around.
     * Returns false if there is no active playlist.
     * @param {number} playlistIndex Desired playlist index
     * @returns {boolean} True if an index could be set, false otherwise
     */
    static setPlaylistIndex(playlistIndex) {
        if (!this.currentPlaylist.length) {
            this.currentPlaylistIndex = 0;
            return false;
        }
        const playlistLength = this.currentPlaylist.length;
        this.currentPlaylistIndex = ((playlistIndex % playlistLength) + playlistLength) % playlistLength;
        return true;
    }

    /**
     * Plays the track at the given playlist index and sets up auto-advance.
     * @param {number} playlistIndex Index into the current playlist
     * @returns {void}
     */
    static playPlaylistAtIndex(playlistIndex) {
        const audioElement = this.currentPlaylist[playlistIndex];
        if (!audioElement) return;
        this.currentAudioElement = audioElement;
        audioElement.currentTime = 0;
        audioElement.onended = () => this.playNextInPlaylist();
        audioElement.play().catch(() => {});
    }

    /**
     * Advances to the next track in the playlist (with wrap-around) and plays it.
     * @returns {void}
     */
    static playNextInPlaylist() {
        this.currentPlaylistIndex = (this.currentPlaylistIndex + 1) % this.currentPlaylist.length;
        this.playPlaylistAtIndex(this.currentPlaylistIndex);
    }

    /**
     * Applies the mute state to the manager and all known audio elements.
     * Persists the state in localStorage.
     * @param {boolean} muteState Whether audio should be muted
     * @returns {void}
     */
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
     * Toggles mute and returns the resulting state.
     * @returns {boolean} True if muted, false otherwise
     */
    static toggleMute() {
        this.setMuteState(!this.isMuted);
        return this.isMuted;
    }

    /**
     * Plays a sound effect by name.
     * Supports legacy keys via small mapping (e.g., 'bosstroll' -> 'bossTroll').
     * @param {string} effectName Effect name or legacy alias
     * @returns {void}
     */
    static playSfx(effectName) {
        if (this.isMuted) return;
        const legacyKeyMap = {
            bosstroll: 'bossTroll',
            bossdragon: 'bossDragon',
            bossdemon: 'bossDemon'
        };
        const resolvedEffectName = legacyKeyMap[effectName] || effectName;
        const soundEffectAudioElement = this.soundEffects[resolvedEffectName];
        if (!soundEffectAudioElement) return;
        const soundEffectInstance = soundEffectAudioElement.cloneNode(true);
        soundEffectInstance.volume = this.volumeLevels.soundEffects;
        soundEffectInstance.muted = this.isMuted;
        soundEffectInstance.play().catch(() => {});
    }

    /**
     * UI-friendly alias property for the mute state.
     * Setting this property delegates to setMuteState.
     */
    static get muted() { return this.isMuted; }
    static set muted(value) { this.setMuteState(!!value); }
}

window.AudioManager = AudioManager;