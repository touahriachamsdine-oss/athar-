# Athar Production-Complete Design

Date: 2026-09-18
Status: Approved (design review in chat)
Audience: implementation planning (writing-plans)

## 1. Purpose

Athar (أثر) currently passes in demo/mock mode but breaks or lies in real
Vercel + Neon + GoTrue production. This design makes the platform genuinely
production-real and completes the missing product surfaces, in three ordered
phases. Delivery order is a hard dependency: Phase A fixes the foundation,
Phase B adds features on top, Phase C polish last.

## 2. Governing decisions (locked with user)

- Real production deployment is imminent; mock mode stays for local dev only.
- Auth is email + password with password reset via GoTrue `/v1/recover`.
  Phone is contact-only (no SMS/OTP provider).
- The broken native app (`mobile/`) is deleted from the repo.
- Client-trusted point awards are replaced by a server-derived points economy.
- All UI that currently passes in mock but violates the real schema is aligned
  to the schema (or the schema is fixed where the product intent is correct).
- No fake/demo data may be presented as real in production mode.

## 3. Phase A — Production Correctness

### A1. CSP-safe scripts
- Move every inline `<script type="module">` block out of `pages/*.html` into
  per-page modules: `src/pages/<name>.js` (one module per HTML page; the block
  body is preserved verbatim).
- Each page loads its module with `<script type="module" src="../src/pages/<name>.js">`.
- `vercel.json` CSP stays `script-src 'self'`. `style-src 'unsafe-inline'`
  remains and is documented as acceptable (inline styles are not an injection
  vector; no user input is rendered into inline style attributes unchecked).
- `build.js` already copies `src/` to output; no build change required for this
  beyond confirming the new `src/pages/` files are copied (they are part of `src/`).
- Affected pages (17): index, auth, offline, clubs, awareness, training,
  schools, support, volunteers, explore, initiative, dashboard, create, tasks,
  notifications, invites, profile, admin.

### A2. Schema/UI parity fixes
- **schools.html**: the page's product intent is deliberate (awareness
  campaigns, hostel visits, competitions, partnerships; public/private school
  funding), so fix the *schema* to the product, not the form to the schema:
  `school_visits.activity_type` CHECK becomes
  `('awareness_day','hostel_visit','competition','partnership')`
  (schema.sql:163) and `school_type` CHECK becomes `('public','private')`
  (schema.sql:160). Status CHECK stays `('pending','confirmed','completed',
  'cancelled')` (schema.sql:164). The page's existing submitted values are
  then schema-valid and do not change.
- **create.html**: collect optional FR/EN titles; at insert time fall back to
  the Arabic value for `title_fr`/`title_en` so NOT NULL (schema.sql:24) is
  satisfied. The same fallback rule applies to any RPC that receives
  `title_fr`/`title_en` from HTML `value` (e.g. volunteers create-session).
- **club_members.status**: `schema.sql` `club_members` gains
  `status text not null default 'active'` so the existing `clubs.html` insert
  (`status:'active'`) is schema-valid.
- **notifications.html**: remove the fake `MOCK_NOTIFS` fallback in real mode;
  empty result renders a real empty-state. Mock demo still may show seed rows.
- **certificate link** (training.html:275): replace fabricated
  `https://athar.dev/credentials/cert-<id>.pdf` with a localized, printable
  certificate page `pages/certificate.html?enroll=<id>` that renders the
  course/name/date and a print button. Link opens that page in a new tab.
- **explore filters**: chips map to real `initiative.category` values
  (`robotics | programming | theater | music | reading | other`).
- **landing stats** (index.html "MOCK STATS BAR"): bind to real live counts —
  club count, member count, visit count, volunteer-hours count — via a new
  `get_platform_stats()` `SECURITY DEFINER` read RPC (aggregates the real
  tables; no user input). Remove the hardcoded `48+ / 15K+ / 180+` marketing
  bar or replace it with real-number cards.

### A3. Server-enforced points economy
- New table `points_ledger(id uuid pk default gen_random_uuid(), user_id uuid
  references profiles(id), amount int not null, reason text not null, ref_type
  text, ref_id uuid, created_at timestamptz default now())`. RLS: no direct
  client write; insert only via `SECURITY DEFINER` functions.
