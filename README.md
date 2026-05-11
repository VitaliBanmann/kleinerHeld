# 🦸 Kleiner Held - 2D Jump & Run Spiel

> Ein unterhaltsames 2D Jump & Run Spiel mit Canvas und OOP-Architektur. Springe, weiche Gegnern aus und sammle Upgrades!

## 🎮 Features

- ✅ **Dynamisches Gameplay** - Jump & Run Mechanik
- ✅ **KI-Gegner** - Intelligente Feind-Bewegung
- ✅ **Upgrade-System** - Waffen & Power-ups
- ✅ **Score-System** - Punkte & Level-Fortschritt
- ✅ **Mobile-Ready** - Touch-Controls & Responsive
- ✅ **Canvas Graphics** - Smooth Animationen
- ✅ **Multiple Level** - Progressive Schwierigkeit

## 🛠️ Tech Stack

- **Graphics:** HTML5 Canvas
- **Language:** Vanilla JavaScript (ES6+)
- **Architecture:** Object-Oriented Programming (OOP)
- **Audio:** Web Audio API (optional)

## 🚀 Quick Start

```bash
# 1. Lokalen Server starten
# Option A: Node.js
npx serve .

# Option B: Python 3
python -m http.server 8000

# Option C: PHP
php -S localhost:8000

# 2. Browser öffnen
# http://localhost:8000 (oder Portnummer anpassen)

# 3. Spielen!
# Arrow Keys oder A/D zum Bewegen
# Space zum Springen
```

## 🎮 Steuerung

| Taste | Aktion |
|-------|--------|
| `A` / `←` | Nach links bewegen |
| `D` / `→` | Nach rechts bewegen |
| `Space` | Springen |
| `1` | Waffen-Upgrade |
| `2` | Glücks-Upgrade |
| `ESC` | Pause |

## 🎯 Spielziel

1. Alle Level erfolgreich absolvieren
2. Gegner vermeiden oder besiegen
3. Upgrades sammeln für bessere Performance
4. Höchste Punktzahl erreichen

## 📁 Projektstruktur

```
Modul-11kleinerHeld/
├── index.html          # Spiel-Interface
├── styles.css         # Visuelle Gestaltung
├── js/
│   ├── script.js      # Hauptgame-Logik
│   ├── classes/       # OOP Classes
│   │   ├── Player.js      # Spieler-Klasse
│   │   ├── Enemy.js       # Gegner-Klasse
│   │   ├── Collectible.js # Sammelbare Items
│   │   └── Level.js       # Level-Management
│   └── utils/         # Hilfsfunktionen
├── levels/            # Level-Dateien
├── models/            # Game-Modelle
└── assets/           # Bilder & Sprites
    ├── charakter/    # Spieler-Grafiken
    ├── enemies/      # Gegner-Grafiken
    ├── buttons/      # UI-Buttons
    ├── coin/         # Münzen & Upgrades
    └── backgrounds/  # Level-Hintergründe
```

## 🏗️ Klassenstruktur (OOP)

### Player
```javascript
class Player {
  constructor() { /* ... */ }
  moveLeft() { /* ... */ }
  moveRight() { /* ... */ }
  jump() { /* ... */ }
  takeDamage() { /* ... */ }
}
```

### Enemy
```javascript
class Enemy {
  constructor(x, y) { /* ... */ }
  moveTowardsPlayer() { /* ... */ }
  detectCollision() { /* ... */ }
}
```

## 🎨 Grafiken & Assets

- **Spritesheet:** Character & Enemy Animationen
- **Hintergründe:** Level-spezifische Bilder
- **UI Elements:** Buttons, Score Display
- **Icons:** Upgrade-Symbole

## 💾 Speicher & LocalStorage

```javascript
// High Score speichern
localStorage.setItem('highScore', score);

// High Score laden
const highScore = localStorage.getItem('highScore');
```

## 📊 Game-Loop

```javascript
function gameLoop() {
  // 1. Input verarbeiten
  handleInput();
  
  // 2. Game-Logik updaten
  updatePlayer();
  updateEnemies();
  checkCollisions();
  
  // 3. Canvas zeichnen
  clearCanvas();
  drawBackground();
  drawPlayer();
  drawEnemies();
  drawUI();
  
  // Nächsten Frame
  requestAnimationFrame(gameLoop);
}
```

## 🐛 Debugging

Browser-Konsole öffnen (F12) für Logs und Fehlerdiagnose:

```javascript
console.log('Game State:', gameState);
console.log('Player Position:', player.x, player.y);
```

## 🚀 Optimierung & Performance

- **Canvas Rendering:** `requestAnimationFrame()` verwenden
- **Collision Detection:** Bounding Box statt Pixel-Perfect
- **Object Pooling:** Gegner & Items recyceln
- **Lazy Loading:** Assets bei Bedarf laden

## 🌐 Browser-Kompatibilität

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Browser (iOS/Android)

## 📱 Mobile Unterstützung

- Touch-Events implementiert
- Responsive Canvas-Sizing
- Mobile-freundliche Steuerung

## 📞 Support & Tipps

- Nutze die Browser DevTools (F12) zum Debuggen
- Überprüfe die Console auf JavaScript-Fehler
- TestJSON Lokalizeitung aktivieren zur Datenüberprüfung

---

_Ein spaßiges 2D-Spiel mit professioneller OOP-Struktur._