### Phase C — Depth & Polish Plan

**Goal:** Finalize full i18n coverage across remaining unlocalized pages, expand mock seed content for richer UX, wire missing navigation shortcuts, and clean up dead code to ensure top-tier polish.

#### Task 1: Full i18n & Dictionary Symmetry
- **Files:** `src/js/i18n.js`, unlocalized pages (`auth.html`, `create.html`, `initiative.html`, `offline.html`).
- **Action:** Add missing keys for ar/fr/en, ensuring 100% dictionary symmetry and zero untranslated UI strings.
- **Status: [x] Done** — `auth.js` (login/signup/demo/recovery), `create.js` (header/form/publish), `initiative.js` (join/back/health/milestones/participants + localized title/desc), `offline.js` (new trilingual module). Also removed remaining CSP inline handlers (`support.html` tabs+form, `offline.html` retry, `initiative.js` back button).

#### Task 2: Richer Seed Content & Quiz Bank Expansion
- **Files:** `src/js/neon.js`, `src/pages/awareness.js`, `tests/run_tests.js`.
- **Action:** Expand mock seed tables (more clubs, active training courses, consultations, approved initiatives) and broaden the awareness quiz question bank to 5+ questions per article.
- **Status: [x] Done** — 6 clubs (+music, +sports/health) with new memberships, 5 training courses (+entrepreneurship, +public speaking), 5 initiatives (+2 approved: theater contest, girls mental-health workshop), 5 consultations (+2 answered), per-article quiz bank (aw_1/aw_2/aw_3 × 5 trilingual questions) + fallback, localized empty-state/open-button strings, platform-stats club assertion updated 4→6.

#### Task 3: Navigation Polish & Orphaned Page Links
- **Files:** `src/js/layout.js`, `src/js/i18n.js`.
- **Action:** Add schools module link and a "More" dropdown/menu for notifications, invites, tasks, and initiative creation so no core page is orphaned.
- **Status: [x] Done** — `schools.html` now linked in nav (uses existing `nav_schools` key + `school` icon); new "More" dropdown (`.more-btn` + `.more-sub`, wired via querySelectorAll after injection with outside-click close) surfaces notifications/invites/tasks/create for authenticated users; added `nav_more`, `nav_notifications`, `nav_invites`, `nav_tasks`, `nav_create` to all three dictionaries (symmetry preserved).

#### Task 4: Final Asset Verification & Dead Code Pruning
- **Files:** `src/js/realtime.js`, `mobile/`, build configuration.
- **Action:** Verify public/ asset compilation, prune dead or unreferenced modules (`mobile/` folder), and run full suite verification + build check.
