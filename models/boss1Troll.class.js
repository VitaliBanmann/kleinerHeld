class BossTroll extends MoveableObject {
    x = 100;
    img = './assets/boss/1trolls/Troll_IDLE0.png';
    scale = 0.3;
    width = 125;
    height = 150;
    direction = true;
    speed = 0.7;
    health = 30;
    maxHealth = 30;
    bossSoundRange = 800;

    // Hitbox
    HitboxOffsetX = -230;
    HitboxOffsetY = -375;
    HitboxWidth = 400;
    HitboxHeight = 520;

    // Statusflags
    isHurt = false;
    isDead = false;
    animationFinished = true;
    deathAnimationPlayed = false;
    deathAnimationComplete = false;
    isAttacking = false;

    attackCooldown = 0.5;
    attackRange = 100;
    attackDamage = 20;
    state = 'run';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;

    /**
     * Konstruktor – positioniert Boss auf fester X (Ende der Map) und lädt Animationen.
     * @param {number} [groundY=520] Boden-Y zum Platzieren.
     */
    constructor(groundY = 520) {
        super();
        this.loadImage(this.img);
        this.x = 10600;
        this.speed = 0.5 + Math.random() * 1.5;
        this.loadAnimations();
        this.y = groundY - (this.height * this.scale);
    }

    /**
     * Lädt alle Animations-Frames aus globaler TROLL_IMAGES Struktur.
     * Erwartetes Format: { state: [{src,width,height,offsetX,offsetY}, ...], ... }
     */
    loadAnimations() {
        for (let [state, frames] of Object.entries(TROLL_IMAGES)) {
            this.animations[state] = frames.map(frame => {
                const img = new Image();
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
     * Liefert aktuelles Frame der aktiven Animation.
     * @returns {{img:HTMLImageElement,width:number,height:number,offsetX:number,offsetY:number}|null}
     */
    getCurrentFrame() {
        const frames = this.animations[this.state];
        if (!frames || frames.length === 0) return null;
        return frames[this.frameIndex] || null;
    }

    /**
     * Setzt neuen Zustand (Animation). Optionaler Reset erzwingt Neustart des Frame-Index.
     * @param {string} next Neuer Zielzustand.
     * @param {{reset?:boolean}} [options]
     */
    setState(next, { reset = false } = {}) {
        if (this.state !== next || reset) {
            this.state = next in this.animations ? next : 'idle';
            this.frameIndex = 0;
        }
    }

    /**
     * Aktualisiert den State anhand Statusflags.
     * Reihenfolge: death > hurt > attack > run > idle.
     * @param {number} dt Delta Time (ms).
     */
    update(dt) {
        if (this.isDead) {
            this.setState('death');
        } else if (this.isHurt) {
            this.setState('hurt');
        } else if (this.isAttacking) {
            this.setState('attack');
        } else if (this.speed > 0) {
            this.setState('run');
        } else {
            this.setState('idle');
        }
    }
}

window.BossTroll = BossTroll;