# Modifier Chips System — Proposal & Implementation Log

> **Purpose:** This file is the canonical living document for the Modifier Chips feature.
> It tracks design intent, current implementation status, known bugs, and remaining work.
> It must be kept up-to-date as each session makes progress.

---

## 1. Background & Goal

The StaticDice app previously handled flat roll modifiers as a single integer or string variable name (e.g. `engine.flatMod = 3` or `engine.flatMod = "STR"`). This was simple but severely limited: you could only apply one modifier, and expressions like `STR + LVL/2` were impossible.

The goal is to replace this with a **Modifier Chips** system: a structured list of modifier terms that can each independently specify a base value (literal or character variable), an optional multiplier and divisor (also literal or variable), and a rounding mode. The chips are rendered as interactive neon capsules in the UI that the user can add and delete without typing formulas manually.

**Example roll description enabled by this system:**
```
Roll 2d6 + STR + LVL/2(↑) - 3
```

---

## 2. Design: The Modifier Term Schema

Each chip in the list (`engine._flatMod`) is an object with this shape:

```typescript
interface ModifierTerm {
    type:           'literal' | 'variable';  // Is the base a number or a named character variable?
    value:          number | string;          // The literal number OR variable name (e.g. "STR")
    operator:       '+' | '-';               // Whether this chip adds or subtracts
    multiplierType: 'none' | 'literal' | 'variable';
    multiplierValue: number | string;        // e.g. 2, or "LVL"
    divisorType:    'none' | 'literal' | 'variable';
    divisorValue:   number | string;
    roundMode:      'none' | 'up' | 'down' | 'round';  // ↑ ↓ ≈
}
```

**Evaluation order:** `((base * multiplier) / divisor)` → apply rounding → apply operator.

---

## 3. Engine Implementation (`DiceEngine.js`)

### 3a. Private Backing Field + ES6 Getter/Setter (COMPLETE ✅)

The key architectural decision: the internal store is `this._flatMod` (always an array), but the public property `this.flatMod` uses an ES6 getter that returns backwards-compatible primitives for simple single-chip cases so that existing code and unit tests continue to work without modification.

**Getter behaviour:**
- Empty array → returns `0`
- One simple literal chip (no multiplier/divisor) → returns the signed integer (e.g. `-3` or `5`)
- One simple variable chip (no multiplier/divisor) → returns the variable name string (e.g. `"STR"`)
- Anything else (multiple chips, or complex chips) → returns the full `_flatMod` array

**Setter behaviour:** Accepts a number, a string, an array of terms, or `0`/`[]`/`''` to clear. Normalizes all legacy formats into the array structure automatically.

**Location:** `DiceEngine.js` lines 1–67

### 3b. Internal Methods Using `_flatMod` Directly (COMPLETE ✅)

These methods bypass the getter and manipulate the backing array directly:

| Method | Location | Notes |
|---|---|---|
| `backspaceQueue()` | line 100 | Pops last chip, or last die group |
| `adjustFlatMod(val)` | line 113 | Updates last simple literal chip, or pushes a new one |
| `clearQueue()` | line 163 | Resets `_flatMod = []` |
| `saveQueue()` | line 214 | Saves `_flatMod` array into the loadout record |
| `loadQueue()` | line 233 | Normalizes legacy flat values into chip arrays on load |
| `updateSavedQueue()` | line 291 | Snapshots `_flatMod` into the saved record |
| `calculateRoll()` → `activeFlat` | line 397 | Reads `_flatMod` directly so it always gets the array |

### 3c. Evaluator & Helpers (COMPLETE ✅)

| Method | Location | Purpose |
|---|---|---|
| `resolveModifier(chips)` | line 312 | Walks the chip list, resolves variables, applies math and rounding, returns a single integer total |
| `getModifierTermString(term)` | line 369 | Returns human-readable expression string, e.g. `"+ STR / 2 (↑)"` |

### 3d. Breakdown Rows in `calculateRoll()` (COMPLETE ✅)

When chips are applied, each one gets its own breakdown row in the roll history:
- **Simple single chip (backward compat):** Shows `formula: "Flat Mod"` and `subtotal: "STR (+2)"` matching the old test expectations
- **Complex or multi-chip:** Shows the full expression, e.g. `"+ STR * 2"`, subtotal `"+20"`

**Location:** `DiceEngine.js` lines 596–673

### 3e. Test Suite (ALL 18 PASSING ✅)

