# Impact Stories & Points Shop — Design

**Date:** 2026-09-19
**Status:** Approved in chat; spec for review
**Design file:** `docs/superpowers/specs/2026-09-19-impact-stories-and-points-shop-design.md`

## Context

- `pages/volunteers.html` is a single page holding seven sections (heatmap, sessions,
  signup, create, stories, squads, leaderboard, queue). Users experience it as a
  "big dashboard / monitoring system" instead of a focused tool.
- "لقطات الأثر" (Impact Stories) is a sticker/caption card feed (24h expiry, `likes[]`,
  gradient palettes). Users want a Snapchat-style experience, which needs the whole
  screen.
- The points economy already exists: `impact_points` on `profiles`, only mutated via
  `try_award_points` (+100 club, +200 training, +120 school visit, +50 quiz,
  +volunteering, admin adjustments), ledgered in `points_ledger` (function-only writes,
  RLS "read own").

## Goals

1. Break the volunteers wall into three focused destinations.
2. Deliver a Snapchat-style impact stories experience on its own page.
3. Add a points shop ("متجر النقاط") with a mixed catalog and admin fulfillment,
   backed by the existing points ledger with atomic redemption.

## Non-Goals

- Photos/videos in stories (sticker cards stay), replies/DMs, sounds.
- Per-author grouping in the story player (flat newest-first queue; each author
  typically has one snap).
- Forum/chat media uploads (text only), private 1:1 DMs.
- Fulfillment/delivery tracking for physical rewards.

---

## Part A — Information architecture split

### A1. `volunteers.html` → "المهام التطوعية" (missions hub)

Remains: emergency strip, available sessions + signup, founder pending-approval queue,
create-session (founders). Removed from the page: heatmap, stories, squads, leaderboard.

- Container/dead-code cleanup: drop `renderHeatmap`, `wilayaHeat`, `renderStories`,
  `openStoryViewer`, `renderSquads`, `renderLeaderboard`, `engagementScore`, story
  helpers, and the corresponding HTML sections + inline story/squad/leaderboard CSS.
- `init()` no longer mounts `heat-map`/`stories-grid`/`squads-grid`/`lb-grid` skeletons.

### A2. New `impact.html` → "الأثر والمنافسة"

Sections: OSM wilaya heatmap (existing `renderWilayaMap` + `wilayaHeat` logic), impact
stats (total hours, approved sessions, volunteers engaged), squads (wilaya groups),
leaderboard (`engagementScore` + `renderLeaderboard`).

- New page `pages/impact.html` + `src/pages/impact.js`, i18n keyed and styled in line
  with the existing design system (glass, borderless, flat shadows).
- Guards: `requireAuth({ guests: true })` like today; guests see the public read-only
  view.

### A3. New `stories.html` → "لقطات الأثر" (Snapchat)

Home page for the snap experience. Data model unchanged.

**Inbox ring-avatar row** (`renderStories`):
- First ring = "لقطتك +" → toggles the existing composer (story-wilaya select, sticker
  picker, caption, submit).
- Then one circular ring per live snap: sticker art as the avatar, gradient ring
  (unviewed = pink/cyan, viewed = dim/gray), wilaya + hours-left label.
- Seen state in `localStorage` (`athar_seen_stories`, keyed by story id) — no schema
  change; cleared/expired entries pruned with `storyAlive`.

**Full-screen snap player** (`openStoryViewer`):
- Near-black immersive overlay; snap fills the viewport, gradient background from the
  story palette, big sticker art, caption near the bottom.
- Segmented progress bars top (one per queued snap), animated fill, ~6s each; the
  queue is the current newest-first flat list.
- Auto-advance; pointer-down pauses the timer, pointer-up resumes.
- Tap right 40% → next snap; tap left 40% → previous.
- Swipe down or X button → close.
- Double-tap anywhere → like toggle via existing `like_volunteer_story` RPC; heart +
  count displayed; like re-renders the inbox ring.
- Mark the snap seen in `localStorage` when viewed.
- Accessibility: `aria-label`s on the close, X, and like controls.

**Reuse:** stories helpers (`storyAlive`, `storyHoursLeft`, `STORY_PALETTES`,
`stickerHtml`, `liveHeart`) move into `src/js/stories.js` shared module imported by
`stories.html` (they no longer live on the volunteers page).

---

## Part B — Points shop ("متجر النقاط")

### B1. Schema (`sql/schema.sql`)

```sql
create table public.shop_rewards (
    id uuid primary key default gen_random_uuid(),
    title_ar text not null,
    title_fr text not null,
    title_en text not null,
    description_ar text not null default '',
    description_fr text not null default '',
    description_en text not null default '',
    cost_points integer not null check (cost_points > 0),
    kind text not null check (kind in ('digital','physical')),
    stock integer not null default 0,          -- -1 = unlimited
    icon text not null default 'gift',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.shop_redemptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id),
    reward_id uuid not null references public.shop_rewards(id),
    cost_points integer not null,
    status text not null default 'pending'
        check (status in ('pending','fulfilled','cancelled')),
    redeem_code text,                            -- unique code for digital kind
    created_at timestamptz not null default now(),
    fulfilled_at timestamptz
);
```

