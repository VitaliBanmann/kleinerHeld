class Keyboard {
    /**
     * Key states for various controls.
     * @type {{ LEFT: boolean, RIGHT: boolean, SPACE: boolean, E: boolean, Q: boolean, P: boolean, W: boolean, D1: boolean, D2: boolean, D3: boolean, ENTER: boolean }}
     */
    LEFT = false; RIGHT = false; SPACE = false; E = false; Q = false; P = false; W = false; D1 = false; D2 = false; D3 = false;
    ENTER = false;

    /**
     * Binds keyboard and touch/pointer events.
     * Must be called after the DOM is ready.
     */
    mapEvents() {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Enter') this.ENTER = true;
            if (['Enter', 'Space'].includes(event.code) && window.Overlay?.isBlocking?.()) {
                window.Overlay.handleActionPrimary();
            }
            if (event.code === 'KeyA') this.LEFT = true;
            if (event.code === 'KeyD') this.RIGHT = true;
            if (event.code === 'Space') this.SPACE = true;

            if (event.code === 'KeyW') this.W = true;
            if (event.code === 'Digit1') this.D1 = true;
            if (event.code === 'Digit2') this.D2 = true;
            if (event.code === 'Digit3') this.D3 = true;

            if (event.code === 'KeyE') this.E = true;
            if (event.code === 'KeyQ') this.Q = true;
            if (event.code === 'KeyP') this.P = true;
        });

        document.addEventListener('keyup', (event) => {
            if (event.code === 'Enter') this.ENTER = false;
            if (event.code === 'KeyA') this.LEFT = false;
            if (event.code === 'KeyD') this.RIGHT = false;
            if (event.code === 'Space') this.SPACE = false;

            if (event.code === 'KeyW') this.W = false;
            if (event.code === 'Digit1') this.D1 = false;
            if (event.code === 'Digit2') this.D2 = false;
            if (event.code === 'Digit3') this.D3 = false;

            if (event.code === 'KeyE') this.E = false;
            if (event.code === 'KeyQ') this.Q = false;
            if (event.code === 'KeyP') this.P = false;
        });

        this.bindHoldButton('left', 'LEFT');
        this.bindHoldButton('right', 'RIGHT');

        this.bindTapButton('jump', () => this.pulse('SPACE'));
        this.bindTapButton('attack', () => this.pulse('E'));
        this.bindTapButton('heart', () => this.pulse('W'));
        this.bindTapButton('weapon', () => this.pulse('D1'));
        this.bindTapButton('luck', () => this.pulse('D2'));
        this.bindTapButton('invuln', () => this.pulse('D3'));
        this.bindTapButton('pause', () => this.pulse('P'));
    }

    /**
     * Sets a flag temporarily to true (pulse) and then automatically to false.
     * @param {keyof Keyboard} property - Property name (flag)
     * @param {number} [duration=60] - Duration in ms
     */
    pulse(property, duration = 60) {
        this[property] = true;
        setTimeout(() => { this[property] = false; }, duration);
    }

    /**
     * Binds a "Hold" button (holding down = permanently true).
     * Supports touch/pointer/mouse.
     * @param {string} elementId - Element ID
     * @param {keyof Keyboard} property - Flag name
     */
    bindHoldButton(elementId, property) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const onTouchStart = (event) => { event.preventDefault(); this[property] = true; };
        const onTouchEnd = (event) => { event.preventDefault(); this[property] = false; };

        element.addEventListener('touchstart', onTouchStart, { passive: false });
        element.addEventListener('touchend', onTouchEnd, { passive: false });
        element.addEventListener('touchcancel', onTouchEnd, { passive: false });

        element.addEventListener('pointerdown', onTouchStart);
        element.addEventListener('pointerup', onTouchEnd);
        element.addEventListener('pointerleave', onTouchEnd);

        element.addEventListener('mousedown', onTouchStart);
        element.addEventListener('mouseup', onTouchEnd);
        element.addEventListener('mouseleave', onTouchEnd);
    }

    /**
     * Binds a "Tap" button (short pulse via handler).
     * @param {string} elementId - Element ID
     * @param {Function} handler - Action to execute
     */
    bindTapButton(elementId, handler) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const execute = (event) => { event.preventDefault(); handler(); };
        element.addEventListener('touchend', execute, { passive: false });
        element.addEventListener('pointerup', execute);
        element.addEventListener('click', execute);
    }
}

window.Keyboard = Keyboard;