class EnemySkeleton extends MoveableObject {
    img = './assets/enemy/2Skeleton/Idle.png';

    width = 50;
    height = 50;
    scale = 1.7;
    direction = true;
    speed = 1;

    x = 300;

    health = 20;
    maxHealth = 20;

    HitboxOffsetX = 58;
    HitboxOffsetXRight = 35;
    HitboxOffsetY = -10;
    HitboxWidth = 35;
    HitboxHeight = 60;

    isHurt = false;
    isDead = false;
    isAttacking = false;

    animationFinished = true;
    deathAnimationPlayed = false;
    deathAnimationComplete = false;

    attackCooldown = 0;
    attackRange = 80;
    attackDamage = 10;

    state = 'run';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;

    /**
     * Creates an instance of EnemySkeleton.
     * @param {number} [groundY=520] The Y position of the ground for placement.
     */
    constructor(groundY = 520) {
        super();
        this.x = 300 + Math.random() * 600;
        this.speed = 0.5 + Math.random() * 1.5;
        this.loadAnimations();
        this.y = groundY - (this.height * this.scale);
    }

    /**
     * Loads animation frames from the global SKELETON_IMAGES structure.
     * @returns {void}
     */
    loadAnimations() {
        this.animations = {};
        for (const [state, sheets] of Object.entries(SKELETON_IMAGES)) {
            const frames = this.buildFramesFromSheet(sheets[0]);
            this.animations[state] = frames;
        }
    }

    /**
     * Slices a sprite sheet into frame descriptors.
     * @param {{src:string,width:number,height:number,frames:number}} sheet The sprite sheet definition.
     * @returns {Array<Object>} An array of frame descriptors.
     */
    buildFramesFromSheet(sheet) {
        const img = new Image(); img.src = sheet.src;
        img.onerror = () => console.warn('Image not found:', img.src);
        const frameWidth = Math.floor(sheet.width / sheet.frames);
        const frameHeight = sheet.height;
        const frames = [];
        for (let i = 0; i < sheet.frames; i++) {
            frames.push({ img, sx: i * frameWidth, sy: 0, sw: frameWidth, sh: frameHeight, width: frameWidth, height: frameHeight });
        }
        return frames;
    }

    /**
     * Returns the current animation frame for rendering.
     * @returns {{img:HTMLImageElement,sx:number,sy:number,sw:number,sh:number,width:number,height:number}|null}
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