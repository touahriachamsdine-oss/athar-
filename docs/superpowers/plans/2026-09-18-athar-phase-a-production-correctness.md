# Athar Phase A — Production Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Athar genuinely production-real: CSP-safe external scripts, schema/UI parity, server-enforced points ledger, esc() sanitization, real landing stats, printable certificates, working explore filters.

**Architecture:** The app is a static multi-page site (pages/*.html) over a localStorage mock DB (`src/js/neon.js`) with a real path: browser reads via PostgREST/anon, every mutation via the `/api/action` gateway (`api/action.js`, single-sourced into local `server.js`), RLS + `SECURITY DEFINER` RPCs in `sql/schema.sql`. Phase A moves inline page modules to external `src/pages/*.js` files (CSP), aligns schema to product intent, and replaces client-trusted point edits with a write-only `points_ledger` maintained by server triggers.

**Tech Stack:** Vanilla JS modules (ESM), PostgreSQL/PostgREST RLS, GoTrue auth, Vercel serverless (`api/action.js`), Upstash rate-limit, no build framework (custom `build.js`), Node 18+ test harnesses.

**Spec:** `docs/superpowers/specs/2026-09-18-athar-production-complete-design.md` (Phase A sections 3 + supporting requirements).

## Global Constraints

- CSP `script-src 'self'` must hold after this phase: **every** page loads its script as `<script type="module" src="../src/pages/<name>.js">`; zero inline `<script>` blocks remain across `pages/*.html`.
- `profiles` is **read-only via the gateway**: it is removed from `ALLOWED_TABLES` in `api/action.js`; all point changes flow through `points_ledger` via `SECURITY DEFINER` functions only.
- Points are **derived from real DB events** (club membership, training completion, school-visit confirmation, quiz pass, volunteer completion), never from client-claimed arithmetic.
- Mock/demo must mirror real behavior: `src/js/neon.js` mock implements the same awards client-side so local demo and production agree; no fake data may render in production mode.
- Writes keep RLS: the gateway forwards the user JWT; posters must pass `requireUser` checks already in place.
- i18n remains trilingual (ar/fr/en) — any new visible string has all three variants or a graceful default.
- Suites must stay green after every task: `node tests/run_tests.js` (95), `node tests/api_test.js` (21), `node tests/auth_contract_test.js` (18), plus the new checks added in this plan.
- Commit with git identity flags: `git -c user.name=anouar -c user.email=anouar@local commit -m "..."` (repo has no global identity).
- Server: `http://localhost:8080` (see `server.js`); always `node build.js` before browser verification.

---

### Task 1: `esc()` utility with tests

**Files:**
- Modify: `src/js/utils.js` (append after `escapeHTML`, line 11)
- Test: `tests/run_tests.js` (append Phase 7)

**Interfaces:**
- Consumes: none.
- Produces: `export function esc(str)` — returns a DOM-free HTML-escaped string; non-string input returned unchanged.

- [ ] **Step 1: Write the failing tests** (append to `tests/run_tests.js` before the summary block)

```js
console.log(`\n${BOLD}${CYAN}[Phase 7: esc() HTML escaping]${RESET}`);
{
    const { esc } = await import('../src/js/utils.js?esc-test-' + Date.now());
    assert(esc('<script>alert(1)</script>') === '&lt;script&gt;alert(1)&lt;/script&gt;', 'esc escapes angle brackets');
    assert(esc('a&b"c\'d') === 'a&amp;b&quot;c&#39;d', 'esc escapes &, quotes');
    assert(esc(42) === 42, 'esc leaves non-strings untouched');
    assert(esc(null) === null, 'esc leaves null untouched');
}
```

- [ ] **Step 2: Run the suite to verify failure**

Run: `node tests/run_tests.js`
Expected: Phase 7 fails with `esc is not a function` (module import error at the `import` call) — that is the failing signal. (If the logger throws before Phase 7, the suite exits non-zero, which is also an acceptable failing signal.)

- [ ] **Step 3: Implement `esc`** — append to `src/js/utils.js`

```js
export function esc(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
```

- [ ] **Step 4: Run the suite to verify passing**

Run: `node tests/run_tests.js`
Expected: 95 existing + 4 new pass; suite exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/js/utils.js tests/run_tests.js
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(security): esc() html-escape utility with tests"
```

---

### Task 2: Schema — parity fixes + points ledger + RPCs + mock mirror

**Files:**
- Modify: `sql/schema.sql` (append a Phase A block after line 594; also edit `complete_session` body lines 519-523)
- Modify: `src/js/neon.js` (mock: point-award hooks on insert/update + new RPC implementations)
- Test: `tests/run_tests.js` (extend Phase 6 schema assertions + new Phase 4C mock-points assertions)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces (shared contract, later tasks rely on these exact names):
  - Table `points_ledger(user_id, amount, reason, ref_type, ref_id)`, RLS: readers own rows, insert blocked for clients
  - Table `awareness_quiz_attempts(user_id, content_id, passed, score)`, `unique(user_id, content_id)`
  - `club_members.status text not null default 'active'`
  - `school_visits` CHECKs: `school_type in ('public','private')`, `activity_type in ('awareness_day','hostel_visit','competition','partnership')`
  - `try_award_points(p_user_id uuid, p_amount int, p_reason text, p_ref_type text, p_ref_id uuid)` — the only way a point row is created
  - Triggers: club join +100, training completed +200, school visit confirmed/completed +120
  - `record_quiz_attempt(p_content_id uuid, p_passed boolean, p_score int default 0) returns jsonb` — upserts attempt, awards +50 once
  - `complete_session(p_session_id uuid)` refactored to award via ledger (no direct `profiles.impact_points` write)
  - `award_points_admin(p_user_id uuid, p_amount int, p_reason text) returns jsonb` — admin-only ledger award
  - `get_impact_summary(p_user_id uuid) returns jsonb` → `{total_points, breakdown, badge_tier}`
  - `get_platform_stats() returns jsonb` → `{clubs, members, school_visits, volunteer_hours}`
  - Mock mirrors: `neon.rpc('record_quiz_attempt'|'award_points_admin'|'get_impact_summary'|'get_platform_stats')` work in demo; `neon.from('club_members').insert` +100, `training_enrollments` update→completed +200, `school_visits` update→confirmed/completed +120; `neon.from('profiles').update` rejected in mock too (parity with the gateway lock)

- [ ] **Step 1: Write the failing schema tests** — extend `tests/run_tests.js` Phase 6 with these assertions (place after the existing `Schema defines table ...` block)

```js
assert(schemaSql.includes('create table public.points_ledger'), 'Schema defines table points_ledger');
assert(schemaSql.includes('create table public.awareness_quiz_attempts'), 'Schema defines table awareness_quiz_attempts');
assert(schemaSql.includes('function public.try_award_points'), 'Schema defines function try_award_points');
assert(schemaSql.includes('function public.record_quiz_attempt'), 'Schema defines function record_quiz_attempt');
assert(schemaSql.includes('function public.get_impact_summary'), 'Schema defines function get_impact_summary');
assert(schemaSql.includes('function public.get_platform_stats'), 'Schema defines function get_platform_stats');
assert(schemaSql.includes('function public.award_points_admin'), 'Schema defines function award_points_admin');
assert(schemaSql.includes("school_type in ('public','private')"), 'school_visits accepts public/private school types');
assert(schemaSql.includes("activity_type in ('awareness_day','hostel_visit','competition','partnership')"), 'school_visits accepts product activity types');
assert(schemaSql.includes('create trigger trg_club_join_points'), 'Schema defines club-join points trigger');
assert(schemaSql.includes('create trigger trg_training_complete_points'), 'Schema defines training-complete points trigger');
assert(schemaSql.includes('create trigger trg_school_visit_points'), 'Schema defines school-visit points trigger');
```

(`schemaSql` is the variable already read from `sql/schema.sql` in Phase 6 — reuse it.)

- [ ] **Step 2: Write the failing mock-parity tests** — append a Phase 4C block to `tests/run_tests.js` (the mock env is bootstrapped in Phase 1 with a seeded DB)

```js
console.log(`\n${BOLD}${CYAN}[Phase 4C: Mock Points Parity]${RESET}`);
{
    const { seedMockDB } = await import('../src/js/neon.js?mockpoints-' + Date.now());
    seedMockDB();
    const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
    const getPoints = (id) => (profiles.find(p => p.id === id) || {}).impact_points || 0;

    // pick a member and a club they do NOT belong to
    const member = profiles.find(p => p.role === 'member');
    const clubs = JSON.parse(localStorage.getItem('athar_mock_db_clubs') || '[]');
    const mems = JSON.parse(localStorage.getItem('athar_mock_db_club_members') || '[]');
    const freeClub = clubs.find(c => !mems.some(m => m.club_id === c.id && m.user_id === member.id));
    const before = getPoints(member.id);
    const { neon } = await import('../src/js/neon.js?mockpoints2-' + Date.now());
    neon.setToken('mock-session-jwt-token-test');
    await neon.from('club_members').insert({ club_id: freeClub.id, user_id: member.id });
    assert(getPoints(member.id) === before + 100, 'club join awards +100 through the mock');
    await neon.from('profiles').update({ impact_points: 999999 }, member.id);
    assert(getPoints(member.id) === before + 100, 'mock rejects direct profile point edits (gateway parity)');
}
```

- [ ] **Step 3: Run the suite to verify both new blocks fail**

Run: `node tests/run_tests.js`
Expected: Phase 6 new assertions fail (schema tokens absent); Phase 4C fails (`seedMockDB` imported twice under different query strings is fine; failures come from absent `points_ledger`-related behavior).

- [ ] **Step 4: Apply the schema changes** — append to `sql/schema.sql` after the final line (594)

```sql
-- ============================================================================
-- PHASE A: schema/UI parity + server-enforced points ledger
-- ============================================================================

alter table public.school_visits drop constraint school_visits_school_type_check;
alter table public.school_visits add constraint school_visits_school_type_check
  check (school_type in ('public','private'));
alter table public.school_visits drop constraint school_visits_activity_type_check;
alter table public.school_visits add constraint school_visits_activity_type_check
  check (activity_type in ('awareness_day','hostel_visit','competition','partnership'));

alter table public.club_members add column status text not null default 'active';

alter table public.training_enrollments alter column completed_at drop not null;
alter table public.training_enrollments alter column completed_at set default now();

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount int not null check (amount <> 0),
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);
alter table public.points_ledger enable row level security;
create policy "Users read own ledger" on points_ledger for select
  using (user_id = auth.uid() or public.is_platform_admin());
create policy "Ledger writes are function-only" on points_ledger for insert with check (false);

create table public.awareness_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content_id uuid references public.awareness_content(id) on delete cascade not null,
  passed boolean not null default false,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, content_id)
);
alter table public.awareness_quiz_attempts enable row level security;
create policy "Users read own quiz attempts" on awareness_quiz_attempts for select
  using (user_id = auth.uid());
create policy "Quiz writes are function-only" on awareness_quiz_attempts for insert with check (false);

create or replace function public.try_award_points(p_user_id uuid, p_amount int, p_reason text, p_ref_type text, p_ref_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.points_ledger (user_id, amount, reason, ref_type, ref_id)
  values (p_user_id, p_amount, p_reason, p_ref_type, p_ref_id);
  update public.profiles set impact_points = impact_points + p_amount, updated_at = now()
  where id = p_user_id;
end; $$;

create or replace function public.trg_club_join_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.try_award_points(new.user_id, 100, 'club_join', 'club_members', new.club_id);
  return new;
end; $$;
create trigger trg_club_join_points after insert on public.club_members
  for each row execute function public.trg_club_join_points();

create or replace function public.trg_training_complete_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and new.status is distinct from old.status then
    perform public.try_award_points(new.user_id, 200, 'training_complete', 'training_enrollments', new.id);
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  return new;
end; $$;
create trigger trg_training_complete_points after update of status on public.training_enrollments
  for each row execute function public.trg_training_complete_points();

create or replace function public.trg_school_visit_points()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status in ('confirmed','completed') and new.status is distinct from old.status and new.user_id is not null then
    perform public.try_award_points(new.user_id, 120, 'school_visit', 'school_visits', new.id);
  end if;
  return new;
end; $$;
create trigger trg_school_visit_points after update of status on public.school_visits
  for each row execute function public.trg_school_visit_points();

create or replace function public.record_quiz_attempt(p_content_id uuid, p_passed boolean, p_score integer default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_passed boolean := coalesce(p_passed, false);
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  insert into public.awareness_quiz_attempts (user_id, content_id, passed, score)
  values (auth.uid(), p_content_id, v_passed, coalesce(p_score, 0))
  on conflict (user_id, content_id) do update set passed = excluded.passed, score = excluded.score;
  if v_passed and not exists (
    select 1 from public.points_ledger
    where user_id = auth.uid() and reason = 'awareness_quiz' and ref_id = p_content_id
  ) then
    perform public.try_award_points(auth.uid(), 50, 'awareness_quiz', 'awareness_content', p_content_id);
  end if;
  return jsonb_build_object('status', 'recorded');
end; $$;

create or replace function public.award_points_admin(p_user_id uuid, p_amount int, p_reason text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'unauthorized' using errcode = '28000'; end if;
  if not public.is_platform_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  perform public.try_award_points(p_user_id, p_amount, coalesce(p_reason, 'admin_adjustment'), 'admin', null);
  return jsonb_build_object('status', 'awarded');
end; $$;

create or replace function public.get_impact_summary(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_breakdown jsonb;
  v_tier int;
begin
  select coalesce(sum(amount), 0),
         coalesce(jsonb_object_agg(reason, total), '{}'::jsonb)
  into v_total, v_breakdown
  from (
    select reason, sum(amount) as total
    from public.points_ledger where user_id = p_user_id group by reason
  ) s;
  v_tier := case when v_total >= 2000 then 5 when v_total >= 1000 then 4
                 when v_total >= 500  then 3 when v_total >= 250 then 2
                 when v_total > 0     then 1 else 0 end;
  return jsonb_build_object('total_points', v_total, 'breakdown', v_breakdown, 'badge_tier', v_tier);
end; $$;

create or replace function public.get_platform_stats()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'clubs', (select count(*) from public.clubs),
    'members', (select count(*) from public.profiles),
    'school_visits', (select count(*) from public.school_visits),
    'volunteer_hours', (select coalesce(sum(hours), 0) from public.volunteer_signups)
  );
$$;
```

- [ ] **Step 5: Refactor `complete_session` to the ledger** — replace the body at `sql/schema.sql:519-523` (the two direct profile-bump statements) with a per-attendee ledger award

```sql
  update public.volunteer_signups vs
  set hours = v_hours, points_awarded = v_points
  from (select id, volunteer_id from public.volunteer_signups where session_id = p_session_id and status = 'attended') sub
  where vs.id = sub.id;
  get diagnostics v_attended = row_count;
  for v_row in
    select id, volunteer_id from public.volunteer_signups
    where session_id = p_session_id and status = 'attended'
  loop
    perform public.try_award_points(v_row.volunteer_id, v_points, 'volunteer_complete', 'volunteer_signups', v_row.id);
  end loop;
```

Add to the function's `declare` block: `v_row record;` (the loop already names it `v_row`; the function must keep its exact signature and its final `return jsonb_build_object('status','completed','per_volunteer',v_points,'attended',v_attended);`).

- [ ] **Step 6: Mirror in the mock** — `src/js/neon.js`
  - In `rpc()` (the mock `rpc` dispatch that currently returns `{error:{code:'unknown_rpc'}}` at neon.js:184 for unknown fns), add handlers *before* the unknown fallback:

```js
if (fn === 'record_quiz_attempt') {
    return mockRecordQuizAttempt(payload.p_content_id, payload.p_passed, payload.p_score);
}
if (fn === 'get_impact_summary') {
    return await mockImpactSummary(payload.p_user_id);
}
if (fn === 'get_platform_stats') {
    return await mockPlatformStats();
}
if (fn === 'award_points_admin') {
    return await mockAwardAdmin(payload.p_user_id, payload.p_amount, payload.p_reason);
}
```

  - Add the helper functions next to the other mock RPC implementation functions:

```js
function mockLogPoints(userId, amount, reason, refType, refId) {
    const db = JSON.parse(localStorage.getItem('athar_mock_db_ledger') || '[]');
    db.push({ id: 'm-' + Math.random().toString(36).slice(2), user_id: userId, amount, reason, ref_type: refType, ref_id: refId, created_at: new Date().toISOString() });
    localStorage.setItem('athar_mock_db_ledger', JSON.stringify(db));
    const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
    const p = profiles.find(x => x.id === userId);
    if (p) { p.impact_points = (p.impact_points || 0) + amount; }
    localStorage.setItem('athar_mock_db_profiles', JSON.stringify(profiles));
}
function mockBlockedProfilesWrite() {
    return { data: null, error: { code: 'forbidden', message: 'table not allowed' } };
}
async function mockRecordQuizAttempt(contentId, passed, score) {
    const sess = JSON.parse(localStorage.getItem('neon_session') || 'null');
    if (!sess || !sess.user) return { data: null, error: { code: 'unauthorized', message: 'login required' } };
    const uid = sess.user.id;
    const attempts = JSON.parse(localStorage.getItem('athar_mock_db_quiz_attempts') || '[]');
    const existing = attempts.find(a => a.user_id === uid && a.content_id === contentId);
    if (existing) { existing.passed = !!passed; existing.score = score || 0; }
    else { attempts.push({ id: 'm-quiz', user_id: uid, content_id: contentId, passed: !!passed, score: score || 0 }); }
    localStorage.setItem('athar_mock_db_quiz_attempts', JSON.stringify(attempts));
    if (passed) {
        const ledger = JSON.parse(localStorage.getItem('athar_mock_db_ledger') || '[]');
        if (!ledger.some(l => l.user_id === uid && l.reason === 'awareness_quiz' && l.ref_id === contentId)) {
            mockLogPoints(uid, 50, 'awareness_quiz', 'awareness_content', contentId);
        }
    }
    return { data: { status: 'recorded' }, error: null };
}
async function mockImpactSummary(userId) {
    const ledger = JSON.parse(localStorage.getItem('athar_mock_db_ledger') || '[]').filter(l => l.user_id === userId);
    const total = ledger.reduce((s, l) => s + l.amount, 0);
    const breakdown = ledger.reduce((o, l) => { o[l.reason] = (o[l.reason] || 0) + l.amount; return o; }, {});
    const tier = total >= 2000 ? 5 : total >= 1000 ? 4 : total >= 500 ? 3 : total >= 250 ? 2 : total > 0 ? 1 : 0;
    return { data: { total_points: total, breakdown, badge_tier: tier }, error: null };
}
async function mockPlatformStats() {
    const clubs = JSON.parse(localStorage.getItem('athar_mock_db_clubs') || '[]');
    const profilesCount = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]').length;
    const schoolVisits = JSON.parse(localStorage.getItem('athar_mock_db_school_visits') || '[]');
    const signups = JSON.parse(localStorage.getItem('athar_mock_db_volunteer_signups') || '[]');
    return { data: {
        clubs: clubs.length,
        members: profilesCount,
        school_visits: schoolVisits.length,
        volunteer_hours: signups.reduce((s, v) => s + (v.hours || 0), 0)
    }, error: null };
}
async function mockAwardAdmin(userId, amount, reason) {
    const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
    const me = profiles.find(x => x.id === JSON.parse(localStorage.getItem('neon_session') || 'null')?.user?.id);
    if (!me || !['admin', 'superadmin'].includes(me.role)) {
        return { data: null, error: { code: 'forbidden', message: 'forbidden' } };
    }
    mockLogPoints(userId, amount, reason || 'admin_adjustment', 'admin', null);
    return { data: { status: 'awarded' }, error: null };
}
```

  - In the insert pipeline add a hook after `club_members` insert succeeds: `mockLogPoints(row.user_id, 100, 'club_join', 'club_members', row.club_id);`
  - In the update pipeline: after a `training_enrollments` update that sets `status:'completed'`, `mockLogPoints(row.user_id, 200, 'training_complete', 'training_enrollments', row.id)`; after a `school_visits` update that sets `status` to `'confirmed'` or `'completed'` where the row has `user_id`, `mockLogPoints(row.user_id, 120, 'school_visit', 'school_visits', row.id)`. Only fire when the previous stored status differs (mirror `is distinct from old.status`).
  - In the `from('profiles')` write path (insert/update/delete), return `mockBlockedProfilesWrite()` — mirror the gateway lock.
  - In `seedMockDB()`, initialize `athar_mock_db_ledger`/`athar_mock_db_quiz_attempts` to `[]` so helpers never see null (keep seed's existing direct `impact_points` values as the baseline the ledger then extends from).

- [ ] **Step 7: Run the suite to verify both blocks pass**

Run: `node tests/run_tests.js`
Expected: all Phase 6 schema assertions and Phase 4C mock-parity assertions pass; total suite stays green (95 + new).

- [ ] **Step 8: Run the other two suites (regression)**

Run: `node tests/api_test.js; node tests/auth_contract_test.js`
Expected: 21/21 and 18/18 (the gateway lock lands in Task 3; these must not regress here).

- [ ] **Step 9: Commit**

```bash
git add sql/schema.sql src/js/neon.js tests/run_tests.js
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(db): points ledger + product parity checks + mock mirrors"
```

---

### Task 3: Gateway read-only profiles lock

**Files:**
- Modify: `api/action.js` (ALLOWED_TABLES line 7-11; rate limit comment remains)
- Test: `tests/api_test.js` (extend Phase 3 mutation tests)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `profiles` is no longer a mutation target via `/api/action`; `processAction` returns `403 {error:{code:'forbidden'}}` for any profiles insert/update/delete. Applies to Vercel and local `server.js` because it imports `processAction` from `./api/action.js` (server.js:6).

- [ ] **Step 1: Write the failing tests** — append to `tests/api_test.js` after the existing "audit_logs is not client-writable" test (line ~77)

```js
console.log('\n[Phase 3B] profiles is read-only through the gateway');
{
    calls.length = 0;
    let out = await processAction({ action: 'insert', table: 'profiles', payload: { full_name: 'X' }, token: 'jwt' }, {});
    assert(out.status === 403 && out.body.error.code === 'forbidden', 'profiles insert rejected');
    out = await processAction({ action: 'update', table: 'profiles', id: 'u-1', payload: { impact_points: 999 }, token: 'jwt' }, {});
    assert(out.status === 403 && out.body.error.code === 'forbidden', 'profiles update rejected (no self-inflation)');
    out = await processAction({ action: 'delete', table: 'profiles', id: 'u-1', token: 'jwt' }, {});
    assert(out.status === 403 && out.body.error.code === 'forbidden', 'profiles delete rejected');
    assert(!calls.some(c => c.url.includes('/profiles')), 'no profiles request ever reaches the DB');
}
```

- [ ] **Step 2: Run to verify failure**

Run: `node tests/api_test.js`
Expected: the new asserts fail (profiles still allowed → proxy succeeds → no 403).

- [ ] **Step 3: Remove `'profiles'` from the allow-list**

Edit `api/action.js` `ALLOWED_TABLES` (lines 7-11) to:

```js
const ALLOWED_TABLES = new Set([
    'initiatives', 'initiative_members', 'tasks', 'notifications',
    'clubs', 'club_members', 'training_courses', 'training_enrollments', 'consultations',
    'awareness_content', 'school_visits', 'invites', 'volunteer_sessions', 'volunteer_signups'
]);
```

- [ ] **Step 4: Run to verify passing**

Run: `node tests/api_test.js`
Expected: new Phase 3B asserts pass; all 21 existing still pass.

- [ ] **Step 5: Commit**

```bash
git add api/action.js tests/api_test.js
git -c user.name=anouar -c user.email=anouar@local commit -m "fix(api): profiles is read-only through the gateway (closes self-inflation)"
```

---

### Task 4: CSP extraction — pattern + index.html

**Files:**
- Create: `src/pages/index.js`
- Modify: `pages/index.html` (replace inline module lines 297-356 with a module src; stats bar left for Task 11)
- Test: build + HTTP checks

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces the extraction contract all later extraction tasks follow:
  1. The inline `<script type="module">` block body moves **verbatim** into `src/pages/<name>.js`.
  2. Rewrite relative imports: everywhere `../src/js/` → `../js/`. (From `src/pages/` the shared modules live at `../js/`.)
  3. In the HTML, replace the whole `<script type="module">...body...</script>` with `<script type="module" src="../src/pages/index.js"></script>`.
  4. Any `window.<fn> = ...` bindings in the body are preserved unchanged.
  5. Later tasks that edit behavior edit the `src/pages/*.js` file, never the inline copy (there is no inline copy anymore).

- [ ] **Step 1: Move the body** — create `src/pages/index.js` whose content is exactly the body of `pages/index.html:297-356` (the `import { injectLayout } ...` through `window.onload = () => { ... };`) with every `../src/js/` import prefix rewritten to `../js/`. The resulting file has four imports: `layout.js`, `i18n.js`, `theme.js`, `animations.js`, `pwa.js`.

- [ ] **Step 2: Swap the inline script** — in `pages/index.html`, delete lines 297-356 and insert:

```html
    <script type="module" src="../src/pages/index.js"></script>
```

- [ ] **Step 3: Run a failing check** — verify the CSP constraint mechanically

```powershell
(Select-String -Path pages\index.html -Pattern '<script(?![^>]*src=)' ).Count
```

Run: `node build.js` first, then the grep.
Expected: grep count 0 for index.html (no inline script without a src).

- [ ] **Step 4: Verify the module loads**

Run: `node build.js`; then `Invoke-WebRequest http://localhost:8080/src/pages/index.js` and `http://localhost:8080/` .
Expected: module served 200 and content starts with `import { injectLayout } from '../js/layout.js';`; the home page is 200.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.js pages/index.html
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(csp): externalize index module (pattern for all pages)"
```

---

### Task 5: CSP extraction — auth + admin

**Files:**
- Create: `src/pages/auth.js`, `src/pages/admin.js`
- Modify: `pages/auth.html`, `pages/admin.html`

**Interfaces:**
- Consumes: the extraction contract from Task 4.
- Produces: `src/pages/auth.js` (module running the auth page logic: signIn/signUp/signInDemo wiring, auth.html:60-140 region) and `src/pages/admin.js` (requireAdmin gate + all admin table logic, admin.html:276-end).

- [ ] **Step 1: Extract `auth.html`**
  - Create `src/pages/auth.js` from the exact body of `pages/auth.html` inline module (the `<script type="module">` block), rewriting `../src/js/` → `../js/`.
  - Replace the inline block in `auth.html` with `<script type="module" src="../src/pages/auth.js"></script>`.

- [ ] **Step 2: Extract `admin.html`**
  - Create `src/pages/admin.js` the same way (rewrite imports; keep the existing `import { requireAdmin }` + `init()` shape and any `window.` handler bindings verbatim).
  - Swap the inline block in `admin.html`.

- [ ] **Step 3: Verify**

Run: `node build.js`
```powershell
(Select-String -Path pages\auth.html,pages\admin.html -Pattern '<script(?![^>]*src=)' | Measure-Object).Count
```
Expected: 0; both pages return 200 on http://localhost:8080 and both `../src/pages/auth.js`/`admin.js` are 200.

- [ ] **Step 4: Commit**

```bash
git add src/pages/auth.js src/pages/admin.js pages/auth.html pages/admin.html
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(csp): externalize auth + admin modules"
```

---

### Task 6: CSP extraction — clubs, awareness, training

**Files:**
- Create: `src/pages/clubs.js`, `src/pages/awareness.js`, `src/pages/training.js`
- Modify: `pages/clubs.html`, `pages/awareness.html`, `pages/training.html`

**Interfaces:**
- Consumes: Task 4 contract. These modules will be edited again in Tasks 10 (points removal) after extraction — they must be pure verbatim moves + import rewrite only.
- Produces: the three pillar modules, identical behavior to today.

- [ ] **Step 1: Extract clubs** — move `pages/clubs.html` inline module body to `src/pages/clubs.js` (rewrite imports), swap inline block for `../src/pages/clubs.js`.
- [ ] **Step 2: Extract awareness** — same for `pages/awareness.html` → `src/pages/awareness.js`.
- [ ] **Step 3: Extract training** — same for `pages/training.html` → `src/pages/training.js`.
- [ ] **Step 4: Verify**

Run: `node build.js`; then:
```powershell
(Select-String -Path pages\clubs.html,pages\awareness.html,pages\training.html -Pattern '<script(?![^>]*src=)' | Measure-Object).Count
```
Expected: 0 inline; the three pages and three modules return 200; `node tests/run_tests.js` still green (no behavior change).

- [ ] **Step 5: Commit**

```bash
git add src/pages/clubs.js src/pages/awareness.js src/pages/training.js pages/clubs.html pages/awareness.html pages/training.html
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(csp): externalize clubs, awareness, training modules"
```

---

### Task 7: CSP extraction — schools, support, volunteers

**Files:**
- Create: `src/pages/schools.js`, `src/pages/support.js`, `src/pages/volunteers.js`
- Modify: `pages/schools.html`, `pages/support.html`, `pages/volunteers.html`

**Interfaces:**
- Consumes: Task 4 contract.
- Produces: three pillar modules. `support.js` must keep `window.submitConsultation`, `window.showTab`, and any other `window.` bindings exactly as today (the HTML `onsubmit`/`onclick` attributes reference them).

- [ ] **Step 1: Extract schools** → `src/pages/schools.js` (`pages/schools.html` inline module), swap inline block.
- [ ] **Step 2: Extract support** → `src/pages/support.js` (keep `window.` bindings), swap inline block.
- [ ] **Step 3: Extract volunteers** → `src/pages/volunteers.js`, swap inline block.
- [ ] **Step 4: Verify**

Run: `node build.js`; then the inline-script grep on the three pages = 0 and all six URLs return 200.

- [ ] **Step 5: Commit**

```bash
git add src/pages/schools.js src/pages/support.js src/pages/volunteers.js pages/schools.html pages/support.html pages/volunteers.html
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(csp): externalize schools, support, volunteers modules"
```

---

### Task 8: CSP extraction — dashboard, explore, initiative

**Files:**
- Create: `src/pages/dashboard.js`, `src/pages/explore.js`, `src/pages/initiative.js`
- Modify: `pages/dashboard.html`, `pages/explore.html`, `pages/initiative.html`

**Interfaces:**
- Consumes: Task 4 contract.
- Produces: dashboard (guest-branch logic intact), explore (edit target for Task 13), initiative (edit target for later phases).

- [ ] **Step 1: Extract dashboard** → `src/pages/dashboard.js`, swap inline block.
- [ ] **Step 2: Extract explore** → `src/pages/explore.js`, swap inline block.
- [ ] **Step 3: Extract initiative** → `src/pages/initiative.js`, swap inline block.
- [ ] **Step 4: Verify** — build; inline grep = 0 on the three pages; all six URLs 200; suites green.
- [ ] **Step 5: Commit**

```bash
git add src/pages/dashboard.js src/pages/explore.js src/pages/initiative.js pages/dashboard.html pages/explore.html pages/initiative.html
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(csp): externalize dashboard, explore, initiative modules"
```

---

### Task 9: CSP extraction — create, tasks, notifications, invites, profile + full sweep

**Files:**
- Create: `src/pages/create.js`, `src/pages/tasks.js`, `src/pages/notifications.js`, `src/pages/invites.js`, `src/pages/profile.js`
- Modify: `pages/create.html`, `pages/tasks.html`, `pages/notifications.html`, `pages/invites.html`, `pages/profile.html`

**Interfaces:**
- Consumes: Task 4 contract; `create.js` uses `import { createInitiative } from '../js/db.js'` (rewritten), `profile.js` uses the auth/profile logic.
- Produces: all remaining pages externalized; `pages/offline.html` has no script (skip). **A1 is complete after this task.**

- [ ] **Step 1: Extract each page** — create the five modules (verbatim bodies, imports rewritten) and swap each inline block.
- [ ] **Step 2: Full-site inline-script sweep**

Run: `node build.js`; then:
```powershell
(Select-String -Path pages\*.html -Pattern '<script(?![^>]*src=)' | Measure-Object).Count
```
Expected: 0 across all pages. Confirm `pages/offline.html` is untouched and contains no script tags.

- [ ] **Step 3: Full-site 200 check**

```powershell
Get-ChildItem pages\*.html | ForEach-Object { $r = Invoke-WebRequest ("http://localhost:8080/pages/" + $_.Name) -UseBasicParsing; "$($_.Name): $($r.StatusCode)" }
```
Expected: every row is 200. Also `node tests/run_tests.js`, `node tests/api_test.js`, `node tests/auth_contract_test.js` all green.

- [ ] **Step 4: Commit**

```bash
git add src/pages/create.js src/pages/tasks.js src/pages/notifications.js src/pages/invites.js src/pages/profile.js pages/create.html pages/tasks.html pages/notifications.html pages/invites.html pages/profile.html
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(csp): externalize remaining modules; zero inline scripts site-wide"
```

---

### Task 10: Frontend point integration + real notifications empty-state

**Files:**
- Modify: `src/pages/clubs.js` (joinClub), `src/pages/training.js` (enroll/complete), `src/pages/awareness.js` (quiz award → RPC), `src/pages/schools.js` (manual +120 removal)
- Modify: `src/pages/notifications.js` (real-mode empty-state), `src/js/neon.js` (seed notifications)
- Test: `tests/run_tests.js` (extend Phase 4C with awareness quiz + training completion assertions)

**Interfaces:**
- Consumes: schema contract from Task 2 (`record_quiz_attempt`, triggers, mock `neon` mirrors), Task 4-9 module locations.
- Produces: pages no longer mutate `profiles`; awareness quiz awards via `record_quiz_attempt`; notifications no longer show fake rows in real mode.

- [ ] **Step 1: Extend the mock-parity tests** (append to Phase 4C in `tests/run_tests.js`)

```js
// awareness quiz +50 once per article (uses mockRecordQuizAttempt)
{
    const { neon } = await import('../src/js/neon.js?quiztest-' + Date.now());
    neon.setToken('mock-session-jwt-token-test');
    const art = JSON.parse(localStorage.getItem('athar_mock_db_awareness_content') || '[]')[0];
    const before = getPoints(member.id);
    await neon.rpc('record_quiz_attempt', { p_content_id: art.id, p_passed: true, p_score: 2 });
    assert(getPoints(member.id) === before + 50, 'quiz pass awards +50 once');
    await neon.rpc('record_quiz_attempt', { p_content_id: art.id, p_passed: true, p_score: 2 });
    assert(getPoints(member.id) === before + 50, 'quiz re-attempt does not re-award');
}
```

  Run `node tests/run_tests.js`; expect the new asserts to fail (no award yet) before the implement steps, then pass after.

- [ ] **Step 2: `clubs.js`** — in `joinClub` (was clubs.html:256-284) delete the client point-award block:

```js
            // Award 100 impact points
            const currentPoints = authSession.profile.impact_points || 0;
            await neon.from('profiles').update({ impact_points: currentPoints + 100 }, authSession.user.id);
```

  Keep the insert (now `status:'active'` is schema-valid via Task 2) and the success UI — the +100 now comes from the `trg_club_join_points` trigger (or `mockLogPoints` in demo).

- [ ] **Step 3: `training.js`** — remove both `profiles.update` point blocks in `enrollCourse` and `completeCourse` (the +50/+200 client edits). Also set `completed_at: new Date().toISOString()` in the completion update payload so the trigger's `completed_at` default path stays consistent.

- [ ] **Step 4: `schools.js`** — remove the `profiles.update` +120 block after the visit insert; the trigger awards on status transition to `confirmed`/`completed`. Confirm the submitted payload still uses product values (`awareness_day|hostel_visit|competition|partnership`, `public|private`, status `pending`).

- [ ] **Step 5: `awareness.js`** — in `showQuizResult` replace the profiles-update award block (awareness.html:303-308) with:

```js
            // Award 50 impact points via the server RPC (once per article)
            if (authSession && authSession.user) {
                await neon.rpc('record_quiz_attempt', { p_content_id: currentQuizArticleId, p_passed: true, p_score: QUIZ_QUESTIONS.length });
            }
```

  - Add `let currentQuizArticleId = null;` next to the other `let` state (awareness.html:217-220). In the article-card render, add a per-card "ابدأ الاختبار / Démarrer le quiz" button that sets `currentQuizArticleId = article.id` before launching the quiz. If the quiz is currently launched without an article selected, default `currentQuizArticleId` to the first article id once at init. (This is the minimal wiring that makes the once-per-article award truthful.)

- [ ] **Step 6: `notifications.js` real-mode empty-state** — locate the fallback that renders `MOCK_NOTIFS` when the query returns empty or throws (notifications.html:67-73, 92-94). Change the fallback to only apply when mock mode is active (`localStorage.getItem('athar_mock_mode') === 'true'`); otherwise render the localized empty state ("لا توجد إشعارات بعد" with inline ar/fr/en via `d.empty_state` added to the page DICT).

- [ ] **Step 7: Seed notifications in demo** — in `seedMockDB` (neon.js) add two `notifications` rows for a member (types `invite` and `volunteer_approved`) so the demo inbox is non-empty and the empty-state code path is only exercised in real mode.

- [ ] **Step 8: `admin.js` point controls → `award_points_admin` RPC** — `src/pages/admin.js` contains a "points" control that today writes target users' `profiles` (blocked by the Task 3 gateway lock). Change `addPoints` (and any remove/`adjustPoints` that uses `neon.from('profiles').update`) to call `neon.rpc('award_points_admin', { p_user_id, p_amount: <signed int, e.g. -10 for removal or withdraw>, p_reason: 'admin_adjustment' })` and refresh the target's points from the returned payload. The control keeps working against the server RPC, never the profiles table. (Role-change controls remain Phase B.)

- [ ] **Step 9: Verify**

Run: `node build.js`; then `node tests/run_tests.js`; `node tests/api_test.js`; `node tests/auth_contract_test.js`. Spot-check on http://localhost:8080 that joining a club as the demo member yields a +100 toast-style success without any profiles write error (watch the network tab: no `POST /api/action` with `table:profiles` in mock; in mock there is no network, in real mode the insert succeeds and the trigger awards).

- [ ] **Step 10: Commit**

```bash
git add src/pages/clubs.js src/pages/training.js src/pages/awareness.js src/pages/schools.js src/pages/notifications.js src/pages/admin.js src/js/neon.js tests/run_tests.js
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(points): pages award through ledger rpc/triggers; real notifications empty-state"
```

---

### Task 11: Real landing stats

**Files:**
- Modify: `src/pages/index.js`, `src/js/i18n.js`, `pages/index.html`
- Test: `tests/run_tests.js` (mock `get_platform_stats` path)

**Interfaces:**
- Consumes: `get_platform_stats()` from Task 2 (real + mock).
- Produces: the four hero stat numbers come from `neon.rpc('get_platform_stats')`; a fourth key `stat_volunteer_hours` replaces `stat_privacy` in all three languages.

- [ ] **Step 1: Add the i18n key** — in `src/js/i18n.js` add `stat_volunteer_hours: 'ساعة تطوع'` (ar), `stat_volunteer_hours: 'heures de bénévolat'` (fr), `stat_volunteer_hours: 'volunteer hours'` (en), adjacent to `stat_privacy` (which may stay for other pages if referenced — check references first with grep; if unused, remove it).

- [ ] **Step 2: Update the 4th card copy** — in `pages/index.html` change the privacy stat card (index.html:231-235) to use `data-i18n="stat_volunteer_hours"` and a neutral placeholder (e.g. `0`).

- [ ] **Step 3: Wire stats in `index.js`** — inside `window.onload`, after `injectLayout()`:

```js
            const stats = await neon.rpc('get_platform_stats');
            const s = stats && stats.data;
            if (s) {
                const nums = document.querySelectorAll('.hero-stat-num');
                if (nums.length === 4 && document.querySelector('[data-i18n="stat_volunteer_hours"]')) {
                    nums[0].textContent = s.clubs ?? '0';
                    nums[1].textContent = s.members ?? '0';
                    nums[2].textContent = s.school_visits ?? '0';
                    nums[3].textContent = s.volunteer_hours ?? '0';
                }
            }
```

  Add `import { neon } from '../js/neon.js';` to `src/pages/index.js`, and give the four stat numbers a class `hero-stat-num` in `pages/index.html`.

- [ ] **Step 4: Test the mock path** — append to Phase 4C: assert `(await neon.rpc('get_platform_stats')).data.clubs === 4` (the seeded club count). Verify fails before Step 3's mock (Task 2 already added it) — it should pass already; if it does, that is the correct state (the mock landed in Task 2).

Run: `node build.js`; then suites. Spot-check http://localhost:8080 shows seed counts in the hero bar.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.js src/js/i18n.js pages/index.html tests/run_tests.js
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(stats): hero stats bound to get_platform_stats"
```

---

### Task 12: Printable certificate page

**Files:**
- Create: `pages/certificate.html`, `src/pages/certificate.js`
- Modify: `src/pages/training.js` (cert link)

**Interfaces:**
- Consumes: `neon.from('training_enrollments'|'training_courses'|'profiles')` reads (RLS allows: enrollment owner, courses public, profiles public).
- Produces: `GET /pages/certificate.html?enroll=<uuid>` renders a localized printable certificate (name, course title, date, "تأهيل" label) with a print button (`window.print()`).

- [ ] **Step 1: Create `pages/certificate.html`**
  - Head matches the existing page conventions (fonts, `.glass` styles, dark theme vars).
  - Body: a centered certificate card with placeholders: `#cert-name`, `#cert-course`, `#cert-date`, and a print button.
  - Script tag at the end: `<script type="module" src="../src/pages/certificate.js"></script>` (external module — never inline, per CSP).

- [ ] **Step 2: Create `src/pages/certificate.js`**
  - `requireAuth({ guests: false })` (a certificate names a person — only signed-in owners reach it).
  - Read `enroll` from `new URLSearchParams(location.search)`.
  - `neon.from('training_enrollments').select().id(enrollId)` → row; `neon.from('training_courses').select().id(row.course_id)` → course; `neon.from('profiles').select().id(sess.user.id)` → name.
  - Guard: if the enrollment's `user_id !== sess.user.id`, render a "not yours" message (no data leak).
  - Localize via `getCurrentLang()`; simple inline labels for ar/fr/en.
  - Fill `#cert-name`, `#cert-course` (title per lang), `#cert-date` (`formatDate(completed_at || enrolled_at, lang)` from utils).

- [ ] **Step 3: Point training to the real page** — in `src/pages/training.js`, the certificate link builder (`https://athar.dev/credentials/cert-${id}.pdf`) becomes a same-dir relative link:

```js
const certUrl = 'certificate.html?enroll=' + encodeURIComponent(enroll.id);
```

  Keep the "open in new tab" behavior on the link.

- [ ] **Step 4: Test**
  - Add an assertion to Phase 4C: `await neon.rpc('get_platform_stats')` already covered; for the cert, add a build-level check — after `node build.js`, open `http://localhost:8080/pages/certificate.html` (guest) and confirm the page redirects to auth; open a session via demo sign-in then hit `certificate.html?enroll=<seeded-enrollment-id>` in the browser and confirm the seeded name/course render.
  - Suites remain green.

- [ ] **Step 5: Commit**

```bash
git add pages/certificate.html src/pages/certificate.js src/pages/training.js
git -c user.name=anouar -c user.email=anouar@local commit -m "feat(cert): printable certificate page replaces fake athar.dev link"
```

---

### Task 13: Fix explore filters

**Files:**
- Modify: `src/pages/explore.js`, `pages/explore.html`

**Interfaces:**
- Consumes: `APP_CONFIG.categories` ids (`robotics|programming|theater|music|reading|other`).
- Produces: filter chips that actually match `initiative.category`; empty-result state shows a localized message instead of a silently empty grid.

- [ ] **Step 1: Read current chips** — confirm `pages/explore.html` renders chips (`clubs/awareness/training/schools`) and `src/pages/explore.js` filters `initiative.category` against them. (They never match, so every filter shows nothing.)

- [ ] **Step 2: Align the HTML chips** to the real category ids, driven by `APP_CONFIG.categories` — render one chip per `categories` entry with `data-cat="<id>"`, and the label per lang. Ensure the "all" chip (`data-cat="all"`) stays first.

- [ ] **Step 3: Align the filter logic** — `applyFilters()` must compare `initiative.category === cat` using the `data-cat` ids, and if zero results, show an empty-state div (`d.empty_results`) instead of the current silent behavior. Add `empty_results` to `src/pages/explore.js` inline DICT for ar/fr/en.

- [ ] **Step 4: Verify**

Run: `node build.js`; open http://localhost:8080/pages/explore.html as a demo member; click each chip and confirm at least one result for categories the seeds use; the "all" chip shows both approved initiatives. Suites green.

- [ ] **Step 5: Commit**

```bash
git add src/pages/explore.js pages/explore.html
git -c user.name=anouar -c user.email=anouar@local commit -m "fix(explore): filters match real initiative categories + empty-state"
```

---

### Task 14: esc() sweep on user/DB-render sites

**Files:**
- Modify: `src/pages/*.js` render sites listed below, `src/js/notifications.js`

**Interfaces:**
- Consumes: `esc` from `utils.js` (Task 1).
- Produces: no unescaped user/DB-controlled string reaches `innerHTML` at the listed sites.

- [ ] **Step 1: Grep the current inventory**

Run: `Select-String -Path src\pages\*.js,src\js\notifications.js -Pattern 'innerHTML\s*=' | ForEach-Object { "$($_.Filename):$($_.LineNumber)" }`
Expected: a site list including at least: volunteers card render (titleOf/descOf), initiative render (category/title/description), training course cards, notifications toast in `src/js/notifications.js:15-23`.

- [ ] **Step 2: Wrap interpolated DB/user variables with `esc(...)`** at exactly these sites (do not escape static template parts):
  - `src/pages/volunteers.js` — `titleOf(...)` / `descOf(...)` results and any session title/desc interpolation in cards.
  - `src/pages/initiative.js` and `src/pages/explore.js` — initiative `category`/`title_*`/`description_*` interpolations.
  - `src/pages/training.js` — course titles/descriptions in cards.
  - `src/js/notifications.js` — the toast `title`/`body` values (lines ~15-23).
  - `src/pages/profile.js`, `src/pages/admin.js` — any interpolated profile/name/phone values in rendered rows.
  - Add `import { esc } from '<correct-relative-path>/utils.js'` to each file (from `src/pages/` it is `../js/utils.js`; from `src/js/notifications.js` it is `./utils.js`).

- [ ] **Step 3: Verify**
  - The inventory grep from Step 1 must now show only intentionally-static templates with no `${...}` user data (a manual read of each wrapped line).
  - `node build.js`; suites green. Confirm no behavior change on pages that render our own seed data (seeds don't contain `<>&`, but the sweep protects real inputs).

- [ ] **Step 4: Commit**

```bash
git add src/pages/volunteers.js src/pages/initiative.js src/pages/explore.js src/pages/training.js src/pages/profile.js src/pages/admin.js src/js/notifications.js
git -c user.name=anouar -c user.email=anouar@local commit -m "fix(security): esc() sweep on user/DB innerHTML render sites"
```

---

### Task 15: README Deploy section + `run_live.js` smoke ladder

**Files:**
- Modify: `README.md`
- Create: `tests/run_live.js`

**Interfaces:**
- Consumes: everything above (gateway, ledger, RPCs, externalized scripts).
- Produces: documented deploy checklist + a manual real-credential smoke script for the DoD ladder.

- [ ] **Step 1: Write `tests/run_live.js`** — a self-contained script (node, no deps) that reads `.env` (`NEON_AUTH_URL`, `NEON_API_URL`, `NEON_ANON_KEY`, `SERVICE_ROLE_KEY`, `APP_ORIGIN`) and runs the Phase-A ladder against a deployed origin:
  1. `signup` a throwaway email → expect 200
  2. `signin` same user → expect session
  3. `getSession` expiry refresh → expect access token rotation
  4. guest read of a public pillar page list (`clubs` select, anon apikey) → expect 200
  5. join a club via `insert club_members` (user JWT) → expect ok, then `get_impact_summary` shows `club_join` +100
  6. `record_quiz_attempt(passed:true)` → summary shows `awareness_quiz` +50 once; repeat → still +50
  7. `profiles` update → expect 403 (lock active)
  8. `award_points_admin` under a member JWT → expect 403; under admin → ok
  9. print PASS/FAIL summary and exit code.
  Use `fetch` (Node 18+), `AbortSignal.timeout`, and a `.env` reader (no dotenv dependency). Print clear steps with response codes.

- [ ] **Step 2: Write the README "Deploy (Grade C)" section** (append before any footer) covering:
  - Required env vars and where each is set (Vercel project env + `.env.example` walkthrough).
  - Applying `sql/schema.sql` to the Neon database (SQL editor / migrate step) and the note that the Phase A block is additive for any DB already at the Task-5 baseline.
  - The `build.js` output contract (`public/`), `vercel.json` rewrites/CSP, and that no secrets are in the build.
  - The pre-flight ladder: run the three suites, then `node tests/run_live.js` against staging.

- [ ] **Step 3: Verify** — `node tests/run_live.js` prints a clear "env not set — skipping" message without crashing when `.env` is absent (used as a dry-run in CI/local); the three suites stay green.
- [ ] **Step 4: Commit**

```bash
git add README.md tests/run_live.js
git -c user.name=anouar -c user.email=anouar@local commit -m "docs(deploy): grade-c deploy checklist + run_live smoke ladder"
```

---

## Self-Review Notes

- **Spec coverage:** A1 → Tasks 4-9 (external scripts, CSP hold, full sweep). A2 → Tasks 2 (schema parity/club_members.status/CHECKs), 10 (notifications empty-state), 11 (stats), 12 (certificate), 13 (filters). A3 → Tasks 2 + 3 + 10 (ledger, RPCs, triggers, gateway lock, frontend removal). A4 → Tasks 1 + 14 + 15 (esc, sweep, audit viewer deferred to Phase B as spec'd, run_live, README). Remaining spec gaps tracked for the Phase B plan: notification write-triggers on invite/session/consultation, badge/leaderboard wiring, moderation, password reset.
- **Placeholder check:** every step is either explicit code, an exact file/line target, or a verifiable command with its expected output. No "similar to Task N"; the extraction contract is defined once (Task 4) and each task restates the concrete output file.
- **Type consistency:** `record_quiz_attempt(p_content_id, p_passed, p_score)` used identically in schema (Task 2), mock (Task 2), and awareness.js (Task 10). `get_impact_summary(p_user_id)` and `get_platform_stats()` names match across schema, mock, and consumers. `try_award_points` is the single award path everywhere. `esc` matches between Task 1 and Task 14.