**RLS:**
- `shop_rewards`: `select` for all authenticated users (UI filters `is_active`);
  insert/update/delete via `is_platform_admin()` (admin edits everything, including
  delete).
- `shop_redemptions`: `select` own rows; admin can select all, edit any field (status,
  cost, code), and delete rows. Direct redemption inserts remain RPC-only for ordinary
  users to keep the ledger atomic.

### B2. RPCs

```sql
create or replace function public.redeem_reward(p_reward_id uuid)
returns jsonb  -- {ok:true, code?} or raises SQLSTATE 'P0001' with message
```
Security definer. Steps (single transaction):
1. Load reward; missing/inactive → error `invalid_reward`.
2. If `stock >= 0 and stock = 0` → error `out_of_stock`.
3. Check `profiles.impact_points >= cost_points` for `auth.uid()` → else
   `insufficient_points`.
4. Decrement stock when limited; deduct points from profile; insert
   `points_ledger(user_id, amount = -cost_points, reason='shop_redeem', ...)`; insert
   `shop_redemptions(status='pending')`.
5. If `kind='digital'`, generate unique code `ATH-` + 6 random alphanumeric, write
   `redeem_code`, return it.

```sql
create or replace function public.fulfill_redemption(p_redemption_id uuid, p_status text)
```
Security definer, admin-only (`is_platform_admin()`). Validates status in
(`fulfilled`,`cancelled`); sets `status`, `fulfilled_at = now()` when fulfilled.

### B3. Mock parity (`src/js/neon.js`)

- Mock tables `shop_rewards` (seeded ~6 rewards: digital badge, certificate, training
  ticket, physical kit, hoodie, event tote) and `shop_redemptions`.
- Mock RPC handlers `redeem_reward` / `fulfill_redemption` reproducing every validation
  rule and the ledger deduction, exactly mirroring the SQL contract (same error strings
  propagated through `neon.rpc`).
- Mock gateway write paths already cover table writes for admin reward management.

### B4. Pages

**`pages/shop.html` + `src/pages/shop.js`** (requires auth):
- Balance card (`impact_points` + gradient).
- Catalog grid: icon, title (lang), description, cost, stock ("out of stock" /
  "unlimited"), buy button (disabled when insufficient/out of stock).
- Redeem flow: confirm → `neon.rpc('redeem_reward', ...)` → toast; digital shows the
  code in a modal immediately; physical shows "pending".
- "طلباتي" section: my redemptions with status badges; digital rows reveal the code.
- i18n AR/FR/EN.

**`pages/admin.html` + `src/pages/admin.js`**:
- New tab "المتجر": full control — rewards management (add/edit/delete/deactivate,
  cost/kind/stock/icon) and redemptions (edit status/cost/code, fulfil/cancel, delete
  any redemption row).
- Points adjustment control per user (positive/negative via existing
  `award_points_admin`) surfaced in the shop tab so admins can fix balances.
- `setupTabs()` picks up the new `.tab-btn[data-tab="shop"]`.

### B5. Icons

Add `gift` to `PATHS` in `src/js/icons.js`; reuse existing `award`, `crown`, `box`,
`sparkle`, `book`, `health`, `heartFill` as reward icons.

### B6. Navigation (`src/js/layout.js`)

- Sidebar (desktop + mobile drawer): add top-level "اللقطات" (stories) and
  "متجر النقاط" (shop) links.
- "الأثر" (impact) goes under the existing "المزيد" submenu to control clutter.
- i18n keys `nav_stories`, `nav_impact`, `nav_shop` in AR/FR/EN (Amazigh → AR fallback).

### B7. i18n

New keys in `TRANSLATIONS` (AR/FR/EN, symmetric): shop page labels, reward actions,
status badges (pending/fulfilled/cancelled), confirm/insufficient/out-of-stock notices,
store admin tab labels, nav keys.

---

## Part C — Club forums + global chat

Threads per club + one app-wide global chat. Delivery is client polling (~4s) — no
websockets/infra; works on serverless + demo/mock mode.

### C1. Schema (`sql/schema.sql`)

Also add a club moderatorship now that forums need one (clubs have no creator today):

```sql
alter table public.clubs add column created_by uuid references public.profiles(id);
alter table public.club_members add column role text not null default 'member'
    check (role in ('member','moderator'));
-- the first member of a club is auto-promoted to moderator (club "founder")
-- via a BEFORE INSERT trigger on club_members when the club has no moderator yet.
```

Content tables:

