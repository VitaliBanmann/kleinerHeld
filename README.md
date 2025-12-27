# Kleiner Held – 2D Jump & Run Game

Ein unterhaltsames 2D Jump & Run Spiel, entwickelt mit objektorientierter Programmierung und HTML5 Canvas.

## Features

**Flüssiges Gameplay** – Springe, laufe und weiche Hindernissen aus  
**Score System** – Sammle Punkte und erreiche neue Highscores  
**Verschiedene Gegner** – Unterschiedliche Feindtypen mit eigener KI  
**Pixel Art Grafiken** – Charakter, Umgebung und Animationen  
**Mobile Support** – Spielbar auf Desktop und Touch-Geräten  

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Grafiken:** HTML5 Canvas API
- **Architektur:** Objektorientierte Programmierung (OOP)
- **Tools:** Git

## Installation & Nutzung

```bash
# 1. Repository klonen
git clone https://github.com/VitaliBanmann/KleinerHeld.git
cd KleinerHeld

# 2. Projekt starten
# Option A: VS Code Live Server Extension
# Option B: Node.js Server
npx serve .

# 3. Im Browser öffnen & spielen
# http://localhost:5000
```

## Live Demo

🌐 [Kleiner Held Live Demo](http://kleinerheld.vitali-banmann.de/)

## Steuerung

| Taste | Aktion |
|-------|--------|
| **A | Nach links laufen |
| **D | Nach rechts laufen |
| **Q | Angriff1 |
| **E | Angriff2 |
| **W | Heilung kaufen und nutzen |
| **1 | **2 | **3 | Verbesserungen kaufen |
| **SPACE** | Springen |
| **P** | Pause |

## Projektstruktur

```
KleinerHeld/
├── index.html          # Hauptseite & Canvas
├── script.js           # Game Loop & OOP Klassen
├── styles.css          # Styling
├── assets/             # Grafiken & Sounds
│   ├── sprites/        # Charakter & Gegner
│   └── sounds/         # Audio-Dateien
└── classes/            # OOP Klassendefinitionen
    ├── Character.js
    ├── Enemy.js
    ├── Game.js
    └── ...
```

## Code Highlights

- **Character & Enemy Klassen** – Erben von einer gemeinsamen `MovableObject`-Klasse
- **Collision Detection** – Präzise Hitbox-Berechnung
- **Animation System** – Sprite-basierte Animationen
- **Game States** – Intro, Playing, Game Over, Victory

## Autor

[Vitali Banmann](https://github.com/VitaliBanmann)

## Lizenz

MIT
