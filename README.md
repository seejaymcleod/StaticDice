# ⚡ STATIC DICE
[[AI-generated, obviously. Once the code is stable, I'll look into make proper readme.]]
### High-Fidelity TTRPG Intelligence • Raw Electrical Entropy

**Static Dice** is a premium, web-based TTRPG dice roller designed for speed, precision, and tactile satisfaction. It replaces standard `Math.random()` calls with cryptographically secure pseudo-random numbers (CSPRNG), ensuring your critical hits (and failures) are driven by high-quality entropy.

![Static Dice UI Preview](Assets/StaticDice_Preview.png) *(Note: Placeholder for actual screenshot)*

---

##  The Experience
Static Dice is built with a **"Vivid Azure"** on **"The Void"** aesthetic—a high-contrast, glowing interface designed for dark-mode gaming environments. It features:
- **Glassmorphism UI**: Frosted glass panels and glowing accents.
- **Micro-Animations**: Weight-based bouncy transitions and haptic-style visual feedback.
- **Frictionless Logic**: A "Fire-and-Forget" interaction model that prioritizes speed during play.

---

## 🛠 Features

### 🎲 Multi-Mode Rolling
- **Sum Mode**: Classic TTRPG rolling—totals your dice and adds modifiers.
- **Count Mode**: Success-based rolling (e.g., World of Darkness, Shadowrun). Counts dice meeting a target threshold.
- **List Mode**: Raw output for when you need to see every individual result clearly.

### The Arsenal
Save your most frequent rolls as custom "Loadouts."
- **Persistence**: Saved to LocalStorage so they're ready whenever you return.
- **Customization**: Name your rolls, assign unique colors, and update them on the fly.
- **Import/Export**: Move your entire arsenal between devices via JSON.

### ⚙️ Advanced Rules
Static Dice handles complex mechanics so you don't have to:
- **Advantage/Disadvantage**: One-tap toggles for 5e-style rolling.
- **Exploding Dice**: Set dice to re-roll and add to the total when they hit a threshold.
- **Rerolls**: Automatically re-roll values (e.g., "Reroll 1s and 2s").
- **Set Detection**: Automatically identify pairs, triples, and quads in large pools.

---

## ⚡ Technical Architecture

### Entropy Source
Unlike most rollers, Static Dice uses the **Web Crypto API** (`window.crypto.getRandomValues`). This taps into hardware-level entropy (like electrical noise or thermal jitter) to generate values that are statistically indistinguishable from true randomness.

### Core Stack
- **Frontend**: Single-file HTML application for maximum portability.
- **Styling**: Tailwind CSS with a bespoke design system.
- **Logic**: `DiceEngine.js` — A standalone, testable class that manages all mathematical operations.
- **Testing**: Built-in entropy verification (Stress Test) to visualize distribution across 100,000+ rolls.

---

## 🎮 Interface Guide

1.  **The Display Zone**: Shows your final total, success labels, and a detailed breakdown of every single die roll (including rerolls and explosions).
2.  **The Queue**: As you tap dice, they are added to the queue. You can clear, backspace, or save this queue to your Arsenal.
3.  **Action Grid**: 
    *   **ADV/DIS**: Toggles Advantage/Disadvantage.
    *   **MOD**: Quick-stepper for flat situational modifiers.
    *   **TARGET**: Set the difficulty class (DC) or target number.
4.  **The Dice Grid**: D4 through D100, plus the ability to create **Custom Dice** for unique systems (D7, D30, etc.).
5.  **Advanced Rules Panel**: Accessible via the gear icon; configure success conditions, rerolls, and "fire-and-forget" behaviors.

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
