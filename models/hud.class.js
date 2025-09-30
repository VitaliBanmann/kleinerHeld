class HUD {
    /**
     * Zentrale Layout- und Farb-Konfiguration.
     * @type {{
     *   fontFamily:string,
     *   letterSpacingEm:number,
     *   layout:{
     *     topMargin:number,
     *     healthBar:{'x%':number,'width%':number,y:number,height:number,radius:number},
     *     hearts:{'x%':number,y:number,size:number,gap:number,textOffsetY:number},
     *     powerups:{'x%':number,y:number,size:number,gap:number},
     *     coins:{iconSize:number,gapToButtons:number,textPad:number,y:number},
     *     buttons:{width:number,height:number,gap:number,rightMargin:number,y:number}
     *   },
     *   colors:{
     *     panelStroke:string,panelFill:string,
     *     hpGood:string,hpWarn:string,hpLow:string,
     *     text:string,boxFill:string,boxOn:string,boxOff:string
     *   }
     * }}
     */
    static SETTINGS = {
        fontFamily: "StoryScript, Arial, sans-serif",
        letterSpacingEm: 0.10,
        layout: {
            topMargin: 16,
            healthBar: { 'x%': 0.015, 'width%': 0.18, y: 18, height: 28, radius: 14 },
            hearts: { 'x%': 0.23, y: 18, size: 32, gap: 12, textOffsetY: 18 },
            powerups: { 'x%': 0.43, y: 14, size: 44, gap: 30 },
            coins: { iconSize: 32, gapToButtons: 120, textPad: 12, y: 18 },
            buttons: { width: 44, height: 36, gap: 18, rightMargin: 20, y: 18 }
        },
        colors: {
            panelStroke: "#222", panelFill: "#444",
            hpGood: "#3fae2a", hpWarn: "#fbc02d", hpLow: "#d32f2f",
            text: "#ffffff", boxFill: "#222", boxOn: "#ffffff", boxOff: "#888888"
        }
    };

    /**
     * Vorgebundene Bilder (Icons / Buttons).
     * @type {{
     *   heart:HTMLImageElement,
     *   coin:HTMLImageElement,
     *   powerups:{weapon1:HTMLImageElement,weapon2:HTMLImageElement,weapon3:HTMLImageElement,lucky:HTMLImageElement,invuln:HTMLImageElement},
     *   buttons:{pause:HTMLImageElement,play:HTMLImageElement,sound_on:HTMLImageElement,sound_off:HTMLImageElement,fs_on:HTMLImageElement,fs_off:HTMLImageElement}
     * }}
     */
    static IMAGES = {
        heart: HUD.loadImage("./assets/coin/heart.png"),
        coin:  HUD.loadImage("./assets/coin/coin.png"),
        powerups: {
            weapon1: HUD.loadImage("./assets/coin/anvil.png"),
            weapon2: HUD.loadImage("./assets/coin/ironbar.png"),
            weapon3: HUD.loadImage("./assets/coin/goldbar.png"),
            lucky:   HUD.loadImage("./assets/coin/cloverleaf.png"),
            invuln:  HUD.loadImage("./assets/coin/award.png")
        },
        buttons: {
            pause: HUD.loadImage("./assets/buttons/pause.png"),
            play: HUD.loadImage("./assets/buttons/play.png"),
            sound_on: HUD.loadImage("./assets/buttons/sound_on.png"),
            sound_off: HUD.loadImage("./assets/buttons/sound_off.png"),
            fs_on: HUD.loadImage("./assets/buttons/fullscreen.png"),
            fs_off: HUD.loadImage("./assets/buttons/fullscreen_exit.png")
        }
    };

    /**
     * Lädt ein Bild (Hilfsfunktion).
     * @param {string} src Pfad
     * @returns {HTMLImageElement}
     */
    static loadImage(src) { const img = new Image(); img.src = src; return img; }

    /**
     * Liest Powerup-Preise aus globalem Powerups-Objekt (Fallback-Werte).
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
     * Prozentuale X-Position (cfg['x%'] * canvas.width).
     * @param {HTMLCanvasElement} canvas
     * @param {Object} cfg
     * @returns {number}
     */
    static xPx(canvas, cfg) {
        if (typeof cfg['x%'] === 'number') return Math.floor(canvas.width * cfg['x%']);
        return 0;
    }

    /**
     * Prozentuale Breite (cfg['width%'] * canvas.width).
     * @param {HTMLCanvasElement} canvas
     * @param {Object} cfg
     * @returns {number}
     */
    static wPx(canvas, cfg) {
        if (typeof cfg['width%'] === 'number') return Math.floor(canvas.width * cfg['width%']);
        return 0;
    }

    /**
     * Zeichnet vollständiges HUD (Healthbar, Herzen, Powerups, Coins + Buttons).
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {Object} world
     */
    static draw(ctx, canvas, world) {
        const c = world?.character ?? {};
        const coins         = c.coins ?? 0;
        const hearts        = c.hearts ?? 0;
        const weaponLevel   = c.weaponLevel ?? 0;
        const lucky         = !!c.luckyPowerup;
        const invuln        = !!c.invulnPowerup;
        const invulnActive  = !!c.invulnActive;
        const invulnCooldown= c.invulnCooldown ?? 0;
        const invulnTimer   = c.invulnTimer ?? 0;
        const health        = c.health ?? 0;
        const maxHealth     = c.maxHealth ?? 100;

        ctx.save();
        HUD.drawHealthBar(ctx, canvas, health, maxHealth);
        HUD.drawHearts(ctx, canvas, hearts, health, maxHealth);
        HUD.drawPowerups(ctx, canvas, weaponLevel, lucky, invuln, invulnActive, invulnCooldown, invulnTimer);
        HUD.drawCoinsAndButtons(ctx, canvas, coins);
        ctx.restore();
    }

    /**
     * Zeichnet Lebensbalken mit dynamischer Farbe.
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {number} health
     * @param {number} maxHealth
     */
    static drawHealthBar(ctx, canvas, health, maxHealth) {
        const S = HUD.SETTINGS, cfg = S.layout.healthBar;
        const w = HUD.wPx(canvas, cfg), x = HUD.xPx(canvas, cfg);
        const y = cfg.y, h = cfg.height, r = cfg.radius;
        HUD.drawHealthBarFrame(ctx, x, y, w, h, r, S);
        const ratio = maxHealth > 0 ? Math.max(0, Math.min(1, health / maxHealth)) : 0;
        const fillColor = (health <= 30) ? S.colors.hpLow : (health <= 50 ? S.colors.hpWarn : S.colors.hpGood);
        const fillW = Math.round(w * ratio);
        HUD.drawHealthFillAndLabel(ctx, x, y, w, h, r, fillW, fillColor, `${health} / ${maxHealth}`, S);
    }

    /** Draws the health bar frame (background + border). */
    static drawHealthBarFrame(ctx, x, y, w, h, r, S) {
        ctx.lineWidth = 3;
        ctx.strokeStyle = S.colors.panelStroke;
        ctx.fillStyle = S.colors.panelFill;
        HUD.roundRect(ctx, x, y, w, h, r, true, true);
    }

    /** Draws the filled portion and centered label. */
    static drawHealthFillAndLabel(ctx, x, y, w, h, r, fillW, fillColor, label, S) {
        if (fillW > 0) { 
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
            ctx.clip();
            
            ctx.fillStyle = fillColor;
            HUD.roundRect(ctx, x, y, fillW, h, r, true, false);
            ctx.restore();
        }
        HUD.textSpaced(ctx, label, x + w / 2, y + h - 7, { size: 18, weight: "bold", align: "center", color: S.colors.text });
    }

    /**
     * Zeichnet Herz-Slots und Hinweistext (Kauf/Nutzung).
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {number} hearts
     * @param {number} health
     * @param {number} maxHealth
     */
    static drawHearts(ctx, canvas, hearts, health, maxHealth) {
        const cfg = HUD.SETTINGS.layout.hearts, size = cfg.size, gap = cfg.gap, y = cfg.y;
        const startX = HUD.xPx(canvas, cfg);
        const totalWidth = HUD.drawHeartSlots(ctx, startX, y, size, gap, hearts);
        const centerX = startX + totalWidth / 2;
        const hint = HUD.heartsHintText(hearts, health, maxHealth);
        HUD.textSpaced(ctx, hint, centerX, y + size + cfg.textOffsetY, { size: 15, align: "center", color: HUD.SETTINGS.colors.text });
    }

    /** Renders up to three heart slots and returns total width. */
    static drawHeartSlots(ctx, startX, y, size, gap, hearts) {
        const maxHearts = 3; let x = startX;
        for (let i = 0; i < maxHearts; i++) {
            const active = i < hearts; ctx.globalAlpha = active ? 1 : 0.3;
            ctx.drawImage(HUD.IMAGES.heart, x, y, size, size); x += size + gap;
        }
        ctx.globalAlpha = 1; return maxHearts * size + (maxHearts - 1) * gap;
    }

    /** Returns localized hint below the hearts. */
    static heartsHintText(hearts, health, maxHealth) {
        if (hearts > 0 && health <= maxHealth - 30) return "W = heilen";
        if (hearts > 0 && health > maxHealth - 30) return "W = weiteres Herz";
        return "W = Herz";
    }

    /**
     * Zeichnet Powerup-Slots (Waffe, Glück, Unverwundbarkeit).
     * Split into per-slot helpers.
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {number} weaponLevel
     * @param {boolean} lucky
     * @param {boolean} invuln
     * @param {boolean} invulnActive
     * @param {number} invulnCooldown
     * @param {number} invulnTimer
     */
    static drawPowerups(ctx, canvas, weaponLevel, lucky, invuln, invulnActive, invulnCooldown, invulnTimer) {
        const S = HUD.SETTINGS, cfg = S.layout.powerups, size = cfg.size, gap = cfg.gap, y = cfg.y, x0 = HUD.xPx(canvas, cfg);
        HUD.drawWeaponSlot(ctx, x0, y, size, weaponLevel);
        HUD.drawLuckySlot(ctx, x0 + (size + gap), y, size, !!lucky);
        HUD.drawInvulnSlot(ctx, x0 + 2 * (size + gap), y, size, invuln, invulnActive, invulnCooldown, invulnTimer);
    }

    /** Draws the weapon slot with label. */
    static drawWeaponSlot(ctx, x, y, size, level) {
        const icon = HUD.getWeaponIcon(level); HUD.powerupBox(ctx, x, y, size, icon, level > 0);
        HUD.textSpaced(ctx, (level >= 3 ? "max" : "1 kaufen"), x + size / 2, y + size + 18, { size: 14, align: "center", color: HUD.SETTINGS.colors.text });
    }

    /** Draws the lucky slot with label. */
    static drawLuckySlot(ctx, x, y, size, active) {
        HUD.powerupBox(ctx, x, y, size, HUD.IMAGES.powerups.lucky, active);
        HUD.textSpaced(ctx, (active ? "max" : "2 kaufen"), x + size / 2, y + size + 18, { size: 14, align: "center", color: HUD.SETTINGS.colors.text });
    }

    /** Draws invulnerability slot with localized timer/cooldown text. */
    static drawInvulnSlot(ctx, x, y, size, invuln, active, cdMs, timerMs) {
        HUD.powerupBox(ctx, x, y, size, HUD.IMAGES.powerups.invuln, !!(invuln || active));
        HUD.textSpaced(ctx, HUD.invulnText(invuln, active, cdMs, timerMs), x + size / 2, y + size + 18, { size: 14, align: "center", color: HUD.SETTINGS.colors.text });
    }

    /**
     * Builds the label text for the invulnerability power-up.
     * Shows buy hint, active timer, or cooldown seconds.
     * @param {boolean} invuln Owned
     * @param {boolean} active Currently active
     * @param {number} cdMs Cooldown in ms
     * @param {number} timerMs Remaining active time in ms
     * @returns {string}
     */
    static invulnText(invuln, active, cdMs, timerMs) {
        if (!invuln && !active) return "3 kaufen";
        if (active) {
            const s = Math.max(0, Math.ceil((timerMs || 0) / 1000));
            return `${s}s aktiv`;
        }
        const s = Math.max(0, Math.ceil((cdMs || 0) / 1000));
        return s > 0 ? `${s}s CD` : "bereit";
    }

    /**
     * Zeichnet Coin-Anzeige und Steuer-Buttons (Fullscreen / Sound / Pause).
     * Split: buttons drawing on desktop is delegated to a helper.
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLCanvasElement} canvas
     * @param {number} coins
     */
    static drawCoinsAndButtons(ctx, canvas, coins) {
        const S = HUD.SETTINGS, cb = S.layout.buttons, co = S.layout.coins;
        const isCoarse = window.matchMedia?.('(pointer: coarse)')?.matches === true;
        const rightX = canvas.width - cb.rightMargin, y = cb.y; HUD.btnAreas = [];
        if (!isCoarse) HUD.drawDesktopButtons(ctx, rightX, cb, y);
        const btnFullX = rightX - (cb.width * 3 + cb.gap * 2);
        const coinX = (!isCoarse ? btnFullX : rightX) - co.gapToButtons - co.iconSize - co.textPad;
        const coinY = co.y; ctx.drawImage(HUD.IMAGES.coin, coinX, coinY, co.iconSize, co.iconSize);
        HUD.textSpaced(ctx, String(coins), coinX + co.iconSize + co.textPad, coinY + co.iconSize - 8, { size: 22, align: "left", color: S.colors.text });
    }

    /** Draws desktop buttons and updates HUD.btnAreas. */
    static drawDesktopButtons(ctx, rightX, cb, y) {
        const btnPauseX = rightX - cb.width;
        const btnSoundX = btnPauseX - cb.gap - cb.width;
        const btnFullX = btnSoundX - cb.gap - cb.width;
        const isFs = (typeof isFullscreen === 'function') ? isFullscreen() : false;
        const fsImg = isFs ? HUD.IMAGES.buttons.fs_off : HUD.IMAGES.buttons.fs_on;
        const sndImg = (window.AudioManager?.muted) ? HUD.IMAGES.buttons.sound_off : HUD.IMAGES.buttons.sound_on;
        const pauseImg = (window.world?.paused) ? HUD.IMAGES.buttons.play : HUD.IMAGES.buttons.pause;
        HUD.iconButton(ctx, fsImg, btnFullX, y, cb.width, cb.height);
        HUD.iconButton(ctx, sndImg, btnSoundX, y, cb.width, cb.height);
        HUD.iconButton(ctx, pauseImg, btnPauseX, y, cb.width, cb.height);
        HUD.btnAreas.push(
            { id: 'fullscreen', x: btnFullX, y, w: cb.width, h: cb.height },
            { id: 'sound', x: btnSoundX, y, w: cb.width, h: cb.height },
            { id: 'pause', x: btnPauseX, y, w: cb.width, h: cb.height }
        );
    }

    /**
     * Zeichnet einen Button mit Icon.
     * @param {CanvasRenderingContext2D} ctx
     * @param {HTMLImageElement} img
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    static iconButton(ctx, img, x, y, w, h) {
        const S = HUD.SETTINGS;
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        HUD.roundRect(ctx, x, y, w, h, 10, true, true);
        if (img?.complete) {
            const pad = 6;
            ctx.drawImage(img, x + pad, y + pad, w - pad * 2, h - pad * 2);
        }
        ctx.restore();
    }

    /**
     * Behandelt Klick auf HUD-Buttons.
     * @param {number} x
     * @param {number} y
     * @param {Object} world
     * @returns {boolean} true wenn Button getroffen
     */
    static handleClick(x, y, world) {
        if (!HUD.btnAreas) return false;
        for (const b of HUD.btnAreas) {
            if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                if (b.id === 'fullscreen') { window.toggleFullscreen?.(); return true; }
                if (b.id === 'sound') { window.AudioManager?.toggleMute?.(); window.updateSoundIcon?.(); return true; }
                if (b.id === 'pause') { world?.togglePause?.(); window.updatePauseIcon?.(); return true; }
            }
        }
        return false;
    }

    /**
     * Misst Textbreite mit künstlichem Letter-Spacing.
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} text
     * @param {number} size Fontgröße
     * @param {number} lsEm Letter-Spacing in Em
     * @returns {number}
     */
    static measureSpaced(ctx, text, size, lsEm) {
        const lsPx = (lsEm ?? HUD.SETTINGS.letterSpacingEm) * size;
        let total = 0;
        for (let i = 0; i < text.length; i++) {
            total += ctx.measureText(text[i]).width;
            if (i < text.length - 1) total += lsPx;
        }
        return total;
    }

    /**
     * Zeichnet generischen Text-Button (derzeit ungenutzt).
     * Split into frame and label-fit helpers.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {string} label
     */
    static button(ctx, x, y, w, h, label) {
        const S = HUD.SETTINGS; HUD.drawButtonFrame(ctx, x, y, w, h, S);
        const size = HUD.fitText(ctx, label, w, S);
        const cx = x + w / 2, cy = y + h / 2 + 1;
        HUD.textSpaced(ctx, label, cx, cy, { size, align: "center", color: S.colors.text, baseline: "middle" });
    }

    /** Draws a button frame (rounded rectangle). */
    static drawButtonFrame(ctx, x, y, w, h, S) {
        ctx.save(); ctx.fillStyle = S.colors.boxFill; ctx.strokeStyle = S.colors.boxOn; ctx.lineWidth = 2;
        HUD.roundRect(ctx, x, y, w, h, 10, true, true); ctx.restore();
    }

    /** Fits text size into button width, returns chosen font size. */
    static fitText(ctx, label, w, S) {
        let size = 22;
        while (size > 10) {
            ctx.font = `${size}px ${S.fontFamily}`;
            if (HUD.measureSpaced(ctx, label, size, S.letterSpacingEm) <= w * 0.85) break;
            size -= 1;
        }
        return size;
    }

    /**
     * Zeichnet Text mit eigenem Letter-Spacing.
     * Split into style, layout, and draw helpers.
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} text
     * @param {number} x
     * @param {number} y
     * @param {{size?:number,weight?:string,color?:string,align?:CanvasTextAlign,baseline?:CanvasTextBaseline,letterSpacingEm?:number}} options
     */
    static textSpaced(ctx, text, x, y, options) {
        const opt = HUD.normalizeTextOptions(options);
        HUD.applyTextStyle(ctx, opt);
        const totalWidth = HUD.measureSpaced(ctx, text, opt.size, opt.letterSpacingEm);
        const lsPx = opt.letterSpacingEm * opt.size;
        const startX = opt.align === "center" ? x - totalWidth / 2 : (opt.align === "right" ? x - totalWidth : x);
        HUD.drawSpacedRun(ctx, text, startX, y, lsPx);
    }

    /** Normalizes text options and injects defaults. */
    static normalizeTextOptions(o) {
        const S = HUD.SETTINGS;
        return {
            size: o?.size ?? 18, weight: o?.weight ?? "normal", color: o?.color ?? S.colors.text,
            align: o?.align ?? "left", baseline: o?.baseline ?? "alphabetic",
            letterSpacingEm: o?.letterSpacingEm ?? S.letterSpacingEm, font: S.fontFamily
        };
    }

    /** Applies fill, baseline and font style to the context. */
    static applyTextStyle(ctx, opt) {
        ctx.save(); ctx.fillStyle = opt.color; ctx.textBaseline = opt.baseline;
        ctx.font = `${opt.weight} ${opt.size}px ${opt.font}`;
    }

    /** Draws a spaced glyph run and restores context. */
    static drawSpacedRun(ctx, text, startX, y, lsPx) {
        let cursorX = startX;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            ctx.fillText(ch, cursorX, y);
            cursorX += ctx.measureText(ch).width;
            if (i < text.length - 1) cursorX += lsPx;
        }
        ctx.restore();
    }

    /**
     * Zeichnet ein abgerundetes Rechteck.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {number} r Radius
     * @param {boolean} fill
     * @param {boolean} stroke
     */
    static roundRect(ctx, x, y, w, h, r, fill, stroke) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    /** Returns the weapon icon based on current level (1..3). */
    static getWeaponIcon(level) {
        if (level >= 3) return HUD.IMAGES.powerups.weapon3;
        if (level >= 2) return HUD.IMAGES.powerups.weapon2;
        return HUD.IMAGES.powerups.weapon1;
    }

    /**
     * Draws a powerup box with an icon; active state affects border color.
     * Keeps layout consistent across weapon/lucky/invuln slots.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} size Box size (square)
     * @param {HTMLImageElement} img Icon image
     * @param {boolean} active Highlight border when true
     */
    static powerupBox(ctx, x, y, size, img, active) {
        const S = HUD.SETTINGS;
        ctx.save();
        ctx.fillStyle = S.colors.boxFill;
        ctx.strokeStyle = active ? S.colors.boxOn : S.colors.boxOff;
        ctx.lineWidth = 2;
        HUD.roundRect(ctx, x, y, size, size, 8, true, true);
        if (img?.complete) {
            const pad = 6;
            ctx.drawImage(img, x + pad, y + pad, size - 2*pad, size - 2*pad);
        }
        ctx.restore();
    }
}
window.HUD = HUD;