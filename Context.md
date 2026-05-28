# ⚡ STATIC DICE | Project Context

## 📁 Repository Blueprint
- **DiceEngine.js**: Mathematical core & parser (pure JS).
- **DiceRoller.html**: UI layer (single-file, Tailwind CSS CDN, audio, haptics).
- **Tests/DiceEngine.test.js**: Jest mathematical test suite.
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

## 🗃️ Dice Arsenal, Binder Drawer & Polymorphic Widgets

### 1. Dice Binder Drawer
- **Navigation**: Access via the drawer icon `☰` sticky button in the page header and the top-left of the main sticky result container (`#result-main`).
- **Functionality**:
  - Displays list of campaigns, characters, templates, and RPG blueprints.
  - Allows quick character selection, deletion, or template spawning (e.g. Fighter, Mage).
  - Integrates JSON Import/Export triggers at the bottom.

### 2. Polymorphic Saved Widgets
Saved items in `engine.savedQueues` can act as different types of interactive cards based on their `widgetType` property:
- **Roller Widget (`widgetType: 'roller'`)**: Performs dice queue rolls. Supports nested addons rendered visually beside or inside the card:
  - **ADV/DIS Buttons**: Sibling buttons (`w-[3rem]`, auto-stretching to match card height) to roll with advantage or disadvantage.
  - **Resource Counter Addon (`addonCounter: { label, max, value }`)**: Tracker for usages/ammunition rendered as external `-`, `value/max`, and `+` buttons next to the card. Auto-stretches vertically to match card height.
  - **Toggle Addon (`addonToggle: { checked, labelOn, labelOff }`)**: Replaces switches with a clean vertical "bulb" stripe (`w-6`) on the right end of the card. Fully illuminated with a themed color glow when active, and dim when inactive. Toggled via a text status label next to it. When unchecked, card opacity dims to 40% and rolls are blocked.
  - **Note Addon (`addonNote`)**: Small description label displayed below the card name inside the card.
- **Stepper Widget (`widgetType: 'stepper'`)**: Standalone counter card. Displays a label and value, with external stretching `+` and `-` buttons.
- **Toggle Widget (`widgetType: 'toggle'`)**: Standalone switch card. Displays status labels next to a vertical right-hand "bulb" stripe (glowing colored when active, dim when inactive). The entire card acts as a click toggle.
- **Text Widget (`widgetType: 'text'`)**: Standalone collapsible text block for campaign rules, spells, or character notes.

### 3. Drag-and-Drop Interaction
- **Reordering**: Dragging items triggers index swaps inside `engine.savedQueues`, persisted via `persistSaved()` and re-rendered.
- **Empty Group Drop**: Dragging onto an empty group triggers `assignQueueGroup(dragSrcId, activeGroupId)` to move the item to that group.

### 4. Actions Menu (Hold / Right-Click)
- **Menu Trigger**: Replaces the physical gear button to eliminate clutter. Accessed via a **hold (long-press) for 500ms** on mobile/desktop, or a **right-click (contextmenu)** on desktop. The dropdown context menu is dynamically positioned relative to the click/touch coordinates.
- **Configure (`configureSavedWidget`)**: Opens the widget modal in edit mode to modify name, type, and addons. Saves edits using `editingWidgetId`.
- **Edit Loadout (`loadQueue`)**: Restores the saved unified queue to the active roll panel.
- **Overwrite (`updateSavedQueue`)**: Overwrites the card's active roll formula with the current queue.
- **Appearance (`openColorPicker`)**: Selects the accent highlight color using the preset palette (`COLOR_PALETTE`).
- **Move to Group (`moveQueueToGroup`)**: Changes `groupId` to target another category.
- **Delete (`deleteQueue`)**: Splices the widget card from `engine.savedQueues` completely.

### 5. Cascade Roll Chains
- Loadouts can define post-roll chain configurations (`chainSuccessSelect`, `chainCritSelect`, `chainFailSelect`).
- Executing a chain (`executeRollChain`) shifts the UI display to `#chain-cascade-container`.
- Processes sequentially: displays step totals, updates rolling status animations, outputs the `flatDescription`, and halts if target checks fail or when the chain ends normally.

## 🎨 UI Hooks & Integration
- **Character Variables**: DiceEngine calls `window.getActiveCharacterVariable(name)` to resolve stats (e.g., `STR`) dynamically:
```javascript
window.getActiveCharacterVariable = function (name) {
    const char = characters.find(c => c.id === activeCharacterId);
    return (char && char.variables && char.variables[name] !== undefined) ? parseInt(char.variables[name]) : null;
};
```
- **Haptics**: `haptics.tap()` (15ms standard), `haptics.thud()` (40ms heavy roll), `haptics.error()` (pattern [45, 50, 45]).
- **Sound**: Audio constructor using `Assets/353844__magnesus__dice8.flac`.

## 🧪 Testing
- Jest unit tests (`Tests/DiceEngine.test.js`) and JSDOM integration tests (`Tests/IntegrationRunner.js`) run sequentially via `npm test`.
- Uses deterministic RNG mock to test calculations:
```javascript
engine.setRng((sides) => sides); // Returns max value
```

## 💡 AI Prompting Tips
- **Contiguous Edits**: In prompts, ask for targeted function replacements or git diffs rather than rewriting full files.
- **Math First**: Implement new math mechanics in `DiceEngine.js` and verify via `DiceEngine.test.js` before making UI changes in `DiceRoller.html`.
- **Schema Strictness**: Generate queue elements adhering strictly to the Node JSON schemas above.

# RULES
For Git, NEVER EVER COMMIT, REVERT OR CHANGE BRANCHES