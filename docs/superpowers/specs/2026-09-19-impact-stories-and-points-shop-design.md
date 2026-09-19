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
- Reward catalog beyond admin CRUD + stock + fulfill (no delivery tracking).

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
  insert/update/delete via `is_platform_admin()`.
- `shop_redemptions`: `select` own rows; admin can select all, and update status via the
  RPC only (no direct table writes for users).

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
- New tab "المتجر": rewards management (add/edit/deactivate, cost/kind/stock/icon) and
  redemptions queue (fulfill/cancel). Uses existing gateway-style writes + new RPC.
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
- `node tests/api_test.js`, `node tests/auth_contract_test.js`, `node tests/ai_test.js` —
  keep green; extend ai_test structurally if needed (e.g., shop page CSP: no inline
  handlers, mirrors other pages).
- `node build.js`, then smoke checks against the detached `:3000` server
  (`--env-file=.env`): shop.html/stories.html/impact.html/volunteers.html served, new
  JS/CSS present.
- Commit (git -c user.name=anouar -c user.email=anouar@local, Conventional Commits).

## Sequencing

1. Shop schema + RPCs + mock parity + tests (foundational, independent).
2. Shop page + admin store tab + nav + i18n.
3. Volunteers split: new `impact.html`, slim `volunteers.html`, dedicated `stories.html`
   with the Snapchat inbox/player, shared `stories.js`.
4. Full verification pass + commit.