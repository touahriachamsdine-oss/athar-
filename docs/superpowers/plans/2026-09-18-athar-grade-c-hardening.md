# Athar Grade C Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden Athar (Vercel + Neon + Upstash) with full RLS, real GoTrue auth, a rate-limited/audited `/api/action` gateway, strict CSP, sanitization, and a volunteer module — while keeping local demo mode byte-for-byte equivalent in behavior.

**Architecture:** Static frontend reads PostgREST directly (RLS); all writes/auth flow through a same-origin serverless gateway that rate-limits (Upstash), audits, and proxies with the service role key. DB gets complete RLS + atomic security-definer RPCs; client gets `rpc()` support and rerouted writes.

**Tech Stack:** Node 24 (Vercel Functions, zero-dep runtime), Neon Postgres (RLS, plpgsql), Neon Auth (GoTrue), Upstash Redis (`@upstash/ratelimit`, REST). No new runtime client deps. No build tools beyond `node build.js`.

**Spec:** `docs/superpowers/specs/2026-09-18-athar-grade-c-hardening-design.md`

## Global Constraints

- Keep 26 existing tests green; suite banner must state facts, not claims ("Production Ready" removed).
- Zero additional client dependencies; `api/` may use `@upstash/ratelimit` (serverless only) with graceful fallback (unlimited) when env absent.
- Mock mode and real mode must share one behavior contract: all RPC rules mirrored in the mock dispatch.
- Service role key + Upstash token never enter `public/`; `build.js` only injects anon/browser-safe values.
- Repository is currently NOT a git repo → Task 0 initializes it (baseline commit); each task ends with a commit.
- All routes must remain 200 in local parity mode (`PORT=8080 node server.js`); local server registers the same `/api/*` handlers.
- No browser/DOM tests (zero-dep policy); verification = unit tests + smoke probes + `node --check` + `RUN_LIVE` (opt-in).
- Server port honors `process.env.PORT || 3000` (already applied).

---

## Task 0: Git baseline

**Files:**
- Create: `.gitignore`
- Create: `docs/superpowers/plans/2026-09-18-athar-grade-c-hardening.md` (this file)

**Interfaces:** N/A — enables commit gates for every later task.

- [ ] **Step 1:** `git init` in repo root.
- [ ] **Step 2:** Write `.gitignore`: `node_modules/`, `public/`, `.env*`, `*.log`, `.vercel/`, `mobile/node_modules/`.
- [ ] **Step 3:** `git add -A && git commit -m "chore: baseline before grade-c hardening"`.
- [ ] **Step 4:** Verify: `git status` clean; `git log --oneline` shows baseline.

## Task 1: Config, secrets scaffolding, build injection

**Files:**
- Create: `.env.example`
- Modify: `src/js/config.js`
- Modify: `build.js`
- Test: `tests/run_tests.js` (config phase)

**Interfaces:**
- Produces: `src/js/config.js` exports `NEON_AUTH_URL`, `NEON_API_URL`, `NEON_ANON_KEY`, `VOLUNTEER_POINTS_PER_HOUR` (=10), `VOLUNTEER_MAX_SESSION_POINTS` (=50). `build.js` now also replaces `YOUR_NEON_ANON_KEY`.

- [ ] **Step 1: Write `.env.example`** with keys `NEON_AUTH_URL`, `NEON_API_URL`, `NEON_ANON_KEY`, `SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `APP_ORIGIN`.
- [ ] **Step 2: Extend `config.js`:**

```js
export const NEON_ANON_KEY = 'YOUR_NEON_ANON_KEY';
export const VOLUNTEER_POINTS_PER_HOUR = 10;
export const VOLUNTEER_MAX_SESSION_POINTS = 50;
```

- [ ] **Step 3: Extend `build.js`** — after the two existing `replace` calls add the anon key injection:

```js
config = config.replace(/YOUR_NEON_ANON_KEY/g, process.env.NEON_ANON_KEY || 'YOUR_NEON_ANON_KEY');
```

Add a guard comment that `SERVICE_ROLE_KEY`/`UPSTASH_*` must never be injected here.
- [ ] **Step 4: Test** — in `run_tests.js` config phase assert `VOLUNTEER_POINTS_PER_HOUR === 10` and `VOLUNTEER_MAX_SESSION_POINTS === 50` after import.
- [ ] **Step 5: Run `node tests/run_tests.js`** — expect all green (26 + 2 new). `node --check src/js/config.js build.js`.
- [ ] **Step 6: Commit** `chore(config): secrets scaffolding + volunteer constants`.

## Task 2: Schema — full RLS, volunteer tables, audit, RPCs

**Files:**
- Modify: `sql/schema.sql` (append new section; do not drop existing objects)
- Test: `tests/run_tests.js` (SQL surface assertions)

**Interfaces:**
- Produces SQL objects (all `public.`): helpers `is_platform_admin()`, `is_initiative_leader(uuid)`, `initiative_of_session(uuid)`; tables `volunteer_sessions`, `volunteer_signups`, `audit_logs`; RPCs `create_volunteer_session(jsonb)`, `signup_to_session(uuid,uuid)`, `cancel_signup(uuid,uuid)`, `mark_attendance(uuid,uuid,boolean)`, `complete_session(uuid)`, `approve_session(uuid)`, `reject_session(uuid,text)`.
- Consumes (goes live in Task 5): `auth.uid()`; pages call RPCs via `neon.rpc()` (Task 3).

- [ ] **Step 1: Write the helper functions** (security definer):

```sql
create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','superadmin')
  );