```sql
create table public.club_threads (
    id uuid primary key default gen_random_uuid(),
    club_id uuid not null references public.clubs(id) on delete cascade,
    author_id uuid not null references public.profiles(id) on delete cascade,
    title text not null check (char_length(trim(title)) between 3 and 120),
    body text not null check (char_length(trim(body)) <= 4000),
    is_pinned boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.thread_replies (
    id uuid primary key default gen_random_uuid(),
    thread_id uuid not null references public.club_threads(id) on delete cascade,
    author_id uuid not null references public.profiles(id) on delete cascade,
    body text not null check (char_length(trim(body)) <= 2000),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    body text not null check (char_length(trim(body)) between 1 and 1000),
    created_at timestamptz not null default now()
);
```

**RLS / permissions:**

| Table | Read | Insert | Edit / Delete |
|---|---|---|---|
| `club_threads` | all authenticated | club member | own rows; club moderator; admin |
| `thread_replies` | all authenticated | club member | own rows; club moderator; admin |
| `chat_messages` | authenticated readers (guests read-only feed) | any authenticated | own rows; admin (no moderation role needed for global) |

Helpers: `is_club_member(bigint)`-style predicate via subquery on `club_members`;
`is_club_moderator` = own `club_members.role = 'moderator'` or `is_platform_admin()`.
Admin keeps the "edit anything" guarantee across all forum/chat content via
`is_platform_admin()`.

### C2. Pages & client

**`pages/forum.html` + `src/pages/forum.js`** (club forums):
- Club picker list (reuse `clubs` fetch). Selecting a club shows its threads
  (title, author, reply count, pinned first).
- Thread detail view: body + replies (newest first), reply composer.
- Create-thread composer (title + body), only when `is_club_member(user, club)`.
- Posting via existing gateway (`neon.from('club_threads').insert(...)` /
  `thread_replies`); RLS enforces membership. Reads poll every ~4s and when opening a
  thread.
- Light client-side moderation affordances: edit/delete controls rendered only for
  owners, club moderators, and admins (enforced server-side by RLS).
- On a reply to a thread you authored, insert a `notifications` row (reuse existing
  table/`create_notification` shape) — lightweight, best-effort in demo mode.

**`pages/global.html` + `src/pages/global.js`** (global chat):
- Full-height live feed, newest at bottom, auto-scroll on new messages, messages show
  author name + avatar ring + time.
- Composer posts via `chat_messages` insert; feed polls `chat_messages` (limit ~50,
  desc) every 4s and dedupes by id.
- Guests: read-only feed (`requireAuth({ guests: true })`; composer hidden for guests).
- Client pulls author names from the `profiles` fetch already loaded.

### C3. Navigation & i18n

- Nav: "منتدى الأندية" (forum) and "المحادثة العامة" (global) as top-level links;
  "الأثر" (impact) and "متجر النقاط" (shop) added as planned in B6. Sidebar stays
  under the clutter budget by folding impact under "المزيد".
- i18n keys (AR/FR/EN symmetric): forum nav, thread/reply composers, empty states,
  member-only guard notice, global chat labels, statuses, admin moderation labels.

---

## Error handling

| Case | Behavior |
|---|---|
| No session on shop page | `requireAuth()` redirects |
| Insufficient points | disabled buy + toast `shop_insufficient` |
| Out of stock | disabled buy + `out_of_stock` badge; RPC still guards |
| Reward inactive/missing | not rendered; RPC returns `invalid_reward` |
| Mock/demo mode | same UX via mock RPC parity |
| RPC offline | toast `chat_offline`-style generic error, balance unchanged |

## Testing & verification

- `node --check` on all changed/created JS.
- `node tests/run_tests.js` — extend with **Phase 4D mock shop parity**:
  redeem deducts balance; insufficient points rejects; out-of-stock rejects; stock
  decrements; digital redemption mints a unique `ATH-` code; duplicate/invalid reward
  rejects; admin fulfill toggles status; non-admin fulfill rejected; ledger write
  function-only invariant holds (no direct profile point edits).
- Extend with **Phase 4E mock forum/chat parity**: member can post thread/reply,
  non-member insert rejected; edit/delete own rows; club moderator + admin can edit/delete
  any row in their club; global chat insert works for authenticated users; guests blocked;
  author notified on new reply.
- `node tests/api_test.js`, `node tests/auth_contract_test.js`, `node tests/ai_test.js` —
  keep green; extend ai_test structurally if needed (e.g., shop page CSP: no inline
  handlers, mirrors other pages).
- `node build.js`, then smoke checks against the detached `:3000` server
  (`--env-file=.env`): forum.html/global.html/shop.html/stories.html/impact.html/
  volunteers.html served, new JS/CSS present.
- Commit (git -c user.name=anouar -c user.email=anouar@local, Conventional Commits).

## Sequencing

1. Shop schema + RPCs + mock parity + tests (foundational, independent).
2. Shop page + admin store tab (full edit rights) + nav + i18n.
3. Forum/chat schema + mock parity + tests (club moderator trigger + RLS).
4. Forum page + global chat page + nav + i18n.
5. Volunteers split: new `impact.html`, slim `volunteers.html`, dedicated `stories.html`
   with the Snapchat inbox/player, shared `stories.js`.
6. Full verification pass + commit.