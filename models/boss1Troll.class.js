class BossTroll extends MoveableObject {
    x = 100;

    imageSourcePath = './assets/boss/1trolls/Troll_IDLE0.png';

    scale = 0.3;
    width = 125;
    height = 150;
    direction = true;
    speed = 0.7;
    health = 30;
    maxHealth = 30;
    bossSoundRange = 800;

    // Hitbox properties
    hitboxOffsetLeft = 180;
    hitboxOffsetRight = 60;
    hitboxOffsetTop = -375;
    hitboxWidth = 400;
    hitboxHeight = 520;

    // Status flags
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
     * Constructs a new BossTroll instance, positions it at the end of the map, and loads animations.
     * @param {number} [groundY=520] - The ground Y position for placement.
     */
    constructor(groundY = 520) {
        super();
        this.loadImage(this.imageSourcePath);
        this.x = 10600;
        this.speed = 0.5 + Math.random() * 1.5;
        this.loadAnimations();
        this.y = groundY - (this.height * this.scale);
    }

    /**
     * Loads all animation frames from the global TROLL_IMAGES structure.
     * Expected format: { state: [{src,width,height,offsetX,offsetY}, ...], ... }
     * @returns {void}
     */
    loadAnimations() {
        for (let [animationState, frameList] of Object.entries(TROLL_IMAGES)) {
            this.animations[animationState] = frameList.map(frameData => {
                const imageElement = new Image();
                imageElement.src = frameData.src;
                return {
                    img: imageElement,
                    width: frameData.width,
                    height: frameData.height,
                    offsetX: frameData.offsetX,
                    offsetY: frameData.offsetY
                };
            });
        }
    }

    /**
     * Returns the current frame object of the active animation.
     * @returns {{img:HTMLImageElement, width:number, height:number, offsetX:number, offsetY:number}|null}
     */
    getCurrentFrame() {
        const frameList = this.animations[this.state];
        if (!frameList || frameList.length === 0) return null;
        return frameList[this.frameIndex] || null;
    }

    /**
     * Sets a new animation state. Optionally resets the frame index.
     * @param {string} nextState - The new target animation state.
     * @param {{reset?:boolean}} [options]
     * @returns {void}
     */
    setState(nextState, { reset = false } = {}) {
        if (this.state !== nextState || reset) {
            this.state = nextState in this.animations ? nextState : 'idle';
            this.frameIndex = 0;
        }
    }

    /**
     * Updates the animation state based on status flags.
     * Priority order: death > hurt > attack > run > idle.
     * @param {number} deltaTime - Delta time in milliseconds.
     * @returns {void}
     */
    update(deltaTime) {
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