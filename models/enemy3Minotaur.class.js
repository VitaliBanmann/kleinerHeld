class EnemyMinotaur extends MoveableObject {
    img = './assets/enemy/3Minotaur/Idle.png';
    
    width = 50;
    height = 50;
    scale = 1.3;
    direction = true;
    speed = 0.5;
    
    x = 300;

    health = 30;
    maxHealth = 30;

    // Hitbox
    HitboxOffsetX = -30;
    HitboxOffsetY = -50;
    HitboxWidth = 50;
    HitboxHeight = 100;

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
    attackRange = 85;
    attackDamage = 12;

    state = 'run';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;

    /**
     * @param {number} [groundY=520]
     */
    constructor(groundY = 520) {
        super();
        this.x = 300 + Math.random() * 600;
        this.speed = 0.5 + Math.random() * 1.5;
        this.loadAnimations();
        this.y = groundY - (this.height * this.scale);
    }

    /**
     * Builds animation frames from MINOTAUR_IMAGES definition.
     * Delegates sheet slicing to a helper to keep it short.
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
     * @param {{src:string,width:number,height:number,frames:number}} sheet
     * @returns {Array<Object>}
     */
    buildFramesFromSheet(sheet) {
        const img = new Image(); img.src = sheet.src;
        img.onerror = () => console.warn('Bild nicht gefunden:', img.src);
        const fw = Math.floor(sheet.width / sheet.frames), fh = sheet.height;
        const frames = [];
        for (let i = 0; i < sheet.frames; i++) {
            frames.push({ img, sx: i * fw, sy: 0, sw: fw, sh: fh, width: fw, height: fh });
        }
        return frames;
    }

    /**
     * @returns {{img:HTMLImageElement,sx:number,sy:number,sw:number,sh:number,width:number,height:number}|null}
     */
    getCurrentFrame() {
        let frames = this.animations[this.state];
        if (!frames?.length) return null;
        return frames[this.frameIndex] || null;
    }

    /**
     * Zustand setzen.
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
     * State-Logik.
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