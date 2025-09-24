class BossDragon extends MoveableObject {
    x = 100;
    img = './assets/boss/2dragon/Idle1.png';
    scale = 2;
    width = 125;
    height = 150;
    direction = true;
    speed = 0.7;
    health = 50;
    maxHealth = 50;
    bossSoundRange = 1000;

    // Hitbox
    HitboxOffsetX = 0;
    HitboxOffsetY = 75;
    HitboxWidth = 125;
    HitboxHeight = 75;

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
     * Konstruktor.
     * Positioniert Boss relativ zum Boden und lädt Animationsframes.
     * @param {number} [groundY=520] Y-Koordinate des Bodens (zum Platzieren des Sprites).
     */
    constructor(groundY = 520) {
        super();
        this.loadImage(this.img);
        this.x = 500 + Math.random() * 200;
        this.speed = 0.5 + Math.random() * 1.5;
        this.loadAnimations();
        this.y = groundY - (this.height * this.scale);
    }

    /**
     * Lädt alle Animationen aus globaler DRAGON_IMAGES Struktur.
     * Erwartet Format: { state: [{src,width,height,offsetX,offsetY}, ...], ... }
     */
    loadAnimations() {
        for (let [state, frames] of Object.entries(DRAGON_IMAGES)) {
            this.animations[state] = frames.map(frame => {
                const img = new Image();
                img.src = frame.src;
                return { img, width: frame.width, height: frame.height, offsetX: frame.offsetX, offsetY: frame.offsetY };
            });
        }
    }

    /**
     * Liefert aktuelles Frame-Objekt der momentanen Animation.
     * @returns {{img:HTMLImageElement,width:number,height:number,offsetX:number,offsetY:number}|null}
     */
    getCurrentFrame() {
        const frames = this.animations[this.state];
        if (!frames || frames.length === 0) return null;
        return frames[this.frameIndex] || null;
    }

    /**
     * Setzt neuen Zustand (Animation). Bei Wechsel oder reset wird frameIndex auf 0 gesetzt.
     * @param {string} next Zielzustand.
     * @param {{reset?:boolean}} [options]
     */
    setState(next, { reset = false } = {}) {
        if (this.state !== next || reset) {
            this.state = next in this.animations ? next : 'idle';
            this.frameIndex = 0;
        }
    }

    /**
     * Aktualisiert Zustandslogik (ohne Positionslogik).
     * Reihenfolge der Priorität: death > hurt > attack > run > idle.
     * @param {number} dt Delta Time in ms.
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

window.BossDragon = BossDragon;