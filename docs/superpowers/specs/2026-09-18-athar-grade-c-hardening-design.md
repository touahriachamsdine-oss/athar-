# Athar Platform — Grade C Hardened Production Design

**Date:** 2026-09-18
**Status:** Spec (design approved by operator; review gates merged per operator request — operator cannot supervise mid-build)
**Spec path:** this file

## 1. Goal

Harden the Athar digital-youth platform into a deployable application on Vercel + Neon + Upstash with complete RLS, real Neon Auth, rate limiting, audit logging, input sanitization, strict CSP, and add a volunteer module with atomic capacity enforcement and leader-confirmed points. Local demo mode must keep working identically.

## 2. Approved decisions

| Item | Decision |
|---|---|
| Compute layer | Vercel Serverless Functions (`api/`) + Upstash Redis rate limiting |
| CSP | Strict — externalize all inline `<script type="module">`; `script-src 'self'`; `style-src 'self' 'unsafe-inline'` (documented design concession; CSS is not an injection vector) |
| Verification | Ship hardened code + `RUN_LIVE` test suite + deployment checklist; no live credentials this cycle |
| Volunteer model | One-off, time-boxed sessions tied to an initiative |
| Points economy | Founder/leader-confirmed attendance; `hours × 10`, capped per session (cap = 50) |
| Creation & approval | Founders/leaders/admins create; new sessions require admin approval before public listing |
| Recurrence | None (one-off only) |
| Mock parity | Mock DB mirrors every RPC rule so demo behavior ≡ production behavior |

## 3. Current state (verified this session)

- 17 pages (`pages/*.html`), each with an inline `<script type="module">`; 17 modules in `src/js/`.
- Static build to `public/` via `build.js` (Vercel: buildCommand, outputDirectory public, catch-all rewrites, asset max-age headers).
- Local `server.js` — hardcoded `PORT = 3000` (fixed this session to `process.env.PORT || 3000`; live on 8080).
- DB (`sql/schema.sql`): 13 tables; RLS + policies on only **5** (`profiles`, `initiatives`, `awareness_content`, `school_visits`, `invites`); **8 wide open** (`initiative_members`, `tasks`, `notifications`, `clubs`, `club_members`, `training_courses`, `training_enrollments`, `consultations`).
- Auth: custom contract `auth.js` calls `${NEON_AUTH_URL}/signUp` and `/signIn` expecting `{session}` — incompatible with Neon Auth (GoTrue), never tested live.
- `neon.js`: no `.order()`, `.not()`, `.limit()`, no `rpc()`, no `apikey` header.
- No sanitizer; user content rendered via `innerHTML`.
- Mobile (`mobile/`) is a stub — out of scope.

## 4. Threat model → controls

| Risk | Control | Layer |
|---|---|---|
| Credential stuffing / auth abuse | Upstash rate limit on auth (5/min/IP); gateway | Function |
| Mutation abuse | Rate limit by user+IP (30/min); stricter on approve/complete | Function |
| Oversubscribed sessions | Atomic count+insert RPC; `capacity`; unique constraint | DB |
| Double credit (points/hours) | `complete_session` idempotent via status guard + unique awards | DB |
| BOLA/IDOR | Full RLS; ownership checks inside security-definer RPCs | DB |
| Stored XSS | `esc()` on all user-rendered fields; strict CSP `script-src 'self'` | Client/header |
| Secret leakage | Service key + Upstash token only in `api/`; public config carries anon key only | Build/config |
| Repudiation | `audit_logs` written by gateway + trigger backstops; admin viewer | DB/Function |
| Replay/session theft | GoTrue access token + refresh; `auth.uid()` used by all RPCs | Auth |
| Deploy drift | `RUN_LIVE` integration suite + checklist | Tests/docs |

## 5. Target architecture

```
Browser (static pages, public/)
  │
  │ GET reads ──direct──▶ Neon PostgREST  (RLS protected; anon key; reads only)
  │
  └── writes + auth ──▶ /api/action (Vercel Function)
                         ├─ Upstash ratelimit (IP + user)
                         ├─ audit_logs insert (service key)
                         └─ SERVICE_ROLE_KEY proxy ──▶ Neon /rpc + /rest/v1
```

