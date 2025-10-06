class EnemyLizard extends MoveableObject {
    img = './assets/enemy/1Lizard/Idle1.png';
    width = 50;
    height = 50;
    scale = 1.7;
    direction = true;
    speed = 1;
    x = 300;

    health = 18;
    maxHealth = 18;

    HitboxOffsetX = 30;
    HitboxOffsetXRight = 10;
    HitboxOffsetY = 0;
    HitboxWidth = 50;
    HitboxHeight = null;

    isHurt = false;
    isDead = false;
    isAttacking = false;

    animationFinished = true;
    deathAnimationPlayed = false;
    deathAnimationComplete = false;

    attackCooldown = 0;
    attackRange = 80;
    attackDamage = 7;

    state = 'run';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;

    /**
     * Creates an instance of EnemyLizard.
     * @param {number} [groundY=520] The Y position of the ground for placement.
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
     * Loads animation frames from the global LIZARD_IMAGES structure.
     * @returns {void}
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
     * Returns the current animation frame for rendering.
     * @returns {{img:HTMLImageElement,width:number,height:number,offsetX:number,offsetY:number}|null}
     */
    getCurrentFrame() {
        let frames = this.animations[this.state];
        if (!frames?.length) return null;
        return frames[this.frameIndex] || null;
    }

    /**
     * Sets the state of the enemy (optional reset).
     * @param {string} nextState The next state to set.
     * @param {{reset?:boolean}} [options] Optional parameters.
     */
    setState(nextState, { reset = false } = {}) {
        if (this.state !== nextState || reset) {
            this.state = nextState in this.animations ? nextState : 'idle';
            this.frameIndex = 0;
        }
    }

    /**
     * Updates the enemy's state based on its current status.
     * @param {number} deltaTime The time elapsed since the last update.
     * @returns {void}
     */
    update(deltaTime) {
        if (this.isDead) this.setState('death');
        else if (this.isHurt) this.setState('hurt');
        else if (this.isAttacking) this.setState('attack');
        else if (this.speed > 0) this.setState('run');
        else this.setState('idle');
    }
}