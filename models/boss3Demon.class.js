class BossDemon extends MoveableObject {
    x = 100;
    img = './assets/enemy/demon/Idle1.png';
    scale = 2.1;
    width = 75;
    height = 150;
    direction = true;
    speed = 0.7;
    health = 50;
    maxHealth = 50;
    bossSoundRange = 800;

    // Hitbox
    HitboxOffsetX = -7;
    HitboxOffsetY = 65;
    HitboxWidth = 60;
    HitboxHeight = 80;

    // Statusflags
    isHurt = false;
    isDead = false;
    animationFinished = true;
    deathAnimationPlayed = false;
    deathAnimationComplete = false;
    isAttacking = false;

    attackCooldown = 0.5;
    attackRange = 80;
    attackDamage = 20;
    state = 'run';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;

    /**
     * @param {number} [groundY=520] Boden-Y zur Platzierung.
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
     * Lädt Frames aus globaler DEMON_IMAGES Struktur.
     * Erwartetes Format: { state: [{src,width,height,offsetX,offsetY}, ...], ... }
     */
    loadAnimations() {
        for (let [state, frames] of Object.entries(DEMON_IMAGES)) {
            this.animations[state] = frames.map(frame => {
                let img = new Image();
                img.src = frame.src;
                return { img, width: frame.width, height: frame.height, offsetX: frame.offsetX, offsetY: frame.offsetY };
            });
        }
    }

    /**
     * Liefert aktuelles Frameobjekt oder null.
     * @returns {{img:HTMLImageElement,width:number,height:number,offsetX:number,offsetY:number}|null}
     */
    getCurrentFrame() {
        const frames = this.animations[this.state];
        if (!frames || frames.length === 0) return null;
        return frames[this.frameIndex] || null;
    }

    /**
     * Setzt Zustand; bei Wechsel oder reset wird frameIndex zurückgesetzt.
     * @param {string} next Neuer Zustand
     * @param {{reset?:boolean}} [options]
     */
    setState(next, { reset = false } = {}) {
        if (this.state !== next || reset) {
            this.state = next in this.animations ? next : 'idle';
            this.frameIndex = 0;
        }
    }

    /**
     * Aktualisiert State basierend auf Flags (keine Bewegung hier).
     * Priorität: death > hurt > attack > run > idle.
     * @param {number} dt Delta ms
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

window.BossDemon = BossDemon;