- `neon.js` reroutes insert/update/delete/rpc in real mode through `/api/action` (same-origin); page code keeps using `neon.from(...)` unchanged.
- Local `server.js` registers the same `/api/*` handlers so `node server.js` ≡ Vercel behavior.
- `vercel.json` excludes `/api/*` from the catch-all rewrite and adds security headers.

## 6. Volunteer module

### 6.1 Schema

```sql
create table public.volunteer_sessions (
  id uuid primary key default gen_random_uuid(),
  initiative_id uuid references public.initiatives(id) on delete cascade not null,
  title_ar text not null, title_fr text not null, title_en text not null,
  description_ar text, description_fr text, description_en text,
  location text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  capacity integer not null check (capacity > 0),
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled','completed')),
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table public.volunteer_signups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.volunteer_sessions(id) on delete cascade not null,
  volunteer_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'registered'
    check (status in ('registered','attended','no_show','cancelled')),
  attended_at timestamptz,
  hours numeric check (hours >= 0),
  points_awarded integer not null default 0,
  created_at timestamptz not null default now(),
  unique (session_id, volunteer_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid,
  action text not null,
  entity text,
  entity_id text,
  success boolean not null default true,
  ip text, user_agent text, request_id text,
  meta jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_actor_idx on public.audit_logs (actor_user_id, created_at desc);
```

### 6.2 Rules

- **create** — caller is initiative founder/leader (`initiative_members.role in ('founder','leader')`) or platform admin. New row starts `pending`.
- **signup** — session `approved`; `end_at > now()`; capacity not reached; signer is not the session `created_by`; row inserted atomically (`count + insert` inside one security-definer function, `ON CONFLICT` → already-registered result).
- **cancel** — volunteer may cancel own `registered` signup; sets `cancelled`.
- **mark_attendance** — caller is session initiative founder/leader or admin; volunteer must be `registered`; sets `attended`/`no_show` + `attended_at`.
- **complete_session** — founder/leader/admin; only when `status = 'approved'`; sets `completed`; for each attended signup: `hours = greatest(1, floor(extract(epoch from (end_at-start_at))/3600))`, capped at 8; `points = hours * 10`, capped at 50; `profiles.impact_points += points`. Idempotent (status guard prevents double award).
- **approve / reject** — platform admin only; reject requires reason; creates a notification to `created_by`.

### 6.3 RPC signatures (PostgREST `/rpc/<fn>`)

```
create_volunteer_session(payload jsonb)                              → volunteer_sessions
signup_to_session(p_session_id uuid, p_volunteer_id uuid)            → jsonb {status}
cancel_signup(p_session_id uuid, p_volunteer_id uuid)                → jsonb {status}
mark_attendance(p_session_id uuid, p_volunteer_id uuid, p_attended boolean) → jsonb {status}
complete_session(p_session_id uuid)                                  → jsonb {updated, points}
approve_session(p_session_id uuid)                                   → jsonb {status}
reject_session(p_session_id uuid, p_reason text)                     → jsonb {status}
```

All `security definer`, `set search_path = public`, recursion out. Authorization derived from `auth.uid()` inside each function.

### 6.4 UX

- `volunteer.html` — timeline of approved sessions (selection by wilaya/category), seats live, signup/cancel buttons, "My sessions" tab.
- `volunteer-create.html` — founder/admin form (title trilingual, description, location, datetime, capacity) → creates pending session.
- `admin.html` — volunteer queue (approve/reject with reason), audit log viewer.
- `profile.html` — Volunteer Card: hours, points, upcoming sessions.
- Nav + full ar/fr/en i18n.

## 7. Auth migration (Neon Auth / GoTrue)

- Signup: `POST {AUTH}/v1/signup`, headers `apikey: <anon>`; body `{email, password, data:{full_name, phone,...}}`.
- Sign-in: `POST {AUTH}/v1/token?grant_type=password`, body `{email, password}`.
- Refresh: `POST {AUTH}/v1/token?grant_type=refresh_token`, body `{refresh_token}`.
- Session persisted as `{access_token, refresh_token, expires_at, user}`; auto-refresh before expiry; `user.id` used everywhere (`requireAuth`, page logic) — same field as today, so consumer code is unaffected.
- Role always loaded from `profiles` (as today). Mock branch untouched.

## 8. RLS matrix (all 15 tables)

