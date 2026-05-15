# StaticDice UI/UX Improvement Roadmap

This document tracks optional UI/UX enhancements and bug fixes identified during the May 2026 audit. Items are ranked by priority.

## [P0] Critical & Functional Fixes
- [ ] **History Log Persistence**: Fix the bug where "Log is empty..." persists even after rolls are added.
- [ ] **Dice Button Touch Targets**: Increase the width of `－` and `＋` buttons (currently 28%) to improve mobile ergonomics and reduce mis-clicks.

## [P1] High Impact UX & Layout
- [ ] **Loadout Visual Cues**: Replace the red vertical "accent" bar on loadouts with a more thematic color (e.g., Cyan or Azure) to avoid signifying "error."
- [ ] **Sticky Section Optimization**: Reduce the vertical height of the sticky header on mobile to reclaim screen space for the dice grid and arsenal.
- [ ] **Feature Discoverability**: Move or visually emphasize the "Entropy Check" module to make it more accessible than the very bottom of the page.
- [ ] **Interaction Signage**: Implement a clear visual indicator for the current "Quick Dice" mode (Add to Queue vs. Roll Immediately).
- [ ] **Roll Breakdown Polish**: Modernize the breakdown display (e.g., `[2, 1] → 3`) to feel more integrated into the "Plasma" aesthetic rather than raw technical notation.

## [P2] Aesthetic & Polish
- [ ] **Contrast Boost**: Increase contrast for header utility icons (Import/Export/Sound) from dim grey to a more legible state.
- [ ] **Custom Dice Layout**: Fix text wrapping and alignment for the "Custom Dice" button to match standard dice rows.
- [ ] **Header Dead Space**: Reorganize the header to reduce the empty gap between the logo and utilities (consider adding character info or session stats here).
- [ ] **Design System Consolidation**: Standardize `border-radius` values across all components (mix of `lg`, `xl`, `2xl`).
- [ ] **Expanded Haptics**: Add `vibrate(5)` or similar feedback to primary actions like the Roll button and Dice selection for a more responsive feel.
- [ ] **Confidence Controls**: Increase the touch target size for the simulation stress count buttons (`÷10`, `×10`).
- [ ] **Layering Audit**: Review `z-index` values for overlays (Volume, Rules, Modals) to prevent unexpected overlaps.

## [P3] Minor Refinements
- [ ] **Dynamic Empty States**: Replace static "Log is empty" and empty Arsenal views with helpful onboarding tips or thematic flavor text.
- [ ] **Sound State Indicator**: Make the distinction between Sound ON and Sound OFF more visually prominent than a small 'x'.
- [ ] **"READY" Text Animation**: Add a subtle shimmer or pulse to the "READY" state in the result panel.
- [ ] **Audit Padding Fix**: Align the `details` content padding with the summary padding to eliminate the 4px "jump" on expand.
- [ ] **Responsive Breakpoint Polish**: Adjust header spacing for ultra-narrow devices (<360px).
- [ ] **Gradient Alignment**: Synchronize background and component gradient angles and colors for a more cohesive lighting model.
- [ ] **Roll Button Spacing**: Increase the gap between the main Roll button and the helper utilities (Backspace/Clear) to prevent accidental wipes.
- [ ] **Dropdown Jitter**: Fix centering and width issues in Rules panel dropdowns to prevent layout shifting during selection.
- [ ] **Scrollbar Visibility**: Slightly increase the opacity of the custom scrollbars for better discoverability.
- [ ] **Glass Hierarchy**: Establish a clear opacity/blur hierarchy for glass panels to signify depth and importance.
- [ ] **Logo Typography**: Increase letter-spacing (tracking) on the "STATICDICE" logo for better legibility at small sizes.