```
Tests/DiceEngine.test.js — 18/18 passing
```

The getter/setter abstraction keeps all existing test assertions (`expect(engine.flatMod).toBe(5)` etc.) working without any test changes.

---

## 4. HTML/UI Implementation (`DiceRoller.html`)

### 4a. Main Panel: Active Chips Row (COMPLETE ✅)

A `div#main-active-chips-row` is placed immediately below the MOD/TARGET stepper row. It is hidden when `_flatMod` is empty, and rendered by `renderModifierChips()`. Each chip appears as a compact neon capsule with an `✕` remove button.

**Location:** HTML around line 1107–1112

### 4b. Advanced Rules Panel: Modifier Chips Section (COMPLETE ✅)

A full "5. Modifier Chips" block was added below "4. Explode" in the Advanced Rules sidebar. It contains:
- A header row with the live **Total** badge (e.g. `Total: +17`)
- `div#modifier-chips-list` — the rendered list of active chips
- A collapsible **Add Complex Chip** builder block with:
  - `#new-chip-operator` — `+` or `-`
  - `#new-chip-base-type` — Literal / Variable (toggles between number input and dropdown)
  - `#new-chip-base-literal` — number input
  - `#new-chip-base-variable` — variable dropdown (populated dynamically)
  - `#math-options-btn` — toggles visibility of the math options panel
  - `#new-chip-math-opts` (collapsible) — Multiply (type + value), Divide (type + value), Rounding mode
  - `＋ Add Modifier Chip` button

**Location:** HTML lines 1375–1466

### 4c. JavaScript Functions (COMPLETE ✅ but see Bug #1 below)

All functions live in `DiceRoller.html` around lines 2957–3186:

| Function | Purpose |
|---|---|
| `toggleNewChipBaseType()` | Shows/hides literal input vs. variable dropdown for base value |
| `toggleNewChipMultType()` | Shows/hides multiplier value field |
| `toggleNewChipDivType()` | Shows/hides divisor value field |
| `toggleMathOptions()` | Collapses/expands the advanced math sub-panel |
| `populateVariablesDropdown(el)` | Fills a `<select>` with current character's variable names |
| `addNewModifierChip()` | Validates inputs and pushes a new term to the engine chip list |
| `removeModifierChip(index, e)` | Splices a chip out by index |
| `renderModifierChips()` | Renders chips in both the sidebar panel and the main-screen capsule row |

### 4d. `updateUI()` Refactor (COMPLETE ✅)

`updateUI()` was updated to:
- Detect whether `engine.flatMod` is a chip array or a primitive when computing `canRoll` and `hasFlatMod`
- Build the queue formula display by iterating each chip in the array
- Show the **resolved evaluated total** of all chips in the MOD stepper input (not the raw chip count)
- Call `renderModifierChips()` at the end of every UI refresh

**Location:** `DiceRoller.html` line ~2724

### 4e. `setFlatMod(val)` Refactor (COMPLETE ✅)

When the user types directly into the MOD input box, `setFlatMod()` now converts the integer into a single clean literal chip (clearing the array first), maintaining consistency with the chip system.

**Location:** `DiceRoller.html` line ~2610

### 4f. `populateRulesVariableDropdowns()` (COMPLETE ✅)

Extended to also call `populateVariablesDropdown()` on the three new chip-builder selects:
- `#new-chip-base-variable`
- `#new-chip-mult-variable`
- `#new-chip-div-variable`

This ensures they stay in sync whenever characters or variables change.

### 4g. `getTheoreticalDistribution()` (COMPLETE ✅)

Updated to handle array modifiers by calling `engine.resolveModifier(mod)` when `mod` is an array, ensuring probability curves remain accurate for complex chip configurations.

**Location:** `DiceRoller.html` line ~5434

### 4h. `renderSavedQueues()` / Arsenal Cards (COMPLETE ✅)

The formula string builder inside `renderSavedQueues()` was updated to loop over the flat modifier array and format each chip's expression inline on the Arsenal card label.

**Location:** `DiceRoller.html` line ~4787

---

## 5. Known Bugs 🐛

