# ⚡ STATIC DICE

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

### Entropy Source
Unlike most rollers, Static Dice uses the **Web Crypto API** (`window.crypto.getRandomValues`). This taps into hardware-level entropy to generate values that are statistically indistinguishable from true randomness.

### Core Stack & Modularity
- **Frontend**: Lightweight HTML application with Tailwind CSS.
- **Data Architecture**: Built on a flexible entity-component system (`DataArchitecture.js`) that supports generic blueprinting for diverse TTRPG rule systems.
- **Logic**: `DiceEngine.js` — A standalone, testable class that manages all mathematical operations using a Shunting-yard RPN parser.
- **Parser Subsystem**: Modular parsing logic (`Parsers/`) allows easy expansion for new third-party integrations without cluttering the core UI code.
- **Testing**: Built-in entropy verification (Stress Test) and a robust Jest testing suite for the engine.

---

## 🚀 Getting Started

Simply open `DiceRoller.html` in any modern web browser. No installation or internet connection is required once the file is saved locally.

```bash
# To run tests (requires Node.js)
npm install
npm test
```

---

## 📜 License
© 2026 SeeJayMcLeod. This tool is free software released under the **GNU GPLv3**.
