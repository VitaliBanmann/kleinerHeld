class Keyboard {
    LEFT = false; RIGHT = false; SPACE = false; E = false; Q = false; P = false; W = false; D1 = false; D2 = false; D3 = false;
    ENTER = false;

    /**
     * Bindet Tastatur- und Touch/Pointer-Ereignisse.
     * Muss nach DOM-Bereitstellung aufgerufen werden.
     */
    mapEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Enter') this.ENTER = true;
            if (['Enter','Space'].includes(e.code) && window.Overlay?.isBlocking?.()) {
                window.Overlay.handleActionPrimary();
            }
            if (e.code === 'KeyA') this.LEFT = true;
            if (e.code === 'KeyD') this.RIGHT = true;
            if (e.code === 'Space') this.SPACE = true;

            if (e.code === 'KeyW') this.W = true;
            if (e.code === 'Digit1') this.D1 = true;
            if (e.code === 'Digit2') this.D2 = true;
            if (e.code === 'Digit3') this.D3 = true;

            if (e.code === 'KeyE') this.E = true;
            if (e.code === 'KeyQ') this.Q = true;
            if (e.code === 'KeyP') this.P = true;
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'Enter') this.ENTER = false;
            if (e.code === 'KeyA') this.LEFT = false;
            if (e.code === 'KeyD') this.RIGHT = false;
            if (e.code === 'Space') this.SPACE = false;

            if (e.code === 'KeyW') this.W = false;
            if (e.code === 'Digit1') this.D1 = false;
            if (e.code === 'Digit2') this.D2 = false;
            if (e.code === 'Digit3') this.D3 = false;

            if (e.code === 'KeyE') this.E = false;
            if (e.code === 'KeyQ') this.Q = false;
            if (e.code === 'KeyP') this.P = false;
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
     * Setzt ein Flag kurzzeitig auf true (Puls) und danach automatisch auf false.
     * @param {keyof Keyboard} prop Property-Name (Flag)
     * @param {number} [duration=60] Dauer in ms
     */
    pulse(prop, duration = 60) {
        this[prop] = true;
        setTimeout(() => { this[prop] = false; }, duration);
    }

    /**
     * Bindet einen "Hold"-Button (gedrückt halten = dauerhaft true).
     * Unterstützt Touch / Pointer / Maus.
     * @param {string} id Element-ID
     * @param {keyof Keyboard} prop Flag-Name
     */
    bindHoldButton(id, prop) {
        const el = document.getElementById(id);
        if (!el) return;

        const down = (e) => { e.preventDefault(); this[prop] = true; };
        const up   = (e) => { e.preventDefault(); this[prop] = false; };

        el.addEventListener('touchstart', down, { passive: false });
        el.addEventListener('touchend', up, { passive: false });
        el.addEventListener('touchcancel', up, { passive: false });

        el.addEventListener('pointerdown', down);
        el.addEventListener('pointerup', up);
        el.addEventListener('pointerleave', up);

        el.addEventListener('mousedown', down);
        el.addEventListener('mouseup', up);
        el.addEventListener('mouseleave', up);
    }

    /**
     * Bindet einen "Tap"-Button (kurzer Puls über Handler).
     * @param {string} id Element-ID
     * @param {Function} handler Auszuführende Aktion
     */
    bindTapButton(id, handler) {
        const el = document.getElementById(id);
        if (!el) return;

        const exec = (e) => { e.preventDefault(); handler(); };
        el.addEventListener('touchend', exec, { passive: false });
        el.addEventListener('pointerup', exec);
        el.addEventListener('click', exec);
    }
}
window.Keyboard = Keyboard;