class EnemyMinotaur extends MoveableObject {
    img = './assets/enemy/3Minotaur/Idle.png';
    
    width = 50;
    height = 50;
    scale = 1.3;
    direction = true;
    speed = 0.5;
    
    x = 300;

    health = 25;
    maxHealth = 25;

    HitboxOffsetX = 40;
    HitboxOffsetXRight = 35;
    HitboxOffsetY = -50;
    HitboxWidth = 50;
    HitboxHeight = 100;

    isHurt = false;
    isDead = false;
    isAttacking = false;

    animationFinished = true;
    deathAnimationPlayed = false;
    deathAnimationComplete = false;

    attackCooldown = 0;
    attackRange = 85;
    attackDamage = 12;

    state = 'run';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;

    /**
     * Creates an instance of EnemyMinotaur.
     * @param {number} [groundY=520] - The ground Y position for placement.
     */
    constructor(groundY = 520) {
        super();
        this.x = 300 + Math.random() * 600;
        this.speed = 0.5 + Math.random() * 1.5;
        this.loadAnimations();
        this.y = groundY - (this.height * this.scale);
    }

    /**
     * Loads animation frames from the MINOTAUR_IMAGES definition.
     * @returns {void}
     */
    loadAnimations() {
        this.animations = {};
        for (const [state, sheets] of Object.entries(MINOTAUR_IMAGES)) {
            const frames = this.buildFramesFromSheet(sheets[0]);
            this.animations[state] = frames;
        }
    }

    /**
     * Slices a sprite sheet into frame descriptors.
     * @param {{src:string,width:number,height:number,frames:number}} sheet - The sprite sheet definition.
     * @returns {Array<Object>} - An array of frame descriptors.
     */
    buildFramesFromSheet(sheet) {
        const img = new Image(); img.src = sheet.src;
        img.onerror = () => console.warn('Image not found:', img.src);
        const fw = Math.floor(sheet.width / sheet.frames), fh = sheet.height;
        const frames = [];
        for (let i = 0; i < sheet.frames; i++) {
            frames.push({ img, sx: i * fw, sy: 0, sw: fw, sh: fh, width: fw, height: fh });
        }
        return frames;
    }

    /**
     * Gets the current animation frame.
     * @returns {{img:HTMLImageElement,sx:number,sy:number,sw:number,sh:number,width:number,height:number}|null} - The current frame or null if not available.
     */
    getCurrentFrame() {
        let frames = this.animations[this.state];
        if (!frames?.length) return null;
        return frames[this.frameIndex] || null;
    }

    /**
     * Sets the state of the enemy.
     * @param {string} next - The next state to set.
     * @param {{reset?:boolean}} [options] - Options for resetting the state.
     */
    setState(next, { reset = false } = {}) {
        if (this.state !== next || reset) {
            this.state = next in this.animations ? next : 'idle';
            this.frameIndex = 0;
        }
    }

    /**
     * Updates the enemy's state based on its flags.
     * @param {number} dt - Delta time in milliseconds.
     */
    update(dt) {
        if (this.isDead) this.setState('death');
        else if (this.isHurt) this.setState('hurt');
        else if (this.isAttacking) this.setState('attack');
        else if (this.speed > 0) this.setState('run');
        else this.setState('idle');
    }
}