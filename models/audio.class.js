class AudioManager {
    static unlocked = false;
    static current = null;
    static playlist = [];
    static playlistIdx = 0;
    static muted = false;
    static volumes = { music: 0.4, sfx: 0.9 };
    static tracks = { menu: null, themes: [] };
    static sfx = { sword: null, spear: null, bossdemon: null, bossdragon: null, bosstroll: null, death: null };

    /**
     * Initializes audio assets and applies volumes/loop settings.
     * Splits work into small helpers to keep this method short.
     * @returns {void}
     */
    static init() {
        const savedMute = localStorage.getItem('kleinerheld-muted');
        if (savedMute !== null) {
            this.muted = JSON.parse(savedMute);
        }
        
        this.initMenuTrack();
        this.initThemeTracks();
        this.initSfx();
        
        this.setMuted(this.muted);
    }

    /**
     * Creates and configures the looping menu track.
     * @returns {void}
     */
    static initMenuTrack() {
        const a = new Audio('./assets/audio/Music/menu.m4a');
        a.loop = true;
        a.volume = this.volumes.music;
        this.tracks.menu = a;
    }

    /**
     * Creates theme tracks and applies default music volume.
     * @returns {void}
     */
    static initThemeTracks() {
        this.tracks.themes = [
            new Audio('./assets/audio/Music/theme1.m4a'),
            new Audio('./assets/audio/Music/theme2.m4a'),
            new Audio('./assets/audio/Music/theme3.m4a'),
        ];
        this.tracks.themes.forEach(a => { a.volume = this.volumes.music; a.loop = false; });
    }

    /**
     * Creates SFX clips and applies default SFX volume.
     * @returns {void}
     */
    static initSfx() {
        this.sfx.sword = new Audio('./assets/audio/sword.mp3');
        this.sfx.spear = new Audio('./assets/audio/spear.mp3');
        this.sfx.bossdemon = new Audio('./assets/audio/demon.mp3');
        this.sfx.bossdragon = new Audio('./assets/audio/dragon.mp3');
        this.sfx.bosstroll = new Audio('./assets/audio/troll.mp3');
        this.sfx.death = new Audio('./assets/audio/death-sound.mp3');
        Object.values(this.sfx).forEach(a => a.volume = this.volumes.sfx);
    }

    /**
     * Setzt einmaligen Pointer-Listener um Autoplay-Beschränkung zu umgehen.
     * Beim ersten Klick wird freigeschaltet und passende Musik gestartet.
     */
    static startUserGestureHook() {
        const unlock = () => {
            this.unlocked = true;
            if (window.world?.currentLevel) {
                this.playThemeForLevel(window.world.currentLevel);
            } else {
                this.playMenu();
            }
        };
        document.addEventListener('pointerdown', unlock, { once: true });
    }

    /**
     * Stoppt aktuelle Musik + Playliste.
     */
    static stopMusic() {
        if (this.current) {
            this.current.pause();
            this.current = null;
        }
        this.stopPlaylist();
    }

    /**
     * Leert Playliste und setzt alle Theme-Tracks zurück.
     */
    static stopPlaylist() {
        this.playlist = [];
        this.playlistIdx = 0;
        this.tracks.themes.forEach(a => {
            if (a) {
                a.pause();
                a.currentTime = 0;
            }
        });
    }

    /**
     * Spielt Menü-Musik (falls freigeschaltet).
     */
    static playMenu() {
        if (!this.unlocked) return;
        this.stopMusic();
        this.current = this.tracks.menu;
        if (this.current) {
            this.current.currentTime = 0;
            this.current.play().catch(()=>{});
        }
    }

    /**
     * Wählt Theme anhand Level-Referenz (z.B. level2 / level3) und startet Schleife.
     * @param {*} levelRef Referenz auf Level (Vergleich mit globalen level2, level3)
     */
    static playThemeForLevel(levelRef) {
        if (!this.unlocked) return;
        this.stopMusic();
        let idx = 0;
        if (levelRef === window.level2) idx = 1;
        if (levelRef === window.level3) idx = 2;
        this.startThemePlaylist(idx);
    }

    /**
     * Startet Themes als fortlaufende Playliste ab Index.
     * Hält die Methode kurz, indem sie an Hilfsfunktionen delegiert.
     * @param {number} [startIdx=0] Startindex
     */
    static startThemePlaylist(startIdx = 0) {
        this.setPlaylistFromThemes();
        if (!this.setPlaylistIndex(startIdx)) return;
        this.playPlaylistIndex(this.playlistIdx);
    }

    /**
     * Setzt die Playliste auf die Theme-Tracks.
     * @returns {void}
     */
    static setPlaylistFromThemes() {
        this.playlist = this.tracks.themes;
    }

    /**
     * Überprüft und wendet den Playlisten-Index an.
     * @param {number} idx
     * @returns {boolean} Wahr, wenn der Index gültig und angewendet ist.
     */
    static setPlaylistIndex(idx) {
        if (!this.playlist.length) { this.playlistIdx = 0; return false; }
        const n = this.playlist.length;
        this.playlistIdx = ((idx % n) + n) % n;
        return true;
    }

    /**
     * Spielt das Playlisten-Element am Index und verbindet onended, um voranzuschreiten.
     * @param {number} i
     * @returns {void}
     */
    static playPlaylistIndex(i) {
        const a = this.playlist[i];
        if (!a) return;
        this.current = a;
        a.currentTime = 0;
        a.onended = () => this.playNextInPlaylist();
        a.play().catch(() => {});
    }

    /**
     * Wechselt zum nächsten Playlisten-Element (mit Umwicklung) und spielt es.
     * @returns {void}
     */
    static playNextInPlaylist() {
        this.playlistIdx = (this.playlistIdx + 1) % this.playlist.length;
        this.playPlaylistIndex(this.playlistIdx);
    }

    /**
     * Setzt globalen Mute-Status für alle Audios.
     * @param {boolean} m Neuer Mute-Status
     */
    static setMuted(m) {
        this.muted = m;
        localStorage.setItem('kleinerheld-muted', JSON.stringify(m));
        
        const all = [];
        if (this.tracks.menu) all.push(this.tracks.menu);
        this.tracks.themes.forEach(t => t && all.push(t));
        Object.values(this.sfx).forEach(s => s && all.push(s));
        all.forEach(a => a.muted = m);
    }

    /**
     * Toggle Mute an/aus.
     * @returns {boolean} Neuer Status
     */
    static toggleMute() {
        this.setMuted(!this.muted);
        return this.muted;
    }

    /**
     * Spielt einen Soundeffekt (klont Instanz für parallele Wiedergabe).
     * @param {keyof AudioManager['sfx']} name Name des Effekts (z.B. 'sword')
     */
    static playSfx(name) {
        if (this.muted) return;
        const a = this.sfx[name];
        if (!a) return;
        const inst = a.cloneNode(true);
        inst.volume = this.volumes.sfx;
        inst.muted = this.muted;
        inst.play().catch(()=>{});
    }
}

window.AudioManager = AudioManager;