*(No known critical bugs. Bug #1 and Bug #2 regarding UI getter usage have been FIXED.)*

---

## 6. Remaining Work

### Priority 1 — Fix the bugs above (15 min)
*(✅ FIXED!)*

### Priority 2 — Character Resources Widget Integration (Future)
*(✅ FIXED!)*
The user wants modifier chips to also be accessible from the Character Resources popup, not just the Advanced Rules panel. A condensed version of the chip builder should live in the resources popup with a "copy to active queue" button.

### Priority 3 — Roll Formula Display Polish
*(✅ FIXED!)*
Currently chips show as `[+STR*2(+2)]` in the queue display box. Consider whether this is readable enough or whether it needs a more spaced format. Also consider a tooltip on hover showing the resolved integer.

### Priority 4 — Preset Chip Palettes

The user suggested something like `STRd6 + LVL/2(↑)` or `DEXd6 count 1s & 6s`. This suggests "Quick Chip" presets that can be associated with character class or role. Out of scope for now but worth tracking.

### Priority 5 — Chip Reordering
*(✅ FIXED!)*
Currently chips are added in order and removed by index. Drag-to-reorder would make the chip list much more ergonomic. Not yet started.

### Priority 6 — COUNT Mode Chips
*(✅ FIXED!)*
Currently flat modifier chips are skipped in `COUNT` mode (correct behaviour for dice counting, where a flat offset doesn't apply). However, the user may want to be able to add +/- to a SUCCESS count. This needs a design decision.

---

## 7. Files Changed

| File | Status | Key Changes |
|---|---|---|
| `DiceEngine.js` | ✅ Complete (needs no further work except if bugs found) | Private `_flatMod` backing field; ES6 getter/setter; `resolveModifier()`; `getModifierTermString()`; all internal methods updated to use `_flatMod` directly; breakdown rows upgraded |
| `DiceRoller.html` | ⚠️ Functionally complete but Bugs #1 and #2 need fixing | Modifier Chips HTML section in Advanced Rules; `#main-active-chips-row`; all JS functions; `updateUI()`; `setFlatMod()`; `populateRulesVariableDropdowns()`; `getTheoreticalDistribution()`; `renderSavedQueues()` |
| `Tests/DiceEngine.test.js` | ✅ All 18 tests passing — no changes needed | No changes |
| `.Task.md` | ✅ Unchanged | Project rules (no git commits, save settings on export) |

---

## 8. Architecture Diagram

```
engine._flatMod  (private array of ModifierTerm objects)
        │
        ├── get flatMod        → primitive (number/string) for simple 1-chip cases
        │                         full array for complex multi-chip cases
        │
        ├── set flatMod(val)   → normalizes number/string/array → array
        │
        ├── resolveModifier()  → collapses chip list to a single integer
        │       └── resolveVariable() → window.getActiveCharacterVariable()
        │
        ├── getModifierTermString() → human-readable expression per chip
        │
        └── calculateRoll()
                ├── reads _flatMod directly (bypasses getter)
                ├── calls resolveVariable() per chip
                └── appends one breakdown row per chip


DiceRoller.html
        │
        ├── updateUI()               → calls renderModifierChips() on every refresh
        │       └── MOD input shows engine.resolveModifier(_flatMod) as integer
        │
        ├── renderModifierChips()    → draws chips in sidebar + main capsule row
        │
        ├── addNewModifierChip()     → builds term object, pushes to _flatMod  ⚠️ BUG
        ├── removeModifierChip()     → splices _flatMod by index              ⚠️ BUG
        │
        ├── setFlatMod(val)          → keyboard input → single literal chip
        ├── adjustFlatMod(delta)     → stepper buttons → adjusts last literal chip
        │
        └── populateVariablesDropdown(el)  → fills select with character variable names
```

---

## 9. Session History

| Date | Session Summary |
|---|---|
| 2026-05-19 (night) | Engine refactor: `_flatMod`, getter/setter, `resolveModifier`, `getModifierTermString`, `calculateRoll` breakdown rows. All 18 tests passing. |
| 2026-05-19 (cont.) | HTML integration: `#main-active-chips-row`, Advanced Rules "5. Modifier Chips" section, all JS management functions, `updateUI()` refactor, `setFlatMod()`, `populateRulesVariableDropdowns()`, `getTheoreticalDistribution()`, `renderSavedQueues()` formula builder. |
| 2026-05-19 (this session) | Wrote `Chips.md`. Identified Bug #1 and Bug #2 (getter vs `_flatMod` in UI functions). |

---

## 10. Rules Reminder (from `.Task.md`)

- **Never change git branches or git commit.** The user handles all VCS operations manually.
- If settings changes should persist, make sure they are included in export/import.
