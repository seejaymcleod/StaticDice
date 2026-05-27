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

## 🗃️ Dice Arsenal & Cascade Chains

### 1. Storage & Organization
- Saved loadouts are stored in `engine.savedQueues`.
- Loadouts are filtered dynamically in `renderSavedQueues()` using `activeCharacterId` and `activeGroupId`.
- **Legacy Fallback**: Loadouts missing `characterId` or `groupId` default to `activeCharacterId = 'primary'` and `activeGroupId = 'grp_stats_1'`.

### 2. Drag-and-Drop Interaction
- **Reordering**: Dragging items triggers index swaps inside `engine.savedQueues`, persisted via `persistSaved()` and re-rendered.
- **Empty Group Drop**: Dragging onto an empty group triggers `assignQueueGroup(dragSrcId, activeGroupId)` to move the item to that group.

### 3. Actions Menu (Gear Icon)
- **ADV/DIS Toggle (`includeAdvDis`)**: Displays secondary `ADV` and `DIS` buttons to roll the loadout with advantage/disadvantage directly.
- **Edit Loadout (`loadQueue`)**: Restores the saved unified queue. Translates legacy `chipType` structures to current `nodeType` structures automatically.
- **Overwrite (`updateSavedQueue`)**: Replaces the saved loadout's properties with the active engine queue.
- **Rename (`renameSavedQueue`)**: Updates the display name via text modal.
- **Appearance (`openColorPicker`)**: Sets the highlight color using a 20-color preset palette (`COLOR_PALETTE`).
- **Move to Group (`moveQueueToGroup`)**: Changes `groupId` to target another category.
- **Delete (`deleteQueue`)**: Splices the item from storage.

### 4. Cascade Roll Chains
- Loadouts can define post-roll chain configurations (`chainSuccessSelect`, `chainCritSelect`, `chainFailSelect`).
- Executing a chain (`executeRollChain`) shifts the UI display to `#chain-cascade-container`.
- It processes sequentially: displays step totals, updates rolling status animations, outputs the `flatDescription`, and halts if target checks fail or when the chain ends normally.

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
- **Math First**: Implement new mechanics in `DiceEngine.js` and verify via `DiceEngine.test.js` before making UI changes in `DiceRoller.html`.
- **Schema Strictness**: Generate queue elements adhering strictly to the Node JSON schemas above.
