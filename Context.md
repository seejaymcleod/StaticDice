# ⚡ STATIC DICE | Project Context

## 📁 Repository Blueprint
- **DiceRoller.html**: The application shell and entry point. Loads stylesheets and sequentially injects the modular JavaScript components.
- **style.css**: Externalized styling, containing Tailwind core imports, glassmorphism UI rules, custom fonts, and micro-animations.
- **DiceEngine.js**: Mathematical core & parser (pure JS). Handles the Shunting-yard algorithm and CSPRNG logic.
- **DataArchitecture.js**: Core agnostic structural classes (`DiceSystem`, `Blueprint`, `Instance`, `CMSStore`).
- **js/**: Core application logic, highly modularized for AI parsing efficiency:
  - `EventBus.js`: Central publish/subscribe system decoupling UI from engine execution.
  - `StorageManager.js`: `localStorage` synchronization, saving/loading, and JSON importing/exporting.
  - `WidgetRenderer.js`: Constructs the DOM elements for the polymorphic interactive cards.
  - `App.js`: Global orchestrator, maintaining application state (`window` global variables) and general DOM listeners.
  - `CharacterSheetAssembler.js`: Data layer listening to the Event Bus to map imported Entity Blueprints to interactive UI widgets.
  - `components/DiceWidget.js`: Experimental prototype for native Web Components (`<dice-widget>`).
- **SD_Monster_Skeleton.json**: Base schema template for a Shadowdark skeleton monster.
- **SD_Monster_Blank.json**: Blank template for creating custom Shadowdark monsters.
- **Systems/**: Game-specific logic and schemas.
  - `Shadowdark/System.js`: Contains `ShadowdarkCharacterSchema`, `ShadowdarkMonsterSchema`, etc. Keeps the agnostic core untainted.
- **Parsers/**: Directory containing third-party importer logic.
  - `ParserRegistry.js`: Global registry for detecting and routing imported JSON data.
  - `ShadowdarkParser.js`: Specialized parser for Shadowdarklings character exports.
- **Tests/**: Jest mathematical test suite (`DiceEngine.test.js`, `IntegrationRunner.js`).
- **package.json**: Contains scripts/dependencies (Jest, jsdom) for running tests.

## 🎲 DiceEngine State & Schemas

### State Properties
* `queue`: Array of Node objects (dice, modifiers, operators) in chronological order.
* `rollRules`: Configuration object for rerolls, explosions, targetMode, sets.
* `savedQueues`: Saved loadouts (Arsenal), serialized/deserialized in localStorage.
* `overallTarget`: Numeric target (DC).

### Node Schemas

#### Dice Node
```json
{
  "nodeType": "node",
  "id": "string",
  "sides": 6,
  "count": 3,
  "localModifier": "ADV" | "DIS" | null,
  "localModLevel": 1,
  "rerollOp": ">=" | "<=" | ">" | "<" | "=",
  "rerollVal": 2,
  "explodeOp": "=",
  "explodeVal": 6
}
```

#### Modifier / Number Node
```json
{
  "nodeType": "modifier",
  "id": "string",
  "type": "literal" | "variable",
  "value": 5,
  "operator": "+" | "-",
  "multiplierType": "none" | "literal" | "variable",
  "multiplierValue": 2,
  "divisorType": "none" | "literal" | "variable",
  "divisorValue": 3,
  "roundMode": "none" | "up" | "down" | "round"
}
```

#### Operator Node
```json
{
  "nodeType": "operator",
  "operator": "+" | "-" | "*" | "/" | "(" | ")" | "ADV" | "DIS",
  "modifierLevel": 1,
  "roundMode": "none" | "up" | "down"
}
```

## 🎛️ Rules & Math Logic
- **Precedence**: Evaluated via Shunting-yard algorithm (RPN stack).
- **Implicit Additions**: Automatically inserts `+` between adjacent non-operators.
- **Advantage Propagation**:
  - Local: `[Dice] [ADV/DIS]` applies to the adjacent die.
  - Parenthetical: `([Group]) [ADV/DIS]` propagates to all dice inside `()`.
- **Rerolls**: Retries matching rolls up to 10 times to prevent infinite loops.
- **Exploding**: Adds matching dice to subtotal and rolls again (max 10).
- **Target Modes**: `sum` (math total), `count` (success count), `list` (raw results).
- **Sets Mode**: Filters and groups matching dice sizes using `setsOp` & `setsVal` (e.g. pairs, triples).

## 🗃️ Data Architecture (CMS Store)
- Defines base classes: `DiceSystem`, `Blueprint` (Entity & Component), `Instance` (Entity & Component), and `Container` (Campaign & Encounter).
- **Global Store (`CMSStore`)**: Stores active instances and overarching state across the application.
- **Agnostic Core**: The core data layer is separated from game-specific logic. TTRPG-specific blueprints (like Shadowdark) are isolated in the `Systems/` directory.

## 🗃️ Dice Arsenal, Binder Drawer & Polymorphic Widgets

### 1. Dice Binder Drawer
- **Navigation**: Access via the drawer icon `☰` sticky button. Its width scales up to a maximum on desktop displays.
- **Functionality**:
  - Displays list of campaigns, characters, templates, and RPG blueprints.
  - Character Sheet Variables: Modifiable character-specific stats dynamically injected into equations.
  - JSON Import/Export triggers cleanly integrated.

### 2. Polymorphic Saved Widgets
Saved items in `engine.savedQueues` act as different interactive cards based on their `widgetType`:
- **Roller Widget (`widgetType: 'roller'`)**: Performs dice rolls. Supports addons:
  - **ADV/DIS Buttons**: Advantage/Disadvantage triggers.
  - **Resource Counter Addon**: Tracker for ammunition (`value/max`).
  - **Toggle Addon**: Clean vertical "bulb" stripe on the right end, blocks rolls when off.
  - **Note Addon**: Description label below the card name.
- **Compact Widgets**: A slimline version of widgets (especially for resource trackers) to optimize screen space.
- **Timer / Dynamic Countdown Widget (`widgetType: 'timer'`)**: Specialized widget for tracking time-sensitive effects, buffs, or countdowns.
- **Stepper Widget (`widgetType: 'stepper'`)**: Standalone counter card with `+` and `-` buttons.
- **Toggle Widget (`widgetType: 'toggle'`)**: Standalone switch card with glowing status bulb.
- **Text Widget (`widgetType: 'text'`)**: Standalone collapsible text block.

### 3. Third-Party Character Importers (`Parsers/`)
- **Parser Registry (`ParserRegistry.js`)**: Automatically detects imported JSON formats and routes them to the correct parser.
- **Data Abstraction**: Parsers extract data and fire an `EventBus` emission. `CharacterSheetAssembler.js` intercepts this blueprint data and translates it into UI widgets, decoupling raw logic from rendering constraints.
- **Shadowdarklings Importer (`ShadowdarkParser.js`)**:
  - Maps stats, gear, and combat states to the Shadowdark schemas in `Systems/Shadowdark/System.js`.
  - Passives Display: Passive traits from class/ancestry are imported as Toggles/Text widgets. The source prefix (e.g., "Wizard-1") is moved to the widget's **Notes field** (formatted as `Bonus: Wizard(Class)-1`) to keep the primary widget name clean.

## 🎨 UI Hooks & Integration
- **Global State Variables**: State is managed via explicit top-level `var` variables in the `js/` modules. This ensures variables natively map to the global `window` object, allowing cross-file modularity while fully avoiding Webpack/Vite bundlers (preserving the portable offline `<script>` injection philosophy).
- **Event Bus Decoupling**: Application flows trigger via `EventBus.emit()` (e.g., `ROLL_COMPLETED`), drastically loosening coupling between UI buttons and the Math Engine.
- **Character Variables**: DiceEngine dynamically resolves stats using `window.getActiveCharacterVariable(name)`.
- **Haptics**: `haptics.tap()`, `haptics.thud()`, `haptics.error()`.
- **Sound**: Audio constructor using loaded sound assets.

## 🧪 Testing
- Jest unit tests (`Tests/DiceEngine.test.js`) and JSDOM integration tests (`Tests/IntegrationRunner.js`) run sequentially via `npm test`.
- Uses deterministic RNG mock to test calculations:
```javascript
engine.setRng((sides) => sides); // Returns max value
```

## 💡 AI Prompting Tips
- **Architectural Constraints**: Respect the modular layout (`js/`, `Systems/`, `Parsers/`). Do NOT embed complex styles in the HTML; use `style.css`.
- **Bundler-Free Strategy**: Do NOT introduce ES6 `import/export` or require bundlers like Webpack. The app must execute directly from the local file system using sequence-loaded global scripts. Use `var` for global state.
- **Math First**: Implement new math mechanics in `DiceEngine.js` and verify via tests before hooking into `js/WidgetRenderer.js`.
- **Schema Strictness**: Generate queue elements adhering strictly to the Node JSON schemas.