- Points are derived from real events the DB already records:
  - Club membership: +100 per distinct club the user successfully joins
    (awarded by a trigger on first insertion into `club_members` for that
    `club_id`; the PK/unique constraint on the pair makes re-awards impossible).
  - Training completion: +200 per completed enrollment (completion is an
    existing RPC/state transition).
  - Approved school visit: +120 on a visit transitioned to `confirmed` or
    `completed`.
  - Awareness quiz: +50 per distinct `awareness_content` id, capped to a
    single award per content per user. Quiz completion is not currently a DB
    event, so add table `awareness_quiz_attempts(user_id, content_id, score,
    passed, created_at)` and RPC `record_quiz_attempt`; a trigger awards +50
    once per `content_id` when `passed`.
  - Volunteer attendance: +10 × hours, capped at +50 per session, awarded once
    per attended session at completion.
- `profiles.impact_points` becomes a maintained cache: updated by triggers on
  `points_ledger` insert (sum into the owner's profile). Clients may read it;
  clients may never write it.
- Gateway: remove `profiles` from the mutation allow-list in `api/action.js`
  entirely. Profile updates therefore flow only through dedicated RPCs.
- Admin "add/remove points": `award_points_admin(p_user_id uuid, p_amount int,
  p_reason text) SECURITY DEFINER` that asserts `is_platform_admin()` and
  inserts the ledger row. `pages/admin.html` point controls call this RPC.
- `get_impact_summary(p_user_id uuid) SECURITY DEFINER` returns
  `{total_points, breakdown_by_reason, badge_tier}` for dashboard/profile/ranking.

### A4. Hardening leftovers (plan Tasks 6, 9, 10)
- Add `esc()` to `src/js/utils.js` (exact string escape returning the original
  for non-strings). Sweep the 37 `innerHTML =` sites; escape at every site that
  renders user/DB-controlled strings: notifications toast
  (notifications.js:15-23), initiative render, volunteers cards, training
  cards, profile values, admin tables.
- Admin audit-log viewer: `admin.html` gains a read-only view of `audit_logs`
  via a security-definer read (service-role reads currently only happen
  gateway-side; expose a `get_audit_logs()` RPC gated by `is_platform_admin`).
- `tests/run_live.js`: real-credential smoke script run against a live
  backend (documented as manual, requires `.env`).

## 4. Phase B — Missing Platform Surfaces

### B1. Auth depth
- Password reset: `reset-password.html` posts GoTrue `/v1/recover` via the
  gateway; `auth.html` gets a "Forgot password?" link. Link to `auth.html`
  from reset-confirmation state.
- Email verification: detect GoTrue session user whose
  `email_confirmed_at` is null; show an informational banner on dashboard
  until confirmed (no hard block).
- Demo (mock) toggle remains dev-only; it must never appear in production
  (reuse config: demo controls render only when mock mode is active).

### B2. Notifications, alive
- Bell in the layout sidebar (and dashboard) polling new unread notifications
  on an interval (30s) for logged-in users; count badge.
- "Mark all as read" persists (update `notifications.read = true`).
- Triggers/RPCs push notification rows on: invite received, volunteer session
  approved/rejected, consultation answered, points milestone (badge tier up).
- Remove dead `src/js/realtime.js` polling or re-purpose it into the bell.

### B3. Invite → join flow
- `src/js/invites.js` share URL fixed to a real target: create
  `pages/join.html?token=<invite_token>` that validates the invite (status
  pending, not expired) and joins the initiative via RPC on confirmation.
- `initiative.html`: the existing "انضم الآن" button gets a live handler
  (member join via RPC, disabled if already member). Initiative leaders get an
  "invite member" share action that copies the join link.

### B4. Badges + leaderboard
- Badge tiers derived (computed, no new write path) from `get_impact_summary`:
  e.g. 0 starter, 250/500/1000/2000 thresholds with earned-at timestamps read
  from the ledger. Badges are presentational labels, not stored grants.
- `pages/ranking.html`: top 20 members by total points, readable via a
  security-definer query (aggregating `points_ledger`), with the caller's own
  rank included. Sidebar link + dashboard link.

### B5. Moderation & admin
- `admin.html`: consultation-answer queue (counselor/admin responds to pending
  public consultations via `answer_consultation` RPC, RLS-safe); school-visit
  status workflow (confirm/complete/cancel); audit-log viewer (A4).
- Volunteer approval queue already exists; no change.

### B6. Trust pages + footer
- Static trilingual pages: privacy, terms-of-service, about, contact/FAQ.
- A footer component added to `layout.js` inject on all pages, linking these,
  the platform address line, and language/theme shortcuts.

## 5. Phase C — Depth & Polish

### C1. i18n completeness
- Localize `auth.html`, `create.html`, `initiative.html`, `offline.html`
  (currently Arabic-only). Use the global `i18n.js` `TRANSLATIONS`.
- Localize remaining English-only bits in `admin.html` (engagement/table
  headers) and volunteers create-form labels (currently hardcoded bilingual).

### C2. Content depth
- Expand `seedMockDB` rows: more clubs, courses, consultations, initiatives,
  school visits, volunteer sessions so every pillar shows a realistic set.
- Quiz: promote to a question bank (5+ questions, randomized subset per run).

### C3. Navigation
- `layout.js`: add `schools.html` link; introduce a "more" menu
  (notifications, invites, tasks, create) so no page is orphaned.
- `pages/index.html` pillar cards: make pillar 1-5 cards link to their pillar
  pages (index.html:266 area), matching pillar 6 behavior.

### C4. PWA / hygiene
- `service-worker.js`: cache the missing assets (i18n.js, utils.js, config.js,
  pwa.js, volunteers.html); network-first with `offline.html` fallback on fetch
  error.
- Delete `mobile/` directory (approved). Delete or migrate dead
  `src/js/realtime.js` (see B2). Remove other unused modules if confirmed dead
  (`db.js`, `invites.js` usage resolved by B3).

## 6. Non-goals
- No SMS/OTP login, no phone-first accounts.
- No comments/community moderation system beyond consultations.
- No per-user avatars/upload path (avatar_url stays reserved but unused).
- No full awareness/admin content CRUD (only the moderated flows in B5).
- Mobile app is removed, not rebuilt.

## 7. Testing strategy
- Existing suites stay green after every phase: `tests/run_tests.js` (95),
  `tests/api_test.js` (21), `tests/auth_contract_test.js` (18).
- New tests per phase:
  - A: gateway rejects `profiles` mutation (api_test); schema-parity inserts
    pass the form values (schema/run_tests additions); ledger-only points and
    capped quiz/volunteer awards (run_tests mock or schema RPC tests).
  - B: `run_tests` assertions for reset-recover gateway path, notification
    mark-read mutation, invite join RPC, watchdog of badge tiers.
  - C: i18n dictionary symmetry check extended to include previously missing
    pages (central i18n keys list updated); service-worker asset list checked
    against the pages/JS inventory.
- `tests/run_live.js` (manual) documents the production smoke ladder.

## 8. Documentation
- `README.md` gains the "Deploy (Grade C)" section (plan Task 11): required
  env vars, applying `schema.sql` migration, enabling the gateway endpoint
  routes, Upstash keys, expected live-checks.
- Any migration between schema.sql states is additive and reversible; note in
  plan whether `club_members.status` and `points_ledger` apply as `CREATE
  TABLE`/`ALTER` statements to an existing database or are covered by a fresh
  schema.sql replay for greenfield deploys (assume fresh replay is the source
  of truth; document upgrade notes separately).

## 9. Definition of done
- Real deploy pass: with real env vars in `.env`, `node build.js` then Vercel
  serve passes the `tests/run_live.js` ladder: signup → password reset →
  guest browse → join club (points ledger +100, profile read-only) → quiz
  (capped +50) → volunteer completion → admin award → audit viewer visible.
- All suites green; no page renders fake data in production mode.
- No inline module scripts remain; CSP load passes; creator/join/invite/
  notification/reset flows all functional.