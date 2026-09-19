### Phase C — Depth & Polish Plan

**Goal:** Finalize full i18n coverage across remaining unlocalized pages, expand mock seed content for richer UX, wire missing navigation shortcuts, and clean up dead code to ensure top-tier polish.

#### Task 1: Full i18n & Dictionary Symmetry
- **Files:** `src/js/i18n.js`, unlocalized pages (`auth.html`, `create.html`, `initiative.html`, `offline.html`).
- **Action:** Add missing keys for ar/fr/en, ensuring 100% dictionary symmetry and zero untranslated UI strings.

#### Task 2: Richer Seed Content & Quiz Bank Expansion
- **Files:** `src/js/neon.js`.
- **Action:** Expand mock seed tables (more clubs, active training courses, consultations, approved initiatives) and broaden the awareness quiz question bank to 5+ questions per article.

#### Task 3: Navigation Polish & Orphaned Page Links
- **Files:** `src/js/layout.js`, headers/nav bars.
- **Action:** Add schools module link and a "More" dropdown/menu for notifications, invites, tasks, and initiative creation so no core page is orphaned.

#### Task 4: Final Asset Verification & Dead Code Pruning
- **Files:** `src/js/realtime.js`, `mobile/`, build configuration.
- **Action:** Verify public/ asset compilation, prune dead or unreferenced modules (`mobile/` folder), and run full suite verification + build check.
