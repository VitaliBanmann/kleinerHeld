class Character extends MoveableObject {
    width = 50;
    height = 50;
    scale = 2;
    direction = false;
    speed = 5;
    speedY = 0;
    acceleration = 0.5;
    jumpPower = 12;
    x = 100;

    health = 100;
    maxHealth = 100;

    coins = 0;
    allcoins = 0;
    hearts = 0;
    weaponLevel = 0;
    luckyPowerup = false;
    invulnPowerup = false;
    invulnActive = false;
    invulnCooldown = 0;
    invulnTimer = 0;

    attackRange = 50;

    imageCache = {};
    currentImage = 0;
    state = 'idle';
    animations = {};
    frameIndex = 0;
    frameDuration = 200;
    frameDurations = {
        default: 200,
        attack: 120,
        attack_extra: 70,
        run: 100
    };
    animationAccumulator = 0;
    animationTimer = null;

    isHurt = false;
    isDead = false;
    isAttacking = false;
    animationFinished = true;
    deathAnimationPlayed = false;

    HitboxOffsetX = 0;
    HitboxOffsetY = 0;
    HitboxWidth = 40;
    HitboxHeight = 50;

    /**
     * Creates an instance of Character.
     * @param {number} [groundY=520] The Y position of the ground for placement (bottom edge of the sprite).
     */
    constructor(groundY = 520) {
        super();
        /** @type {number} Reference ground */
        this.groundY = groundY;
        this.y = groundY - (this.height * this.scale);
        this.loadAnimation();
    }

    /**
     * Loads all animation frames from the global CHARACTER_IMAGES structure.
     * Expected format: { state: [{src,width,height,offsetX,offsetY}, ...], ... }
     */
    loadAnimation() {
        for (let [state, frames] of Object.entries(CHARACTER_IMAGES)) {
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
     * Updates the animation frame based on elapsed time.
     * Delegates the consumption of the accumulator to a helper.
     * @param {number} deltaTime Delta Time in ms.
     * @returns {void}
     */
    updateAnimation(deltaTime) {
        if (!this.animations) return;
        const frames = this.animations[this.state];
        if (!frames?.length) return;
        const frameDuration = this.getFrameDurationForState(this.state);
        this.animationAccumulator = (this.animationAccumulator || 0) + deltaTime;
        this.consumeAnimationAccumulator(frames, frameDuration);
    }

    /**
     * Consumes the animation accumulator and advances frames if necessary.
     * Handles the special death animation that stops on the last frame.
     * @param {{img:HTMLImageElement}[]} frames
     * @param {number} frameDuration Frame duration in ms.
     * @returns {void}
     */
    consumeAnimationAccumulator(frames, frameDuration) {
        while (this.animationAccumulator >= frameDuration) {
            this.animationAccumulator -= frameDuration;
            if (this.state === 'death') { this.advanceDeath(frames); return; }
            this.frameIndex = (this.frameIndex + 1) % frames.length;
        }
    }

    /**
     * Advances the death animation; marks when the last frame is reached.
     * @param {{img:HTMLImageElement}[]} frames
     * @returns {void}
     */
    advanceDeath(frames) {
        if (this.frameIndex < frames.length - 1) {
            this.frameIndex++;
            if (this.frameIndex === frames.length - 1) this.deathAnimationPlayed = true;
        }
    }

    /**
     * Main logic for state transitions based on input & status flags.
     * Order: death > hurt > attack(_extra) > jump > run > idle
     */
    update() {
        if (this.handleImmediateStates()) return;
        if (this.handleAttackInput()) return;
        if (this.resolveAttackEnd()) return;
        if (this.resolveJumpEnd()) return;
        if (this.handleJumpInput()) return;
        this.updateMovementState();
    }

    /**
     * Handles immediate states (death/hurt).
     * @returns {boolean} True if handled and an early exit occurred.
     */
    handleImmediateStates() {
        if (this.isDead) { this.setState('death'); return true; }
        if (this.isHurt) { this.setState('hurt'); return true; }
        return false;
    }

    /**
     * Reads attack inputs and triggers attack states once.
     * @returns {boolean} True if an attack was initiated.
     */
    handleAttackInput() {
        if (keyboard.E && this.state !== 'attack') {
            this.setState('attack', { reset: true });
            this.world?.onPlayerAttack?.('attack');
            return true;
        }
        if (keyboard.Q && this.state !== 'attack_extra') {
            this.setState('attack_extra', { reset: true });
            this.world?.onPlayerAttack?.('attack_extra');
            return true;
        }
        return false;
    }

    /**
     * Resolves attack end for supported attack states.
     * Delegates to a generic state resolver.
     * @returns {boolean} True if in an attack state (handled).
     */
    resolveAttackEnd() {
        if (this.state === 'attack_extra') return this.resolveAttackEndState('attack_extra');
        if (this.state === 'attack') return this.resolveAttackEndState('attack');
        return false;
    }

    /**
     * Resolves end of a specific attack state (switches to idle on last frame).
     * @param {'attack'|'attack_extra'} attackState
     * @returns {boolean} True if state was checked and handled.
     */
    resolveAttackEndState(attackState) {
        const frames = this.animations[attackState] || [];
        if (!frames.length) return false;
        if (this.frameIndex === frames.length - 1) this.setState('idle');
        return true;
    }

    /**
     * Exits the jump state if it is finished and the ground is reached.
     * @returns {boolean} True if the jump state was resolved.
     */
    resolveJumpEnd() {
        if (this.state !== 'jump') return false;
        const frames = this.animations['jump'] || [];
        if (this.frameIndex === frames.length - 1 || !this.isAboveGround()) {
            this.setState('idle');
        }
        return true;
    }

    /**
     * Initiates a jump if on the ground and not already jumping.
     * @returns {boolean} True if a jump was initiated.
     */
    handleJumpInput() {
        if (!keyboard.SPACE) return false;
        this.jump();
        return true;
    }

    /**
     * Chooses between running and idle based on horizontal input.
     * @returns {void}
     */
    updateMovementState() {
        if (keyboard.LEFT || keyboard.RIGHT) {
            if (this.state !== 'run') this.setState('run');
        } else if (this.state !== 'idle') {
            this.setState('idle');
        }
    }

    /**
     * Initiates a jump if on the ground & not already in jump state.
     */
    jump() {
        if (!this.isAboveGround() && this.state !== 'jump') {
            this.speedY = -this.jumpPower;
            this.setState('jump', { reset: true });
            AudioManager.playSfx?.('jump');
        }
    }

    /**
     * Returns frame duration for the current state, using a per-state map.
     * Falls back to default if not present.
     * @param {string} state
     * @returns {number}
     */
    getFrameDurationForState(state) {
        const frameDurationMap = this.frameDurations || {};
        if (state && frameDurationMap[state] != null) return frameDurationMap[state];
        if (frameDurationMap.default != null) return frameDurationMap.default;
        return this.frameDuration ?? 200;
    }

    /**
     * Returns the current animation frame object for drawing.
     * @returns {{img:HTMLImageElement,width?:number,height?:number,sx?:number,sy?:number,sw?:number,sh?:number}|undefined}
     */
    getCurrentFrame() {
        const frames = this.animations?.[this.state];
        if (!frames?.length) return;
        const index = Math.max(0, Math.min(this.frameIndex || 0, frames.length - 1));
        return frames[index];
    }

    /**
     * Sets the state (animation) and optionally resets the frame index and time accumulator.
     * @param {string} newState New state.
     * @param {{reset?:boolean}} [options] Optional parameter object.
     * @property {boolean} reset If true, the frame index and time accumulator are reset.
     */
    setState(newState, options = {}) {
        const reset = !!options.reset || this.state !== newState;
        this.state = newState;
        if (reset) { this.frameIndex = 0; this.animationAccumulator = 0; }
        if (newState !== 'attack' && newState !== 'attack_extra') this.isAttacking = false;
        if (newState === 'death') { this.isDead = true; this.deathAnimationPlayed = false; }
    }

    /**
     * Returns true if the character's bottom is above the ground line.
     * @returns {boolean}
     */
    isAboveGround() {
        const groundY = this.groundY ?? 520;
        const bottom = (this.y ?? 0) + (this.height * this.scale);
        return bottom < groundY - 0.5;
    }

    /**
     * Basic vertical physics: gravity and ground collision.
     * @param {number} deltaTime Delta time in ms
     * @returns {void}
     */
    updatePhysics(deltaTime = 16) {
        const frameScale = (typeof deltaTime === 'number' && isFinite(deltaTime)) ? deltaTime / 16 : 1;
        if (this.isAboveGround() || this.speedY < 0) {
            this.y += this.speedY * frameScale;
            this.speedY += this.acceleration * frameScale;
        }
        const groundTop = (this.groundY ?? 520) - (this.height * this.scale);
        if (this.y >= groundTop) { this.y = groundTop; this.speedY = 0; }
    }
}