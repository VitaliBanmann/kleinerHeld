class Character extends MoveableObject {
    width = 50;
    height = 50;
    scale = 2;
    direction = false;
    speed = 5;
    speedY = 0;
    acceleration = 0.5;
    jumpPower = 12;
    x = 100;

    health = 100;
    maxHealth = 100;

    // Coins & Powerups
    coins = 0;
    allcoins = 0;
    hearts = 0;
    weaponLevel = 0;
    luckyPowerup = false;
    invulnPowerup = false;
    invulnActive = false;
    invulnCooldown = 0;
    invulnTimer = 0;

    // Angriff
    attackRange = 50;

    // Animation
    imageCache = {};
    currentImage = 0;
    state = 'idle';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;
    frameDurations = {
        default: 200,
        attack: 120,
        attack_extra: 70,
        run: 100
    };
    animAcc = 0;
    animTimer = null;

    // Statusflags
    isHurt = false;
    isDead = false;
    isAttacking = false;
    animationFinished = true;
    deathAnimationPlayed = false;

    // Hitbox
    HitboxOffsetX = 0;
    HitboxOffsetY = 0;
    HitboxWidth = 40;
    HitboxHeight = 50;

    /**
     * @param {number} [groundY=520] Boden-Y zum Platzieren (untere Kante des Sprites).
     */
    constructor(groundY = 520) {
        super();
        /** @type {number} Referenzboden */
        this.groundY = groundY;
        this.y = groundY - (this.height * this.scale);
        this.loadAnimation();
    }

    /**
     * Lädt alle Animationsframes aus globaler CHARACTER_IMAGES Struktur.
     * Erwartetes Format: { state: [{src,width,height,offsetX,offsetY}, ...], ... }
     */
    loadAnimation() {
        for (let [state, frames] of Object.entries(CHARACTER_IMAGES)) {
            this.animations[state] = frames.map(frame => {
                let img = new Image();
                img.src = frame.src;
                return {
                    img,
                    width: frame.width,
                    height: frame.height,
                    offsetX: frame.offsetX,
                    offsetY: frame.offsetY
                };
            });
        }
    }

    /**
     * Aktualisiert Animationsframe basierend auf vergangener Zeit.
     * Delegiert den Verbrauch des Akkumulators an einen Helfer.
     * @param {number} dt Delta Time in ms.
     * @returns {void}
     */
    updateAnimation(dt) {
        if (!this.animations) return;
        const frames = this.animations[this.state];
        if (!frames?.length) return;
        const dur = this.getFrameDurationForState(this.state);
        this.animAcc = (this.animAcc || 0) + dt;
        this.consumeAnimationAccumulator(frames, dur);
    }

    /**
     * Verbraucht den Animationsakkumulator und schaltet bei Bedarf Frames weiter.
     * Behandelt die spezielle Tod-Animation, die im letzten Frame stoppt.
     * @param {{img:HTMLImageElement}[]} frames
     * @param {number} dur Frame-Dauer in ms.
     * @returns {void}
     */
    consumeAnimationAccumulator(frames, dur) {
        while (this.animAcc >= dur) {
            this.animAcc -= dur;
            if (this.state === 'death') { this.advanceDeath(frames); return; }
            this.frameIndex = (this.frameIndex + 1) % frames.length;
        }
    }

    /**
     * Schaltet die Tod-Animation weiter; kennzeichnet, wenn das letzte Frame erreicht ist.
     * @param {{img:HTMLImageElement}[]} frames
     * @returns {void}
     */
    advanceDeath(frames) {
        if (this.frameIndex < frames.length - 1) {
            this.frameIndex++;
            if (this.frameIndex === frames.length - 1) this.deathAnimationPlayed = true;
        }
    }

    /**
     * Haupt-Logik für Zustandswechsel basierend auf Eingaben & Statusflags.
     * Reihenfolge: death > hurt > attack(_extra) > jump > run > idle
     */
    update() {
        if (this.handleImmediateStates()) return;
        if (this.handleAttackInput()) return;
        if (this.resolveAttackEnd()) return;
        if (this.resolveJumpEnd()) return;
        if (this.handleJumpInput()) return;
        this.updateMovementState();
    }

    /**
     * Behandelt unmittelbare Zustände (Tod/Verletzung).
     * @returns {boolean} True, wenn behandelt und ein früherer Ausstieg erfolgt ist.
     */
    handleImmediateStates() {
        if (this.isDead) { this.setState('death'); return true; }
        if (this.isHurt) { this.setState('hurt'); return true; }
        return false;
    }

    /**
     * Liest Angriffs-Eingaben und löst Angriffs-Zustände einmal aus.
     * @returns {boolean} True, wenn ein Angriff gestartet wurde.
     */
    handleAttackInput() {
        if (keyboard.E && this.state !== 'attack') {
            this.setState('attack', { reset: true });
            this.world?.onPlayerAttack?.('attack');
            return true;
        }
        if (keyboard.Q && this.state !== 'attack_extra') {
            this.setState('attack_extra', { reset: true });
            this.world?.onPlayerAttack?.('attack_extra');
            return true;
        }
        return false;
    }

    /**
     * Resolves attack end for supported attack states.
     * Delegates to a generic state resolver.
     * @returns {boolean} True if in an attack state (handled).
     */
    resolveAttackEnd() {
        if (this.state === 'attack_extra') return this.resolveAttackEndState('attack_extra');
        if (this.state === 'attack') return this.resolveAttackEndState('attack');
        return false;
    }

    /**
     * Resolves end of a specific attack state (switches to idle on last frame).
     * @param {'attack'|'attack_extra'} state
     * @returns {boolean} True if state was checked and handled.
     */
    resolveAttackEndState(state) {
        const frames = this.animations[state] || [];
        if (!frames.length) return false;
        if (this.frameIndex === frames.length - 1) this.setState('idle');
        return true;
    }

    /**
     * Verlässt den Sprungzustand, wenn er beendet ist und der Boden erreicht ist.
     * @returns {boolean} True, wenn der Sprungzustand aufgelöst wurde.
     */
    resolveJumpEnd() {
        if (this.state !== 'jump') return false;
        const frames = this.animations['jump'] || [];
        if (this.frameIndex === frames.length - 1 && !this.isAboveGround()) this.setState('idle');
        return true;
    }

    /**
     * Startet einen Sprung, wenn er auf dem Boden ist und noch nicht springt.
     * @returns {boolean} True, wenn ein Sprung initiiert wurde.
     */
    handleJumpInput() {
        if (!keyboard.SPACE) return false;
        this.jump();
        return true;
    }

    /**
     * Wählt zwischen Rennen und Idle basierend auf der horizontalen Eingabe.
     * @returns {void}
     */
    updateMovementState() {
        if (keyboard.LEFT || keyboard.RIGHT) {
            if (this.state !== 'run') this.setState('run');
        } else if (this.state !== 'idle') {
            this.setState('idle');
        }
    }

    /**
     * Startet Sprung falls auf Boden & nicht bereits im jump-State.
     */
    jump() {
        if (!this.isAboveGround() && this.state !== 'jump') {
            this.speedY = -this.jumpPower;
            this.setState('jump', { reset: true });
        }
    }

    /**
     * Returns frame duration for the current state, using a per-state map.
     * Falls back to default if not present.
     * @param {string} state
     * @returns {number}
     */
    getFrameDurationForState(state) {
        const map = this.frameDurations || {};
        if (state && map[state] != null) return map[state];
        if (map.default != null) return map.default;
        return this.frameDuration ?? 200;
    }

    /**
     * Returns the current animation frame object for drawing.
     * @returns {{img:HTMLImageElement,width?:number,height?:number,sx?:number,sy?:number,sw?:number,sh?:number}|undefined}
     */
    getCurrentFrame() {
        const frames = this.animations?.[this.state];
        if (!frames?.length) return;
        const idx = Math.max(0, Math.min(this.frameIndex || 0, frames.length - 1));
        return frames[idx];
    }

    /**
     * Setzt den Zustand (Animation) und optional den Frame-Index und Zeitakkumulator zurück.
     * @param {string} newState Neuer Zustand.
     * @param {{reset?:boolean}} [options] Optionaler Paramter-Objekt.
     * @property {boolean} reset Wenn true, wird der Frame-Index und Zeitakkumulator zurückgesetzt.
     */
    setState(newState, opts = {}) {
        const reset = !!opts.reset || this.state !== newState;
        this.state = newState;
        if (reset) { this.frameIndex = 0; this.animAcc = 0; }
        if (newState !== 'attack' && newState !== 'attack_extra') this.isAttacking = false;
        if (newState === 'death') { this.isDead = true; this.deathAnimationPlayed = false; }
    }

    /**
     * Returns true if the character's bottom is above the ground line.
     * @returns {boolean}
     */
    isAboveGround() {
        const groundY = this.groundY ?? 520;
        const bottom = (this.y ?? 0) + (this.height * this.scale);
        return bottom < groundY - 0.5;
    }

    /**
     * Basic vertical physics: gravity and ground collision.
     * @param {number} dt Delta time in ms
     * @returns {void}
     */
    updatePhysics(dt = 16) {
        const f = (typeof dt === 'number' && isFinite(dt)) ? dt / 16 : 1;
        if (this.isAboveGround() || this.speedY < 0) {
            this.y += this.speedY * f;
            this.speedY += this.acceleration * f;
        }
        const groundTop = (this.groundY ?? 520) - (this.height * this.scale);
        if (this.y >= groundTop) { this.y = groundTop; this.speedY = 0; }
    }
}