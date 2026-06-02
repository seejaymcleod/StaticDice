# ⚡ STATIC DICE | Project Context

## 📁 Repository Blueprint
- **DiceEngine.js**: Mathematical core & parser (pure JS).
- **DataArchitecture.js**: Core structural classes for Systems, Blueprints, Instances, and Containers (Campaigns/Encounters).
- **DiceRoller.html**: UI layer (single-file HTML containing Tailwind CSS classes, inline scripts, audio, haptics).
- **Parsers/**: Directory containing third-party importer logic.
  - `ParserRegistry.js`: Global registry for detecting and routing imported data.
  - `ShadowdarkParser.js`: Specialized parser for Shadowdarklings character exports.
- **Tests/**: Jest mathematical test suite (`DiceEngine.test.js`, `IntegrationRunner.js`).
- **package.json**: Contains scripts/dependencies (Jest, jsdom).

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
- **Shadowdark System**: Pre-loaded system schema defining base entity blueprints (Characters, Monsters) and expected variable states (STR, DEX, AC, HP).

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
- **Shadowdarklings Importer (`ShadowdarkParser.js`)**:
  - Maps stats, gear, and combat states to the generic Shadowdark templates.
  - Passives Display: Passive traits from class/ancestry are imported as Toggles/Text widgets. The source prefix (e.g., "Wizard-1") is moved to the widget's **Notes field** (formatted as `Bonus: Wizard(Class)-1`) to keep the primary widget name clean.
  - Auto-calculates attack/damage properties based on core stat modifiers.

## 🎨 UI Hooks & Integration
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
- **Contiguous Edits**: Ask for targeted function replacements or git diffs rather than rewriting full files.
- **Math First**: Implement new math mechanics in `DiceEngine.js` and verify via tests before making UI changes.
- **Schema Strictness**: Generate queue elements adhering strictly to the Node JSON schemas.