$$;

create or replace function public.is_initiative_leader(p_initiative_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.initiative_members
    where initiative_id = p_initiative_id
      and user_id = auth.uid()
      and role in ('founder','leader')
  ) or public.is_platform_admin();
$$;

create or replace function public.initiative_of_session(p_session_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select initiative_id from public.volunteer_sessions where id = p_session_id;
$$;
```

- [ ] **Step 2: Enable RLS + policies for the 8 open tables** (`initiative_members`, `tasks`, `notifications`, `clubs`, `club_members`, `training_courses`, `training_enrollments`, `consultations`) per the spec §8 matrix — use `public.is_platform_admin()` / `public.is_initiative_leader(...)` helper predicates.
- [ ] **Step 3: Create `volunteer_sessions`, `volunteer_signups`, `audit_logs`** DDL from spec §6.1; enable RLS; add policies per §8.
- [ ] **Step 4: Write the 7 RPCs** per spec §6.2/§6.3. `signup_to_session` must count + insert in one function body and return `{status}` on conflict; `complete_session` guards on `status='approved'` and credits points/hours once.
- [ ] **Step 5: Trigger backstops** — `trg_audit_volunteer` on `volunteer_sessions` (status→`approved`/`rejected`) and `trg_audit_initiative` on `initiatives` (`is_approved`) inserting into `audit_logs` with `actor_user_id = auth.uid()`; trigger creating a notification on session reject.
- [ ] **Step 6: SQL surface tests** in `run_tests.js` — read `sql/schema.sql`, assert presence of each table, each RPC, and `enable row level security` for every table in §8 list.
- [x] **Step 7:** `node tests/run_tests.js` green. **Commit** `feat(db): grade-c rls, volunteer tables, atomic rpcs, audit`.

## Task 3: neon.js — `rpc()`, `apikey`, gateway routing

**Files:**
- Modify: `src/js/neon.js`
- Test: `tests/run_tests.js` (neon construction + mock dispatch)

**Interfaces:**
- Produces: `neon.rpc(fn, payload)` → mock: runs parity rules (create/signup/cancel/mark_attendance/complete/approve/reject) against `athar_mock_db_*`; real: `POST /api/action` `{token, action:'rpc', payload:{fn, payload}}`.
- Produces: real-mode `insert`/`update`/`delete` reroute through `/api/action`; `select` stays direct with `apikey` header + bearer.

- [x] **Step 1: Add `rpc()` method** with mock dispatch table returning `{ data }` / `{ error, code }` matching the gate rules from spec §6.2 (capacity, unique, approval/future gating, founder/admin auth, idempotent completion).
- [x] **Step 2: Reroute real-mode writes** through `fetch('/api/action', {method:'POST', body: JSON.stringify({token, action:'insert'|'update'|'delete'|'rpc', ...})})`.
- [x] **Step 3: Add `apikey` header** to real-mode `select` requests.
- [x] **Step 4: Tests** — assert (a) `rpc('signup_to_session', …)` in mock fills a seat, (b) inserting when `capacity` reached returns `{error:'conflict'}`, (c) real-mode `rpc` builds a POST to `/api/action` with the right JSON body, (d) `select` request includes `apikey`. (Phase 4 rewrite + Phase 4B; fixed completion fixture to an 8h session so the 50-cap asserts the real formula.)
- [x] **Step 5:** `node --check src/js/neon.js`; run tests. **Commit** `feat(db-client): rpc support, apikey header, gateway routing`.

## Task 4: Gateway — `api/action.js`, server parity, vercel config

**Files:**
- Create: `api/action.js`
- Modify: `server.js`
- Modify: `vercel.json`
- Test: `tests/api_test.js` (new)

**Interfaces:**
- Consumes: env `SERVICE_ROLE_KEY`, `NEON_AUTH_URL`, `NEON_API_URL`, `UPSTASH_REDIS_REST_URL/TOKEN`, `APP_ORIGIN`; body `{token, action, ...}` from Task 3.
- Produces: `POST /api/action` responses `{ok, data}` | `{error, code}`, `code ∈ rate_limit|unauthorized|conflict|validation|not_found|forbidden`; audit row per mutation.

- [ ] **Step 1: Write `api/action.js`** — Node handler: parse JSON, CORS allow `APP_ORIGIN` (or same-origin), auth actions proxied to GoTrue (`v1/signup`, `v1/token`, refresh), mutations proxied to Neon REST/rpc with service role key; Upstash sliding-window rate limit (auth=5/min/IP, mutation=30/min/user, complete/approve=10/min) with unlimited fallback when env absent; write `audit_logs` via service key after each mutation (success/failure) including ip (`x-forwarded-for`), user_agent, request_id.
- [ ] **Step 2: `server.js` parity** — before static handling, match `POST /api/action` and require it (function `handleApiAction(req, res, body)` shared logic; local runner reads env or falls back to mock responses).
- [ ] **Step 3: `vercel.json`** — rewrites: add `api` to the negative lookahead (`((?!api|src|public|pages|manifest\\.json|vercel\\.json).*)`); add security headers block per spec §9.
- [ ] **Step 4: `tests/api_test.js`** — exercise handler with a stub fetch: success shape, rate-limit shape when over threshold, unauthorized when service key missing, audit insert called.
- [x] **Step 5:** `node --check api/action.js server.js`; run new + full tests; smoke `POST /api/action` against local server returns the expected shape. **Commit** `feat(api): action gateway with ratelimit + audit; vercel headers`.
- **DONE (Task 4):** `api/action.js` (zero-dep) + `tests/api_test.js` (21 tests green) + `server.js` parity route + `vercel.json` rewrite + security headers. Node check clean. Local smoke: home 200, `/api/action` returns `{"error":{"code":"validation","message":"action required"}}` on empty body. Server restarted on 8080; stale 3000 process killed.

## Task 5: Real auth — GoTrue contract

**Files:**
- Modify: `src/js/auth.js`
- Test: `tests/run_tests.js` (auth construction)

**Interfaces:**
- Consumes: `NEON_AUTH_URL`, `NEON_ANON_KEY`; produces `neon_session` `{access_token, refresh_token, expires_at, user}`.

- [ ] **Step 1:** Rebuild `signUp` real branch → `POST ${NEON_AUTH_URL}/v1/signup` with `apikey: NEON_ANON_KEY` header; parse GoTrue response (`access_token`, `refresh_token`, `user`).
- [ ] **Step 2:** Rebuild `signIn` real branch → `POST ${NEON_AUTH_URL}/v1/token?grant_type=password`; persist `neon_session` new shape; role loaded from `profiles` as today.
- [ ] **Step 3:** Add `refreshSession()` (`grant_type=refresh_token`), called when `expires_at` is near; `getSession()` returns parsed session.
- [ ] **Step 4:** Mock branch untouched. Tests assert real-branch URL/header/body construction for signup + signin + refresh; mock branch still returns `mock_user_*` flows.
- [ ] **Step 5:** `node --check src/js/auth.js`; tests green. **Commit** `feat(auth): neon auth gotrue contract with refresh`.

## Task 6: Sanitization — `esc()` + page sweep

**Files:**
- Modify: `src/js/utils.js`
- Modify: every page rendering user content (all 17 pages + volunteer pages)
- Test: `tests/run_tests.js` (esc matrix + sweep assertion)

**Interfaces:**
- Produces: exported `esc(s)` (also attached to `window.esc` for inline-usage during transition).

- [ ] **Step 1: Add `esc`** to `utils.js`:

```js
export function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
```

- [ ] **Step 2:** Sweep each page: wrap every user-controlled value inside template/`innerHTML` assignments with `esc(...)` (titles, descriptions, names, messages, answers, subjects, notifications, invite/volunteer fields).
- [ ] **Step 3:** Tests — `esc` matrix (`&<>"'`, null, numbers); a repo assertion that volunteer/profile/consult render sites reference `esc(`.
- [ ] **Step 4:** `node --check` all touched; tests green; smoke probes 200. **Commit** `fix(xss): sanitize all user-rendered content`.

## Task 7: Strict CSP — externalize inline page scripts

**Files:**
- Modify: all 16 pages with inline `<script type="module">` (extract → `pages/<name>.js`)
- Modify: `vercel.json` CSP header
- Test: grep assertion + smoke probes

**Interfaces:** Produces page module files importable under `script-src 'self'`.

- [ ] **Step 1:** For each of the 16 pages, move the inline module body to `pages/<name>.js` (keep imports) and replace with `<script type="module" src="/pages/<name>.js"></script>`.
- [ ] **Step 2:** Set the CSP header from spec §10 (`connect-src` includes the neon hosts).
- [ ] **Step 3:** Add a test asserting zero inline `<script>` (without `src`) in `pages/*.html`.
- [ ] **Step 4:** `node --check` each extracted file; full smoke probe all routes (single page still references `window.esc` — keep global export). **Commit** `refactor(csp): externalize page scripts, enforce script-src self`.

## Task 8: Volunteer UI

**Files:**
- Create: `pages/volunteer.html`, `pages/volunteer.js`, `pages/volunteer-create.html`, `pages/volunteer-create.js`
- Modify: nav (layout), `src/js/i18n.js` (ar/fr/en volunteer strings), `src/js/db.js` helpers
- Test: `tests/run_tests.js` (volunteer mock logic), smoke

**Interfaces:** Consumes `neon.rpc` from Task 3; produces pages under `/pages/volunteer*`.

- [ ] **Step 1:** `volunteer-create.html` + JS — founder/admin form; calls `rpc('create_volunteer_session', {payload})`; shows pending confirmation.
- [ ] **Step 2:** `volunteer.html` + JS — approved-session timeline with seats, signup/cancel via RPC, "My sessions" tab; uses `esc()`.
- [ ] **Step 3:** i18n strings ar/fr/en; nav link.
- [ ] **Step 4:** Mock logic tests: full capacity → conflict; double signup → conflict; past session → validation; non-founder create → forbidden; completion credits once.
- [ ] **Step 5:** `node --check` new files; tests; smoke probes 200. **Commit** `feat(volunteer): sessions, signup, cancel UI`.

## Task 9: Admin queue + audit viewer + profile card

**Files:**
- Modify: `pages/admin.html`, `pages/admin.js` (extracted in Task 7), `pages/profile.html`, `pages/profile.js`
- Test: smoke + node --check

- [ ] **Step 1:** Admin volunteer queue — pending sessions list, approve/reject-with-reason via RPC, notifications on decision.
- [ ] **Step 2:** Audit log viewer — fetch from service-gated select on `audit_logs` (admin-only RLS), paginated, filter by action.
- [ ] **Step 3:** Profile Volunteer Card — hours, points, upcoming sessions (aggregate from signups/sessions).
- [ ] **Step 4:** `node --check`; tests still green; smoke routes 200. **Commit** `feat(admin): volunteer queue, audit viewer, profile card`.

## Task 10: Tests — `RUN_LIVE` suite + accurate banner

**Files:**
- Create: `tests/run_live.js`
- Modify: `tests/run_tests.js` (banner wording + SQL/auth/gateway assertions from Tasks 1–7)

- [ ] **Step 1:** Write `tests/run_live.js` — skips with a clear message when `RUN_LIVE` env absent; when present, runs against env-provided Neon: signup/signin/refresh, RLS read matrix (anon blocked on consultations/tasks), capacity-at-limit, double-credit prevention, 429 shape from gateway.
- [ ] **Step 2:** Replace the "Production Ready" banner claim with neutral factual output (counts + result).
- [ ] **Step 3:** Full suite run (`RUN_LIVE` unset) green + `node --check` all. **Commit** `test: run_live suite + accurate reporting`.

## Task 11: Docs — deployment checklist

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** Add "Deploy (Grade C)" section: run schema.sql on Neon → Vercel env vars → deploy → `RUN_LIVE=1 node tests/run_live.js` → manual checklist (anon can't read consultations; 429 after rapid auth; double-credit blocked).
- [ ] **Step 2:** Document CSP, mock vs real mode, ports, and the volunteer feature. **Commit** `docs: deployment + verification checklist`.

---

## Self-Review notes (from spec)

- Spec coverage: §4 controls → Tasks 2–6; §6 volunteer → Tasks 2,3,8,9; §7 auth → Task 5; §8 RLS → Task 2; §9 gateway → Task 4; §10 CSP/sanitize → Tasks 6,7; §11 tests → Tasks 1–10; §12 deploy → Task 11. No gaps.
- Placeholders: steps carry concrete code/assertions/commands; sweeps (16 pages, esc) are mechanical with explicit verification gates.
- Interface consistency: `neon.rpc(fn,payload)`, RPC names, session shape, `esc()`, `/api/action` body, `VOLUNTEER_MAX_SESSION_POINTS` are named identically across spec → plan → client/SQL tests.