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
     * Initializes all audio assets and applies volume/mute settings.
     * Delegates to helper methods for menu, themes, and sound effects.
     * @returns {void}
     */
    static initializeAudio() {
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
     * Creates theme music tracks and applies default music volume.
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
     * Creates sound effect audio elements and applies default sound effect volume.
     * @returns {void}
     */
    static initializeSoundEffects() {
        this.soundEffects.sword = new Audio('./assets/audio/sword.mp3');
        this.soundEffects.spear = new Audio('./assets/audio/spear.mp3');
        this.soundEffects.bossDemon = new Audio('./assets/audio/demon.mp3');
        this.soundEffects.bossDragon = new Audio('./assets/audio/dragon.mp3');
        this.soundEffects.bossTroll = new Audio('./assets/audio/troll.mp3');
        this.soundEffects.death = new Audio('./assets/audio/death-sound.mp3');
        this.soundEffects.gameOver = new Audio('./assets/audio/game-over.mp3');
        this.soundEffects.jump = new Audio('./assets/audio/jump.mp3');
        this.soundEffects.win = new Audio('./assets/audio/win.mp3');
        Object.values(this.soundEffects).forEach(audioElement => {
            if (audioElement) audioElement.volume = this.volumeLevels.soundEffects;
        });
    }

    /**
     * Sets up a one-time pointer event listener to unlock audio playback on first user gesture.
     * Starts the appropriate music after unlocking.
     * @returns {void}
     */
    static startUserGestureUnlock() {
        const unlockAudio = () => {
            this.isAudioUnlocked = true;
            if (window.world?.currentLevel) {
                this.playThemeMusicForLevel(window.world.currentLevel);
            } else {
                this.playMenuMusic();
            }
        };
        document.addEventListener('pointerdown', unlockAudio, { once: true });
    }

    /**
     * Stops the currently playing music and clears the playlist.
     * @returns {void}
     */
    static stopMusicPlayback() {
        if (this.currentAudioElement) {
            this.currentAudioElement.pause();
            this.currentAudioElement = null;
        }
        this.stopMusicPlaylist();
    }

    /**
     * Clears the music playlist and resets all theme tracks.
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
     * Plays the menu music if audio is unlocked.
     * @returns {void}
     */
    static playMenuMusic() {
        if (!this.isAudioUnlocked) return;
        this.stopMusicPlayback();
        this.currentAudioElement = this.musicTracks.menu;
        if (this.currentAudioElement) {
            this.currentAudioElement.currentTime = 0;
            this.currentAudioElement.play().catch(() => {});
        }
    }

    /**
     * Selects and plays the theme music for the given level reference.
     * @param {*} levelReference - Reference to the current level (e.g., window.level2, window.level3)
     * @returns {void}
     */
    static playThemeMusicForLevel(levelReference) {
        if (!this.isAudioUnlocked) return;
        this.stopMusicPlayback();
        let themeIndex = 0;
        if (levelReference === window.level2) themeIndex = 1;
        if (levelReference === window.level3) themeIndex = 2;
        this.startThemeMusicPlaylist(themeIndex);
    }

    /**
     * Starts the theme music playlist from the given index.
     * @param {number} [startIndex=0] - The index to start the playlist from.
     * @returns {void}
     */
    static startThemeMusicPlaylist(startIndex = 0) {
        this.setPlaylistToThemes();
        if (!this.setPlaylistIndex(startIndex)) return;
        this.playPlaylistAtIndex(this.currentPlaylistIndex);
    }

    /**
     * Sets the current playlist to the theme music tracks.
     * @returns {void}
     */
    static setPlaylistToThemes() {
        this.currentPlaylist = this.musicTracks.themes;
    }

    /**
     * Validates and applies the playlist index.
     * @param {number} playlistIndex - The index to set.
     * @returns {boolean} True if the index is valid and applied.
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
     * Plays the audio element at the given playlist index and sets up onended to play the next track.
     * @param {number} playlistIndex - The index in the playlist to play.
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
     * Advances to the next audio element in the playlist (with wrap-around) and plays it.
     * @returns {void}
     */
    static playNextInPlaylist() {
        this.currentPlaylistIndex = (this.currentPlaylistIndex + 1) % this.currentPlaylist.length;
        this.playPlaylistAtIndex(this.currentPlaylistIndex);
    }

    /**
     * Sets the global mute state for all audio elements.
     * @param {boolean} muteState - The new mute state.
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
     * Toggles the mute state on or off.
     * @returns {boolean} The new mute state.
     */
    static toggleMuteState() {
        this.setMuteState(!this.isMuted);
        return this.isMuted;
    }

    /**
     * Plays a sound effect by name (clones the audio element for parallel playback).
     * @param {keyof AudioManager['soundEffects']} soundEffectName - The name of the sound effect (e.g., 'sword').
     * @returns {void}
     */
    static playSoundEffect(soundEffectName) {
        if (this.isMuted) return;
        const soundEffectAudioElement = this.soundEffects[soundEffectName];
        if (!soundEffectAudioElement) return;
        const soundEffectInstance = soundEffectAudioElement.cloneNode(true);
        soundEffectInstance.volume = this.volumeLevels.soundEffects;
        soundEffectInstance.muted = this.isMuted;
        soundEffectInstance.play().catch(() => {});
    }
}

window.AudioManager = AudioManager;