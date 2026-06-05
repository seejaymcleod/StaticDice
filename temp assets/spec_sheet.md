# StaticDice — Change Spec Sheet
### Sessions: "Refactoring Entity Template" + This Session (June 4–5, 2026)

> [!IMPORTANT]
> This document captures **all work discussed, implemented, and partially-implemented** across both AI sessions. Use this as a rebuild checklist if restoring from a clean branch.

---

## 📁 Files Touched

| File | Changes |
|---|---|
| `js/App.js` | Context menu positioning, `configureSavedWidget` parent-retention fix, `hideName` persistence |
| `js/WidgetRenderer.js` | `entity` widget renderer, `grid` widget renderer, `hideName` conditional rendering, menu DOM injection |
| `DiceRoller.html` | Added `widget-hide-name` checkbox to widget config modal |
| `Assets/TemplatesData.js` | Undead Encounter template with Skeleton group, entities, and child widgets |

---

## 🗂️ SESSION 1: "Refactoring Entity Template" (June 4, 2026)

### What existed before this session
- Entity Group (`entity-group`) widget type existed with basic rendering
- Entity (`entity`) widget type existed with basic rendering
- Grid (`grid`) widget type existed but right-click / contextmenu was missing inside grids

---

### 1.1 — Entity Widget Renderer Overhaul (`WidgetRenderer.js`)

**Problem:** The `entity` widget rendered all children as a flat list. The spec required a structured 2-row layout per entity card.

**What was built:**
- **ROW 1:** `[Entity Name label | Notes text input (micro mode)]`
- **ROW 2:** `[HP Stepper (micro) + other children | Trigger button (right-aligned)]`

**Logic:**
```javascript
const textChildren = entityChildren.filter(c => c.widgetType === 'text');
const stepperChildren = entityChildren.filter(c => c.widgetType === 'stepper');
const triggerChildren = entityChildren.filter(c => c.widgetType === 'trigger');
const otherChildren = entityChildren.filter(c => !['text','stepper','trigger'].includes(c.widgetType));
```

Child widgets are rendered in `displayMode: 'micro'` (forced temporarily) and then their original mode is restored.

---

### 1.2 — Entity Group Renderer (`WidgetRenderer.js`)

**What was built:**
- `entity-group` wrapper renders a header with color dot + name
- `group-shared-area` (non-entity children: shared grids, etc.)
- `group-entities-area` (entity children)
- "Add Instance" button at bottom → calls `spawnGroupEntity(groupId)`

---

### 1.3 — Grid Widget Renderer — Right-Click / Long-Press (`WidgetRenderer.js`)

**Problem:** Grid cells (individual widgets inside a grid) had no context menu support. The grid's own drag-and-drop listeners swallowed all events. Right-clicking a grid widget (e.g., Ability Scores) did nothing.

**Fix attempted:** Add `contextmenu`, `touchstart`/`touchend`/`touchmove` hold listeners to each grid cell wrapper, calling `toggleArsenalMenu(q.id, e)`. `e.stopPropagation()` used to prevent the parent grid from consuming the event.

> [!WARNING]
> This was partially working — standalone arsenal widgets got right-click. Grid widgets inside grids (e.g., Skeleton Ability Scores) still didn't right-click correctly because the grid's own drag listeners prevented it. **NOT FULLY RESOLVED.**

---

### 1.4 — Menu Positioning — Absolute to Body (`App.js`)

**Problem:** Arsenal menus (right-click/long-press) were positioned *relative to the parent `.arsenal-item-wrapper`*, which worked fine for normal list widgets but broke for widgets inside grids (the menu appeared in wrong positions or offscreen).

**Fix:** Changed `toggleArsenalMenu` to append menus to `document.body` and calculate position using **global page coordinates** instead of local offsets.

```javascript
// Before (broken for grids):
let localX = clientX - rect.left;
targetMenu.style.left = `${localX}px`;

// After (fixed):
let pageX = clientX + window.scrollX;
targetMenu.style.position = 'absolute';
targetMenu.style.left = `${pageX}px`;
targetMenu.style.top = `${pageY + 8}px`;
```

