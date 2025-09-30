class Overlay {
    static state = 'start';
    static nextLevel = '?';
    static onProceed = null;
    static stats = { totalCoins: 0, enemiesDefeated: 0 };

    /** Font family used for text rendering. */
    static fontFamily = "StoryScript, Arial, sans-serif";
    /** Default letter spacing in em (multiplied by font size). */
    static lsEm = 0.04;

    /**
     * Resolves current power-up prices, falling back to defaults if Powerups is missing.
     * @returns {{heart:number,weapon:number,lucky:number,invuln:number}}
     */
    static prices() {
        const p = (window.Powerups?.prices) || {};
        return {
            heart: p.heart ?? 50,
            weapon: p.weapon ?? 200,
            lucky: p.lucky ?? 150,
            invuln: p.invuln ?? 200
        };
    }

    /**
     * Screen definition for the start screen.
     * @returns {{title:string,lines:string[],buttons:{id:string,label:string}[]}}
     */
    static scrStart(){
      return {
        title: 'Kleiner Held',
        lines: ['Sammle Münzen und besiege alle Gegner!'],
        buttons: [
          { id: 'start', label: 'Spiel starten' },
          { id: 'help', label: 'Steuerung' },
          { id: 'hint', label: 'Tipps' }
        ]
      };
    }

    /**
     * Screen definition for the hints/tips screen.
     * @returns {{title:string,lines:string[],buttons:{id:string,label:string}[]}}
     */
    static scrHint(){
      return {
        title: 'Spieltipps',
        lines: [
          '',
          'Kaufe dir von dem Kopfgeld Upgrades:',
          'Waffenupgrades (1) verbessern deinen Angriff (mehr Schaden)',
          'Lucky (2) erhöht die Droprate von Münzen',
          'Unverwundbarkeit (3) macht dich für 3 Sekunden unverwundbar,',
          'hat aber eine Abklingzeit von 1 Minute.',
          '',
          'Herzen kaufen mit (W), wenn du 50 Münzen hast, kannst du dir ein Herz kaufen.',
          'Erneutes drücken heilt dich. Wenn weniger als 30 Lebenspunkte fehlen, kaufst du ein weiteres Herz.',
          '',
          'Farbe der Lebensbalken der Feinde zeigen an, wie oft du sie noch treffen musst.',
          'Rot = ein Schlag, Gelb = zwei Schläge, Grün = mehr als zwei Schläge.',
        ],
        buttons: [{ id: 'back', label: 'Zurück' }]
      };
    }

    /**
     * Builds the available overlay screens (static parts).
     * Dynamic lines are injected by withDynamicLines() during show().
     * @returns {Record<string, {title:string,lines:string[],buttons:{id:string,label:string}[]}>}
     */
    static getScreens() {
        const P = Overlay.prices();
        return {
            start: Overlay.scrStart(),
            help: Overlay.scrHelp(P),
            hint: Overlay.scrHint(),
            mapChange: Overlay.scrSimple('Level geschafft', [], [{ id: 'proceed', label: 'Weiter' }]),
            final: Overlay.scrSimple('Danke fürs Spielen!', [], [
                { id: 'start', label: 'Nochmal spielen' }, { id: 'home', label: 'Home' }
            ]),
            dead: Overlay.scrSimple('Du bist gestorben', ['Schade. Versuche es erneut.'], [
                { id: 'restart', label: 'Neustart (ENTER)' }, { id: 'home', label: 'Home' }
            ]),
            pause: Overlay.scrPause()
        };
    }

    /**
     * Entry point to draw the overlay for the current state, if any.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {HTMLCanvasElement} canvas Target canvas
     * @returns {void}
     */
    static show(ctx, canvas) {
        Overlay.syncDomVisibility();
        const screens = Overlay.getScreens();
        let screen = Overlay.withDynamicLines(screens[Overlay.state], Overlay.state);
        if (!screen) return;
        Overlay.drawScreen(ctx, canvas, screen);
    }

    /**
     * Returns whether the overlay blocks gameplay input.
     * @returns {boolean}
     */
    static isBlocking(){
        return ['start','help','pause','dead','mapChange','final'].includes(Overlay.state);
    }

    /**
     * Demo animation configuration and cache for the start screen.
     * states are character animation keys; cache stores preloaded frames.
     * frameMs controls frame duration; switchMs controls state cycling.
     * scale draws the demo larger/smaller.
     * @type {{
     *   inited:boolean,
     *   states:string[],
     *   curStateIdx:number,
     *   lastSwitch:number,
     *   frameIdx:number,
     *   lastFrame:number,
     *   frameMs:number,
     *   switchMs:number,
     *   scale:number,
     *   cache:Record<string, {img:HTMLImageElement,w:number,h:number}[]>
     * }}
     */
    static demo = {
        inited: false,
        states: ['idle','run','attack','jump','attack_extra'],
        curStateIdx: 0,
        lastSwitch: 0,
        frameIdx: 0,
        lastFrame: 0,
        frameMs: 120,
        switchMs: 7000,
        scale: 1.5,
        cache: {}
    };

    /**
     * Overrides the demo state list and resets the cache on next init.
     * @param {string[]} list Animation state keys
     * @returns {void}
     */
    static setDemoStates(list) {
        if (!Array.isArray(list) || list.length === 0) return;
        const d = Overlay.demo;
        d.states = list.slice();
        d.cache = {};
        d.inited = false;
    }

    /**
     * Lazily initializes the demo cache from CHARACTER_IMAGES.
     * No-ops if already initialized or assets are unavailable.
     * @returns {void}
     */
    static initDemoIfNeeded() {
        const d = Overlay.demo;
        if (d.inited || typeof CHARACTER_IMAGES !== 'object') return;
        Overlay.buildDemoCache();
        d.states = d.states.filter(st => (d.cache[st] && d.cache[st].length > 0));
        if (d.states.length === 0) return;
        d.inited = true;
        const now = performance.now?.() ?? Date.now();
        d.lastSwitch = now; d.lastFrame = now;
    }

    /**
     * Advances demo frame and switches states based on current timestamp.
     * @param {number} now High-resolution time in ms
     * @returns {void}
     */
    static updateDemoTimers(now) {
        const d = Overlay.demo;
        if (!d.inited) return;
        if (now - d.lastFrame >= d.frameMs) {
            d.frameIdx = (d.frameIdx + 1) % (d.cache[d.states[d.curStateIdx]].length || 1);
            d.lastFrame = now;
        }
        if (now - d.lastSwitch >= d.switchMs) {
            d.curStateIdx = (d.curStateIdx + 1) % d.states.length;
            d.frameIdx = 0;
            d.lastSwitch = now;
        }
    }

    /**
     * Draws the current demo frame centered at a given y position.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {HTMLCanvasElement} canvas Target canvas
     * @param {number} centerY Vertical center for the demo sprite
     * @returns {void}
     */
    static drawCharacterDemo(ctx, canvas, centerY) {
        const d = Overlay.demo;
        if (!d.inited || d.states.length === 0) return;
        const st = d.states[d.curStateIdx];
        const frames = d.cache[st];
        const f = frames[d.frameIdx] || frames[0];
        if (!f?.img?.complete) return;

        const sw = f.w, sh = f.h, sc = d.scale;
        const dx = (canvas.width - sw * sc) / 2;
        const dy = centerY - (sh * sc) / 2;

        ctx.save();
        ctx.drawImage(f.img, 0, 0, sw, sh, dx, dy, sw * sc, sh * sc);
        ctx.restore();
    }

    /**
     * Renders a screen: backdrop, title/lines, start demo (if start), and buttons.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {HTMLCanvasElement} canvas Target canvas
     * @param {{title:string,lines:string[],buttons:{id:string,label:string}[]}} screen Screen definition
     * @returns {void}
     */
    static drawScreen(ctx, canvas, screen) {
        const lay = Overlay.layoutForScreen(canvas, screen);
        Overlay.drawBackdrop(ctx, canvas, lay);
        Overlay.drawTitleAndLines(ctx, canvas, screen, lay);
        if (Overlay.state === 'start') Overlay.drawDemoBlock(ctx, canvas, lay);
        Overlay.drawButtons(ctx, canvas, screen.buttons, lay.buttonsTopY);
    }

    /**
     * Draws text with custom letter-spacing and alignment.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {string} text Text to render
     * @param {number} x Anchor x
     * @param {number} y Baseline y
     * @param {{size?:number,weight?:string,color?:string,align?:'left'|'center'|'right',baseline?:CanvasTextBaseline,lsEm?:number}} [opts] Style options
     * @returns {void}
     */
    static fillTextLS(ctx, text, x, y, { size=18, weight='normal', color='#fff', align='left', baseline='alphabetic', lsEm=null } = {}) {
        if (!text) return;
        ctx.save();
        Overlay.applyTextStyle(ctx, size, weight, color, baseline);
        const ls = (lsEm ?? Overlay.lsEm) * size;
        const total = Overlay.measureWithSpacing(ctx, text, size, lsEm);
        const startX = Overlay.computeStartX(x, align, total);
        Overlay.drawChars(ctx, text, startX, y, ls);
        ctx.restore();
    }

    /**
     * Measures a text width with letter-spacing applied.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {string} text Text to measure
     * @param {number} size Font size in px
     * @param {number|null} lsEm Letter-spacing in em (or null for default)
     * @returns {number} Total width in pixels
     */
    static measureWithSpacing(ctx, text, size, lsEm) {
        const lsPx = (lsEm ?? Overlay.lsEm) * size;
        let total = 0;
        for (let i = 0; i < text.length; i++) {
            total += ctx.measureText(text[i]).width;
            if (i < text.length - 1) total += lsPx;
        }
        return total;
    }

    /**
     * Draws a single-line label centered inside a box, fitting font size to width.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {string} text Label
     * @param {number} x Box x
     * @param {number} y Box y
     * @param {number} w Box width
     * @param {number} h Box height
     * @param {{maxSize?:number,minSize?:number,weight?:string,color?:string,lsEm?:number}} [opts] Font options
     * @returns {void}
     */
    static drawLabelInBox(ctx, text, x, y, w, h, { maxSize=24, minSize=10, weight='normal', color='#fff', lsEm=null } = {}) {
        const size = Overlay.calcFittingFontSize(ctx, text, w * 0.9, maxSize, minSize, weight, lsEm);
        const cx = x + w / 2, cy = y + h / 2;
        Overlay.fillTextLS(ctx, text, cx, cy + 1, { size, weight, color, align: 'center', baseline: 'middle', lsEm });
    }

    /**
     * Draws all buttons for the current screen and stores hit boxes for click handling.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {HTMLCanvasElement} canvas Target canvas
     * @param {{id:string,label:string}[]} buttons Button specs
     * @param {number} topY Top area from layout to place buttons
     * @returns {void}
     */
    static drawButtons(ctx, canvas, buttons, topY) {
        Overlay._buttons = [];
        const btnW = 200, btnH = 44, gap = 30;
        const totalW = buttons.length * btnW + (buttons.length - 1) * gap;
        const startX = (canvas.width - totalW) / 2, y = topY + 20;
        ctx.save();
        buttons.forEach((b, i) => {
            const x = startX + i * (btnW + gap);
            Overlay.drawButtonShape(ctx, x, y, btnW, btnH);
            Overlay.drawLabelInBox(ctx, b.label, x, y, btnW, btnH, { maxSize: 22 });
            Overlay._buttons.push({ id: b.id, x, y, w: btnW, h: btnH });
        });
        ctx.restore();
    }

    /**
     * Handles a click position against current buttons.
     * @param {number} x Click x
     * @param {number} y Click y
     * @returns {boolean} True if a button was clicked
     */
    static handleClick(x, y) {
        for (const b of (Overlay._buttons || [])) {
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                Overlay.buttonAction(b.id);
                return true;
            }
        }
        return false;
    }

    /**
     * Primary action shortcut for keyboard (Enter/Space).
     * Routes to the dominant action per screen.
     * @returns {void}
     */
    static handleActionPrimary() {
        switch (Overlay.state) {
            case 'start':
            case 'help':   Overlay.buttonAction('start'); break;
            case 'mapChange': Overlay.buttonAction('proceed'); break;
            case 'dead':   Overlay.buttonAction('restart'); break;
            case 'final':  Overlay.buttonAction('start'); break;
        }
    }

    /**
     * Resets world stats and character default state, keeping the world instance.
     * @returns {void}
     */
    static resetGameState() {
        if (!window.world) return;
        const w = window.world, c = w.character;
        Overlay.stats = { totalCoins: 0, enemiesDefeated: 0 };
        w.enemiesDefeated = 0;
        if (c) Overlay.applyDefaultCharacterState(c);
    }

    /**
     * Dispatches a button id to the respective handler.
     * @param {'resume'|'start'|'restart'|'help'|'hint'|'back'|'home'|'proceed'} id Button action id
     * @returns {void}
     */
    static buttonAction(id) {
      switch (id) {
        case 'resume': Overlay.handleResume(); break;
        case 'start': Overlay.handleStart(); break;
        case 'restart': Overlay.handleRestart(); break;
        case 'help': Overlay.handleHelp(); break;
        case 'hint': Overlay.handleHint(); break;
        case 'back': Overlay.handleBack(); break;
        case 'home': Overlay.handleHome(); break;
        case 'proceed': Overlay.handleProceed(); break;
      }
    }

    /** Switches to the hints screen. */
    static handleHint() {
      Overlay.state = 'hint';
    }

    /**
     * Syncs CSS classes on document.body to reflect overlay state.
     * Adds 'overlay-active' when blocking and 'show-impressum' on start screen.
     * @returns {void}
     */
    static syncDomVisibility() {
        try {
            const b = document.body;
            if (!b) return;
            const blocking = Overlay.isBlocking();
            b.classList.toggle('overlay-active', blocking);
            b.classList.toggle('show-impressum', Overlay.state === 'start');
        } catch {}
    }

    /**
     * Creates a simple screen object.
     * @param {string} title Title text
     * @param {string[]} lines Lines list
     * @param {{id:string,label:string}[]} buttons Buttons list
     * @returns {{title:string,lines:string[],buttons:{id:string,label:string}[]}}
     */
    static scrSimple(title, lines, buttons){ return { title, lines, buttons }; }

    /**
     * Screen definition for the start screen.
     * @returns {{title:string,lines:string[],buttons:{id:string,label:string}[]}}
     */
    static scrStart(){ return Overlay.scrSimple('Kleiner Held', [
        'Ein spannendes 2D-Abenteuer:', 'Erlebe 3 Levels, sammle Münzen, verbessere dich und', 'besiege alle Gegner. Nur die Stärksten Helden töten mit einem Schlag!',
    ], [{ id:'start', label:'Start' }, { id:'help', label:'Steuerung' }]); }

    /**
     * Screen definition for the help/controls screen with dynamic prices.
     * @param {{heart:number,weapon:number,lucky:number,invuln:number}} P Prices
     * @returns {{title:string,lines:string[],buttons:{id:string,label:string}[]}}
     */
    static scrHelp(P){ return Overlay.scrSimple('Tastaturbelegung', [
        'a = links   d = rechts', 'Springen: Space', 'Angriff: e oder q',
        `Herz kaufen/heilen (W): ${P.heart} Coins`, `Verbesserungen (1/2/3): je ${P.weapon} Coins`
    ], [{ id:'start', label:'Spiel starten' }, { id:'back', label:'Zurück' }, { id:'hint', label:'Tipps' }]); }

    /**
     * Screen definition for the pause screen.
     * @returns {{title:string,lines:string[],buttons:{id:string,label:string}[]}}
     */
    static scrPause(){ return Overlay.scrSimple('Pause', [
        'Spiel angehalten.', 'Drücke Resume oder Enter.'
    ], [{ id:'resume', label:'Resume' }, { id:'help', label:'Steuerung' }, { id:'start', label:'Neustart' }]); }

    /**
     * Augments a screen with dynamic lines for map changes and final stats.
     * @param {{title:string,lines:string[],buttons:{id:string,label:string}[]}} screen Base screen
     * @param {string} state Current overlay state
     * @returns {{title:string,lines:string[],buttons:{id:string,label:string}[]}}
     */
    static withDynamicLines(screen, state) {
        if (!screen) return screen;
        const coins = Overlay.stats?.totalCoins ?? 0;
        const kills = Overlay.stats?.enemiesDefeated ?? 0;
        if (state === 'mapChange') {
            return { ...screen, lines: [`Coins: ${coins}    Kills: ${kills}`,
                `Weiter zu Level ${Overlay.nextLevel}`, `ENTER oder Klick`] };
        }
        if (state === 'final') {
            return { ...screen, lines: [`Gesammelte Coins: ${coins}`,
                `Besiegte Gegner: ${kills}`, `ENTER / Klick Neustart`] };
        }
        return screen;
    }

    /**
     * Preloads demo frames for configured states from CHARACTER_IMAGES.
     * @returns {void}
     */
    static buildDemoCache() {
        const d = Overlay.demo;
        for (const st of d.states) {
            const frames = (CHARACTER_IMAGES[st] || []);
            d.cache[st] = frames.map(fr => {
                const img = new Image(); img.src = fr.src;
                return { img, w: fr.width, h: fr.height };
            });
        }
    }

    /**
     * Computes layout metrics for a given screen and canvas size.
     * @param {HTMLCanvasElement} canvas Target canvas
     * @param {{title:string,lines:string[],buttons:{id:string,label:string}[]}} screen Screen definition
     * @returns {{isStart:boolean,titleSize:number,lineGap:number,btnH:number,yTitle:number,linesStartY:number,buttonsTopY:number,demoCenterY:number}}
     */
    static layoutForScreen(canvas, screen) {
        const isStart = (Overlay.state === 'start');
        const titleSize = 40, lineGap = 28, btnH = 44, gapTitleLines = 24, gapLinesButtons = 20;
        const lineCount = (screen.lines || []).length;
        const demoH = isStart ? 160 : 0;
        const blockH = titleSize + gapTitleLines + (lineCount * lineGap) + demoH + gapLinesButtons + btnH;
        const top = Math.max(40, (canvas.height - blockH) / 2);
        const yTitle = top + titleSize, linesStartY = yTitle + gapTitleLines;
        const buttonsTopY = linesStartY + lineCount * lineGap + demoH + gapLinesButtons - btnH;
        const demoCenterY = linesStartY + lineCount * lineGap + demoH / 2;
        return { isStart, titleSize, lineGap, btnH, yTitle, linesStartY, buttonsTopY, demoCenterY };
    }

    /**
     * Draws a translucent backdrop over the full canvas.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {HTMLCanvasElement} canvas Target canvas
     * @returns {void}
     */
    static drawBackdrop(ctx, canvas) {
        ctx.save();
        ctx.fillStyle='rgba(0,0,0,0.7)'; ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.fillStyle='rgba(30,30,36,0.7)'; ctx.strokeStyle='#888'; ctx.lineWidth=2;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(0,0,canvas.width,canvas.height,0); else ctx.rect(0,0,canvas.width,canvas.height);
        ctx.fill(); ctx.stroke(); ctx.restore();
    }

    /**
     * Draws the title and each line centered using letter-spaced text.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {HTMLCanvasElement} canvas Target canvas
     * @param {{title:string,lines:string[]}} screen Screen definition
     * @param {{yTitle:number,linesStartY:number,lineGap:number}} lay Layout object
     * @returns {void}
     */
    static drawTitleAndLines(ctx, canvas, screen, lay) {
        Overlay.fillTextLS(ctx, screen.title, canvas.width/2, lay.yTitle, { size: lay.titleSize, align: 'center' });
        let y = lay.linesStartY;
        for (const line of (screen.lines || [])) {
            Overlay.fillTextLS(ctx, line, canvas.width/2, y, { size: 20, align: 'center' });
            y += lay.lineGap;
        }
    }

    /**
     * Draws the animated character demo used on the start screen.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {HTMLCanvasElement} canvas Target canvas
     * @param {{demoCenterY:number}} lay Layout object with demo center Y
     * @returns {void}
     */
    static drawDemoBlock(ctx, canvas, lay) {
        Overlay.initDemoIfNeeded();
        Overlay.updateDemoTimers(performance.now?.() ?? Date.now());
        Overlay.drawCharacterDemo(ctx, canvas, lay.demoCenterY);
    }

    /**
     * Applies text style properties to the canvas context.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {number} size Font size in px
     * @param {string} weight CSS font-weight
     * @param {string} color Fill color
     * @param {CanvasTextBaseline} baseline Baseline
     * @returns {void}
     */
    static applyTextStyle(ctx, size, weight, color, baseline) {
        ctx.fillStyle = color; ctx.textBaseline = baseline;
        ctx.font = `${weight} ${size}px ${Overlay.fontFamily}`;
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1;
    }

    /**
     * Computes the starting x for a text block given alignment and total width.
     * @param {number} x Anchor x
     * @param {'left'|'center'|'right'} align Alignment
     * @param {number} total Total width
     * @returns {number}
     */
    static computeStartX(x, align, total) {
        if (align === 'center') return x - total / 2;
        if (align === 'right') return x - total;
        return x;
    }

    /**
     * Draws characters with fixed letter spacing from a given start position.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {string} text Text to render
     * @param {number} startX Left-most x to begin drawing
     * @param {number} y Baseline y
     * @param {number} ls Letter-spacing in px
     * @returns {void}
     */
    static drawChars(ctx, text, startX, y, ls) {
        let cx = startX;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i]; ctx.fillText(ch, cx, y);
            cx += ctx.measureText(ch).width + (i < text.length - 1 ? ls : 0);
        }
    }

    /**
     * Finds a font size that makes text fit into a max width using letter spacing.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {string} text Text to fit
     * @param {number} maxWidth Maximum width in px
     * @param {number} maxSize Starting font size in px
     * @param {number} minSize Minimum font size in px
     * @param {string} weight CSS font-weight
     * @param {number|null} lsEm Letter-spacing in em (or null for default)
     * @returns {number} Chosen size
     */
    static calcFittingFontSize(ctx, text, maxWidth, maxSize, minSize, weight, lsEm) {
        let size = maxSize;
        while (size > minSize) {
            ctx.save(); ctx.font = `${weight} ${size}px ${Overlay.fontFamily}`;
            const w = Overlay.measureWithSpacing(ctx, text, size, lsEm);
            ctx.restore(); if (w <= maxWidth) break; size -= 1;
        }
        return Math.max(size, minSize);
    }

    /**
     * Draws a rounded rectangle button background.
     * @param {CanvasRenderingContext2D} ctx Canvas 2D context
     * @param {number} x Left
     * @param {number} y Top
     * @param {number} w Width
     * @param {number} h Height
     * @returns {void}
     */
    static drawButtonShape(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(45,47,56,0.9)'; ctx.strokeStyle = '#666'; ctx.lineWidth = 2;
        if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke(); }
        else { ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h); }
    }

    /**
     * Applies default character state and resets relevant stats/flags.
     * @param {any} c Character instance
     * @returns {void}
     */
    static applyDefaultCharacterState(c) {
        Object.assign(c, {
            coins:0, allcoins:0, hearts:0, weaponLevel:0,
            luckyPowerup:false, invulnPowerup:false, invulnActive:false,
            invulnCooldown:0, invulnTimer:0, health:100, maxHealth:100,
            isDead:false, isHurt:false, isAttacking:false, state:'idle'
        });
    }

    /**
     * Resumes the world and hides the overlay.
     * @returns {void}
     */
    static handleResume() {
        if (window.world) { window.world.paused = false; Overlay.state = 'none'; }
        Overlay.syncDomVisibility();
    }
    
    /**
     * Starts or restarts the game at level 1 and hides the overlay.
     * Initializes level1 if available and plays its theme.
     * @returns {void}
     */
    static handleStart() {
        Overlay.resetGameState();
        try { if (typeof window.initLevel1 === 'function') window.initLevel1(); } catch {}
        const lv1 = window.level1 ?? (typeof level1 !== 'undefined' ? level1 : null);
        if (window.world && lv1) {
            Level.load(window.world, lv1); window.world.paused = false; Overlay.state = 'none';
            Overlay.syncDomVisibility(); try { AudioManager.playThemeForLevel?.(window.world.currentLevel); } catch {}
        } else { Overlay.state = 'none'; Overlay.syncDomVisibility(); }
    }

    /**
     * Restarts level 1, resets game state and resumes the world.
     * @returns {void}
     */
    static handleRestart() {
        AudioManager.playSfx?.('gameover');
        Overlay.resetGameState();
        try { if (typeof window.initLevel1 === 'function') window.initLevel1(); } catch {}
        if (window.world) { Level.load(window.world, window.level1); window.world.paused = false; }
        Overlay.state = 'none'; Overlay.syncDomVisibility();
        try { AudioManager.playThemeForLevel?.(window.world.currentLevel); } catch {}
    }

    /** Switches to the help screen. */
    static handleHelp(){ Overlay.state = 'help'; Overlay.syncDomVisibility(); }

    /** Goes back to the start screen. */
    static handleBack(){ Overlay.state = 'start'; Overlay.syncDomVisibility(); }

    /**
     * Returns to the start screen and stops audio; leaves world paused.
     * @returns {void}
     */
    static handleHome(){
        if (window.world) window.world.paused = true;
        Overlay.state = 'start'; Overlay.syncDomVisibility();
        try { AudioManager.stopMusic?.(); } catch {}
    }

    /**
     * Proceeds to the next level or shows final screen when on the last one.
     * Calls onProceed if provided, otherwise uses Level.init/load helpers.
     * @returns {void}
     */
    static handleProceed() {
        AudioManager.playSfx?.('win');
        if (window.world && window.world.currentLevel === window.level3) { 
            Overlay.state = 'final'; Overlay.syncDomVisibility(); return; 
        }
        if (typeof Overlay.onProceed === 'function') return Overlay.onProceed();
        const w = window.world; if (!w) return;
        if (w.currentLevel === window.level1) { try { window.initLevel2?.(); } catch {} Level.load(w, window.level2); }
        else if (w.currentLevel === window.level2) { try { window.initLevel3?.(); } catch {} Level.load(w, window.level3); }
        else { Overlay.state = 'final'; Overlay.syncDomVisibility(); return; }
        w.paused = false; Overlay.state = 'none'; Overlay.syncDomVisibility();
        try { AudioManager.playThemeForLevel?.(w.currentLevel); } catch {}
    }

static updatePreChecks() {
  if (this.paused) return true;
  if (this.character?.isDead && Overlay?.state !== 'dead') {
    this.paused = true; 
    Overlay.state = 'dead'; 
    AudioManager.playSfx?.('gameover');
    window.updatePauseIcon?.(); 
    return true;
  }
  return false;
}
}