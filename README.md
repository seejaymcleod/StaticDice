# ⚡ STATIC DICE
June 3 16:01h
### High-Fidelity TTRPG Intelligence • Raw Electrical Entropy

**Static Dice** is a premium, web-based TTRPG dice roller designed for speed, precision, and tactile satisfaction. It replaces standard `Math.random()` calls with cryptographically secure pseudo-random numbers (CSPRNG), ensuring your critical hits (and failures) are driven by high-quality entropy.

---

## 🌌 The Experience
Static Dice is built with a **"Vivid Azure"** on **"The Void"** aesthetic—a high-contrast, glowing interface designed for dark-mode gaming environments. It features:
- **Glassmorphism UI**: Frosted glass panels and glowing accents.
- **Micro-Animations**: Weight-based bouncy transitions and haptic-style visual feedback.
- **Frictionless Logic**: A "Fire-and-Forget" interaction model that prioritizes speed during play.

---

## 🎲 Features

### Multi-Mode Rolling
- **Sum Mode**: Classic TTRPG rolling—totals your dice and adds modifiers.
- **Count Mode**: Success-based rolling (e.g., World of Darkness, Shadowrun). Counts dice meeting a target threshold.
- **List Mode**: Raw output for when you need to see every individual result clearly.

### 🎛️ The Arsenal & Polymorphic Widgets
Save your frequent rolls, character variables, or trackers as custom interactive widgets:
- **Polymorphic Cards**: Save widgets as Rollers, Compact Resource Steppers, Toggle Switches, Timers / Dynamic Countdowns, or Collapsible Text notes.
- **Roll Addons**: Extend Rollers with Advantage/Disadvantage buttons, inline description notes, or adjacent resource counters.
- **Clean Indicators**: Toggle card states cleanly using full-card tap triggers and sleek, vertical right-side "bulb" stripes.
- **Persistence & Portability**: Saved in LocalStorage, or easily imported/exported between devices via the Binder Drawer.

### ⚙️ Advanced Rules & Integrations
- **Advanced Mechanics**: Advantage/Disadvantage toggles, Exploding Dice, Target DC Rerolls, and automatic Set Detection (Pairs, Triples).
- **Universal Importer Registry**: Easily import characters from third-party tools (like Shadowdarklings) directly into the app. The system maps your stats, weapons, passive traits, and spellcasting automatically into interactive widget loadouts.

---

## ⚡ Technical Architecture

Static Dice is explicitly designed to be **Zero-Install** and **100% Offline-Capable**. You do not need a web server, bundler, or internet connection to use it—just open the file.

### Entropy Source
Unlike most rollers, Static Dice uses the **Web Crypto API** (`window.crypto.getRandomValues`). This taps into hardware-level entropy to generate values that are statistically indistinguishable from true randomness.

### Core Stack & Modularity
- **Frontend**: Lightweight HTML application with externalized Tailwind CSS (`style.css`).
- **Modular JS Core (`js/`)**: The UI logic is highly modularized into single-responsibility domains (`StorageManager`, `WidgetRenderer`, `App`) using a global namespace approach to avoid the file-breaking CORS errors associated with ES6 modules.
- **Data Architecture**: Built on a flexible entity-component system (`DataArchitecture.js`). TTRPG rule schemas (like Shadowdark) are fully decoupled into the `Systems/` directory.
- **Event Bus Decoupling**: A lightweight Publish/Subscribe system (`js/EventBus.js`) serves as the central nervous system, drastically decoupling the UI renderer from the math engine.
- **Logic**: `DiceEngine.js` — A standalone, testable class that manages all mathematical operations using a Shunting-yard RPN parser.
- **Parser Subsystem (`Parsers/`)**: Modular parsing logic intercepts imported data and routes it through an abstraction layer (`CharacterSheetAssembler.js`) to generate UI elements dynamically.

---

## 🚀 Getting Started

Simply open `DiceRoller.html` in any modern web browser. No installation or internet connection is required once the repository is saved locally on your device!

**For Developers:**
```bash
# To run mathematical integration tests (requires Node.js)
npm install
npm test
```

---

## 📜 License
© 2026 SeeJayMcLeod. This tool is free software released under the **GNU GPLv3**.