Bound-checking added to keep menu within viewport width.

---

### 1.5 — Undead Encounter Template (`Assets/TemplatesData.js`)

**Template ID:** `template_encounter_undead`

**Widget tree:**
```
entity-group: "Skeleton Group" (id: w_eg_skeletons)
├── grid: "Skeleton Stats" (id: w_g_skeleton_stats)
│   ├── number: STR, DEX, CON, INT, WIS, CHA
│   └── number: STR_mod, DEX_mod, CON_mod, INT_mod, WIS_mod, CHA_mod
├── grid: "Vital Stats" (id: w_g_skeleton_vital)  
│   ├── number: AC
│   └── number: Speed
├── grid: "Skeleton Attacks" (id: w_g_skeleton_attacks)
│   ├── roller: Claw Attack
│   ├── roller: Claw Damage
│   ├── roller: Shortsword Attack
│   └── roller: Shortsword Damage
├── entity: "Skeleton A" (id: w_skele_a)
│   ├── stepper: HP (bindsVariable: SKELETON_A_HP, displayMode: micro)
│   ├── text: Notes (displayMode: micro)
│   └── trigger: Kill trigger (condition: HP <= 0 → show Kill button)
└── entity: "Skeleton B" (id: w_skele_b)
    ├── stepper: HP (bindsVariable: SKELETON_B_HP, displayMode: micro)
    ├── text: Notes (displayMode: micro)
    └── trigger: Kill trigger
```

**Variables at template level:**
```javascript
variables: {
    SKELETON_A_HP: "11",
    SKELETON_B_HP: "11"
}
```

> [!NOTE]
> The entity `Skeleton A`/`B` HP steppers **were confirmed to exist in `TemplatesData.js`** but the user reported "HP stepper missing on row 2". The root cause was the entity renderer not partitioning children correctly — fixed in 1.1 above.

---

### 1.6 — `spawnGroupEntity` Function (`App.js`)

**What was built:** A function to dynamically add a new `entity` instance inside an existing `entity-group`. Creates the entity widget plus default child widgets (HP stepper + Notes text + optional Trigger), then calls `persistSaved()` and `renderSavedQueues()`.

---

## 🗂️ SESSION 2: This Session (June 5, 2026)

### 2.1 — "Save Changes" Button Bug (`App.js`)

**Problem:** The "Save Changes" button in the widget configuration modal (`submitWidgetCreation`) wasn't reliably persisting changes. Specifically, the submit path for *editing an existing widget* (`editingWidgetId !== null`) was not flushing all fields correctly.

**Diagnosis:** `submitWidgetCreation` has two branches: a "create new" path and an "edit existing" path. The edit path was not reading some newer fields (display mode pills, compact matrix) because they were added later and the edit branch was not kept in sync with the create branch.

**Fix:** Ensured the edit path reads and writes:
- `q.displayMode`
- `q.fullShowFormula`, `q.fullShowNote`, `q.fullShowDetail`
- `q.showFormula`, `q.showNote`, `q.showDetail`
- `q.compactShowFormula`, `q.compactShowNote`, `q.compactShowDetail`
- (later) `q.hideName`

---

### 2.2 — Widget De-Parenting Bug (`App.js` → `configureSavedWidget`)

**Problem:** When opening the configure modal for a widget that had a `parentId` (i.e., it was inside an entity-group, grid, or entity), and then pressing "Save Changes", the widget would lose its parent — effectively being "de-parented" and appearing at the top-level list instead.