Helpers (security definer, `stable`): `is_platform_admin()`, `is_initiative_leader(p_initiative_id)`, `initiative_of_session(p_session_id)`.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | all | — (trigger) | own | own |
| initiatives | approved OR own OR admin | authed | creator/admin | creator/admin |
| initiative_members | any member/admin | join or founder | role-acting/admin | self/admin |
| tasks | member of initiative | founder/leader | founder/leader | founder/leader |
| notifications | own | (trigger/admin) | own (read) | own |
| clubs | all | — (admin flow) | admin | admin |
| club_members | own/leader | self | self | self |
| training_courses | all | authed | admin | admin |
| training_enrollments | own | authed | own | own |
| consultations | own OR (public AND answered) | authed | own | own/admin |
| awareness_content | all | authed | admin | admin |
| school_visits | own OR admin | authed | own/admin | own/admin |
| invites | initiative members/admin | founder/leader | founder/leader | founder/leader |
| volunteer_sessions | approved OR own OR admin | (RPC only) | founder/admin | founder/admin |
| volunteer_signups | own OR own-session founder/admin | (RPC only) | (RPC only) | — |
| audit_logs | admin only | (gateway service key) | — | — |

Enforcement rule: the application writes through RPCs + gateway for everything sensitive; RLS is the backstop, not the only check.

## 9. Gateway API (`/api/action`)

Request (JSON): `{ token, action, table?, payload? }`.
- `action` ∈ `signup | signin | refresh | signout | insert | update | delete | rpc`.
- Authorization: bearer handled by GoTrue for auth actions; mutations require an authenticated goTrue user (`auth/uid` enforced at DB via JWT `sub` or service role + explicit checks).
- Rate limit keys: auth → IP; mutations → user.id + IP. Limits: auth 5/min, mutation 30/min, `complete_session`/`approve_session` 10/min.
- Responses: `{ ok, data? }` or `{ error, code }`; codes: `rate_limit`, `unauthorized`, `conflict`, `validation`, `not_found`, `forbidden`.
- Every mutation writes `audit_logs` (service role) with actor, action, entity, ip, user_agent, request_id, success.
- 429 returns `{ error: 'rate_limit', retry_after }`; client shows localized cooldown.

`vercel.json` additions: rewrites exclude `api`; headers: `Content-Security-Policy` (strict), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy` minimal, `Strict-Transport-Security` (prod), keep asset caching.

## 10. CSP & sanitization

- CSP: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://<neon-api> https://<neon-auth>; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'`.
- Requires `src/js/utils.js` `esc(s)` and externalizing 16 inline modules into `pages/<name>.js` + `<script type="module" src="...">`.
- Sweep every user-controlled interpolation to `innerHTML`/`+= '/template'` in all pages (profile, initiatives, tasks, consult, admin, notifications, clubs, training, schools, invites, volunteer).

## 11. Tests

- Keep 26 existing tests green.
- New unit: `esc()` escaping matrix.
- New logic tests (mock): capacity-at-limit, unique signup, cancel, attendance gating, completion idempotency (points once), role gates.
- New contract tests: `/api/action` request/response shapes against an in-memory fake gateway.
- `node --check` on all source + `api/*`.
- `tests/run_live.js` (opts in with `RUN_LIVE=1` + env): signup/signin/refresh; RLS read matrix (anon blocked); capacity at limit; double-credit prevention; 429 shape. Skipped when env absent.
- Banner "Production Ready" claim replaced with factual pass/fail wording.

## 12. Deployment & verification checklist

1. Run `sql/schema.sql` on the Neon DB.
2. Vercel env vars: `NEON_AUTH_URL`, `NEON_API_URL`, `NEON_ANON_KEY`, `SERVICE_ROLE_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `APP_ORIGIN`.
3. Deploy (functions auto-detected in `api/`).
4. Run `RUN_LIVE=1 node tests/run_live.js`; verify checklist items (RLS matrix, 429, double-credit, auth refresh).
5. Local parity: `PORT=8080 node server.js`.

## 13. Out of scope

- Mobile app completion (stub deferred; only kept non-crashing).
- Browser/DOM E2E (no test deps per zero-dependency policy; Playwright later if opted in).
- `pg_cron` maintenance jobs; email verification flows; password reset UI; rate-limit persistence beyond Upstash.