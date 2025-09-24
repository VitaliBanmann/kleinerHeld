class MoveableObject {
    x = 100;
    y = 500;
    img;
    height = 50;
    width = 50;
    speed = 5;
   
    imageCache = {};

    HitboxOffsetX = 0;
    HitboxOffsetY = 0;
    HitboxWidth = null;
    HitboxHeight = null;

    /**
     * Lädt ein einzelnes Bild und setzt es als aktuelles Sprite.
     * @param {string} path Bildpfad
     */
    loadImage(path) {
        const image = new Image();
        image.src = path;
        this.img = image;
    }

    /**
     * Lädt mehrere Bilder in den Cache (für Animationen).
     * @param {string[]} arr Pfadliste
     */
    loadImages(arr) {
        arr.forEach((path) => {
            let image = new Image();
            image.src = path;
            this.imageCache[path] = image;
        });
    }

    /**
     * Überträgt alle übergebenen Eigenschaften in die Instanz.
     * @param {Object} def Plain-Objekt mit zu übernehmenden Feldern
     */
    applyDefinition(def) {
        Object.assign(this, def);
    }

    /**
     * Bewegt Objekt nach rechts (einfache Hilfsfunktion).
     * Setzt direction=false (Blick nach rechts).
     */
    moveRight() {
        this.x += this.speed;
        this.direction = false;
    }

    /**
     * Bewegt Objekt nach links.
     * Setzt direction=true (Blick nach links).
     */
    moveLeft() {
        this.x -= this.speed;
        this.direction = true;
    }

    /**
     * Wendet Schaden an (sofern health definiert und noch nicht tot).
     * Setzt Hurt-State kurzzeitig, ruft bei <=0 HP die Todeslogik auf.
     * @param {number} [amount=0] Schadensmenge
     */
    takeDamage(amount = 0) {
        if (this.invulnActive) return;
        if (typeof this.health !== 'number') return;
        if (this.isDead) return;

        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.die();
            return;
        }
        this.isHurt = true;
        this.setState?.('hurt', { reset: true });
        setTimeout(() => {
            this.isHurt = false;
        }, 300);
    }

    /**
     * Markiert Objekt als tot und setzt Death-Animation (falls vorhanden).
     */
    die() {
        if (this.isDead) return;
        this.isDead = true;
        this.setState?.('death', { reset: true });
        this._deathStartedAt = performance.now ? performance.now() : Date.now();
    }

    /**
     * Generic animation update loop.
     * Uses animations[state], frameIndex and a per-state or default duration.
     * Death state advances once to last frame and then stops.
     * @param {number} dt Delta time in ms
     * @returns {void}
     */
    updateAnimation(dt) {
        if (!this.animations || !this.state) return;
        const frames = this.animations[this.state];
        if (!frames || !frames.length) return;
        const dur = this.resolveFrameDuration(this.state);
        this._animAcc = (this._animAcc || 0) + dt;
        this.stepAnimationFrames(frames, dur);
    }

    /** Resolves frame duration using optional getFrameDurationForState. */
    resolveFrameDuration(state) {
        return (this.getFrameDurationForState?.(state)) || this.frameDuration || 200;
    }

    /** Consumes accumulator and steps frames; handles death specially. */
    stepAnimationFrames(frames, dur) {
        while (this._animAcc >= dur) {
            this._animAcc -= dur;
            if (this.state === 'death') { this.advanceDeathFrame(frames); return; }
            this.frameIndex = (this.frameIndex + 1) % frames.length;
        }
    }

    /** Advances death animation and flags completion at last frame. */
    advanceDeathFrame(frames) {
        if (this.frameIndex < frames.length - 1) {
            this.frameIndex++;
            if (this.frameIndex === frames.length - 1) {
                this.deathAnimationPlayed = true;
                this.deathAnimationComplete = true;
            }
        }
    }
}

window.MoveableObject = MoveableObject;