**Root cause:** `configureSavedWidget` populated the `widget-parent-id` dropdown with the filtered list of potential parents (e.g., entity-groups for the same character). But the **current parent** was sometimes excluded from the filter results (e.g., if it didn't match the character filter), so when Save was called it found no match and wrote `null` to `q.parentId`.

**Fix:**
```javascript
// After populating the dropdown, check if q.parentId is already in the list.
// If not, manually add it to preserve the existing relationship.
const parentDropdown = document.getElementById('widget-parent-id');
if (q.parentId) {
    const exists = [...parentDropdown.options].some(o => o.value === String(q.parentId));
    if (!exists) {
        const phantom = document.createElement('option');
        phantom.value = q.parentId;
        phantom.textContent = `(Current Parent: ${q.parentId})`;
        parentDropdown.appendChild(phantom);
    }
    parentDropdown.value = String(q.parentId);
}
```

---

### 2.3 — "Hide Widget Name" Feature

**Scope:** All widget types (roller, stepper, toggle, number, text, grid, entity-group).

**Files changed:**

#### `DiceRoller.html`
Added a checkbox to the widget config modal, right after the Display Matrix section:
```html
<!-- Hide Widget Name -->
<div class="pt-2 border-t border-white/5 flex items-center gap-2">
    <input type="checkbox" id="widget-hide-name"
        class="rounded border-white/10 bg-[#020617] text-[#00d4ff] focus:ring-sky-500 w-4 h-4">
    <label for="widget-hide-name" class="text-[10px] font-black text-slate-500 uppercase tracking-wider cursor-pointer">
        Hide Widget Name
    </label>
</div>
```

#### `js/App.js` — `configureSavedWidget` (read)
```javascript
const hideNameEl = document.getElementById('widget-hide-name');
if (hideNameEl) hideNameEl.checked = !!q.hideName;
```

#### `js/App.js` — `submitWidgetCreation` (write — edit path)
```javascript
const hideNameSave = document.getElementById('widget-hide-name');
q.hideName = hideNameSave ? hideNameSave.checked : false;
```

#### `js/App.js` — `submitWidgetCreation` (write — new widget path)
```javascript
hideName: (document.getElementById('widget-hide-name')?.checked ?? false)
```

#### `js/WidgetRenderer.js` — All name rendering spots
Every occurrence of rendering `resolvedName` was wrapped:
```javascript
// Before:
`<div class="text-sm font-black text-[#e2e8f0] truncate...">${resolvedName}</div>`

// After:
`${!q.hideName ? `<div class="text-sm font-black text-[#e2e8f0] truncate...">${resolvedName}</div>` : ''}`
```

This was applied to: roller (diceless), roller (normal), stepper, toggle, number, text, entity-group header, and all compact/micro layout variants.

---

### 2.4 — Ability Scores Grid — "Hide Title" Breaking Bug

**Problem:** When the user tried to hide the title of the Ability Scores grid widget via the configure modal, the whole grid broke (likely a rendering crash or the widget disappeared).

**Root cause:** A combination of issues:
1. The `hideName` conditional in the entity-group header removed the entire header `<div>`, which caused the `group-shared-area` and `group-entities-area` anchors to be missing from `innerHTML` before `querySelector` was called on them.
2. The de-parenting bug (2.2) may have also triggered, removing the grid from its parent.

**Status:** The `hideName` fix was implemented to use conditional template literals that render `''` instead of removing the containing div, which avoids the querySelector crash. The de-parenting fix was also applied.

> [!CAUTION]
> This specific bug combination (hideName + grid + configure modal) needs **fresh browser testing** after both fixes are applied.

---

### 2.5 — Git Merge Disaster & Recovery

**What happened:**
1. User attempted to merge `mobile-test` into `entity-template`
2. There were conflicts in `js/App.js` and `js/WidgetRenderer.js`
3. User committed the conflicted merge (conflict markers baked in, or wrong sides chosen)
4. This conversation tried to `git revert` the merge commit but local changes blocked it
5. `git reset --hard 7fbaa37` was run — rolled HEAD back to pre-merge "temp fix" commit

**Current branch state (as of this session):**
- HEAD: `entity-template` branch
- Commit: `f04821e` (merge + stash@{0} re-applied)
- `js/App.js` and `js/WidgetRenderer.js` have the stash content (chain-cascade UI, menu buttons)
- **Missing:** `hideName` feature (partially re-applied in this session), de-parenting fix, and ability scores grid fix

**Stash entries:**
- `stash@{0}`: GitHub Desktop auto-stash of entity-template work (contained: duplicate button, hide/show widget toggle, chain-cascade progress/final renderers)
- `stash@{1}`: Old WIP from `main` branch

---

## ✅ Status Summary

| Feature | Status | Notes |
|---|---|---|
| Entity widget 2-row layout | ✅ Done (Session 1) | Needs browser verification |
| Entity-group renderer | ✅ Done (Session 1) | |
| `spawnGroupEntity` | ✅ Done (Session 1) | |
| Undead Encounter template data | ✅ Done (Session 1) | In `TemplatesData.js` |
| Menu absolute positioning (body) | ✅ Done (Session 2) | Fixes menus on grids |
| Duplicate widget menu item | ✅ Done (via stash) | In WidgetRenderer menus |
| Hide/Show widget menu item | ✅ Done (via stash) | In WidgetRenderer menus |
| Chain-cascade progress UI | ✅ Done (via stash) | `renderChainProgress`, `renderChainFinal` |
| Save Changes bug (missing fields) | ✅ Done (Session 2) | |
| De-parenting bug fix | ✅ Done (Session 2) | `configureSavedWidget` parent-retention |
| Hide Widget Name — HTML checkbox | ✅ Done (this session) | `DiceRoller.html` |
| Hide Widget Name — App.js persist | ✅ Done (this session) | Read + write in both paths |
| Hide Widget Name — WidgetRenderer | ⚠️ Partial | `hideName` conditionals applied to most spots; needs verification |
| Grid right-click context menu | ⚠️ Partial | Works for standalone widgets, not yet for nested grid cells |
| Drag-and-drop OUT of grids | ❌ Not started | Original request: yank STR out of Ability Scores grid |
| Widget config on grid cells | ❌ Not started | Force compact mode, hide name per-cell |
| Undead Encounter template missing | ❌ REGRESSION | Template exists in `TemplatesData.js` but the branch state may not be rendering it correctly — likely a rendering/spawning code issue, not a data issue |

---

## 🔧 Recommended Next Steps (Clean Rebuild Order)

1. **Verify `mobile-test` is clean** — `git checkout mobile-test && git log --oneline -5`
2. **Create a fresh feature branch** off `mobile-test`
3. **Re-apply changes in this order:**
   - Menu absolute positioning (`toggleArsenalMenu` in `App.js`)
   - Entity + Entity-Group renderers (`WidgetRenderer.js`)
   - `spawnGroupEntity` (`App.js`)
   - De-parenting fix (`configureSavedWidget` in `App.js`)
   - `hideName` checkbox (`DiceRoller.html`)
   - `hideName` read/write (`App.js`)
   - `hideName` rendering (`WidgetRenderer.js`)
   - Chain-cascade UI (`renderChainProgress`, `renderChainFinal` in `WidgetRenderer.js`)
   - Duplicate widget + Hide/Show widget menu items (`WidgetRenderer.js`)
4. **Use browser integration for all UI testing** before committing
5. **Test specifically:** Spawn Undead Encounter → verify HP steppers on entities → right-click Ability Scores grid → configure a widget and Save → verify parent not lost → toggle Hide Name

---

## 💡 Key Architecture Notes

- **No bundler** — everything is global `var` and `<script>` tag loaded. No ES modules.
- **Widget state** lives in `engine.savedQueues[]` — each widget is a plain JS object (`q`).
- **`persistSaved()`** serializes to localStorage. **`renderSavedQueues()`** rebuilds DOM from scratch.
- **`editingWidgetId`** is the global that tracks which widget the configure modal is editing. `null` = new widget.
- **`hideName`** is stored directly on `q`: `q.hideName = true/false`.
- **`parentId`** on a widget determines its nesting — `null` = top-level, a valid ID = child of that widget.
- **Grid display** uses CSS grid with `colSpan` per child widget.
