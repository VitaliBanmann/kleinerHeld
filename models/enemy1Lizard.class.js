class EnemyLizard extends MoveableObject {
    img = './assets/enemy/1Lizard/Idle1.png';
    width = 50;
    height = 50;
    scale = 1.7;
    direction = true;
    speed = 1;
    x = 300;

    health = 20;
    maxHealth = 20;

    // Hitbox
    HitboxOffsetX = -30;
    HitboxOffsetY = 0;
    HitboxWidth = 50;
    HitboxHeight = null;

    // Statusflags
    isHurt = false;
    isDead = false;
    isAttacking = false;

    // Animationsflags
    animationFinished = true;
    deathAnimationPlayed = false;
    deathAnimationComplete = false;

    // Angriff
    attackCooldown = 0;
    attackRange = 80;
    attackDamage = 7;

    state = 'run';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;

    /**
     * @param {number} [groundY=520] Boden-Y zum Platzieren.
     */
    constructor(groundY = 520) {
        super();
        this.loadImage(this.img);
        this.x = 300 + Math.random() * 600;
        this.speed = 0.5 + Math.random() * 1.5;
        this.loadAnimations();
        this.y = groundY - (this.height * this.scale);
    }

    /**
     * Lädt Frames aus LIZARD_IMAGES.
     */
    loadAnimations() {
        for (let [state, frames] of Object.entries(LIZARD_IMAGES)) {
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
     * Liefert aktuelles Frame.
     * @returns {{img:HTMLImageElement,width:number,height:number,offsetX:number,offsetY:number}|null}
     */
    getCurrentFrame() {
        let frames = this.animations[this.state];
        if (!frames?.length) return null;
        return frames[this.frameIndex] || null;
    }

    /**
     * Setzt Zustand (optional Reset).
     * @param {string} next
     * @param {{reset?:boolean}} [options]
     */
    setState(next, { reset = false } = {}) {
        if (this.state !== next || reset) {
            this.state = next in this.animations ? next : 'idle';
            this.frameIndex = 0;
        }
    }

    /**
     * Aktualisiert State anhand Flags.
     * @param {number} dt
     */
    update(dt) {
        if (this.isDead) this.setState('death');
        else if (this.isHurt) this.setState('hurt');
        else if (this.isAttacking) this.setState('attack');
        else if (this.speed > 0) this.setState('run');
        else this.setState('idle');
    }
}