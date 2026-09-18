# Athar — أثر 🚀

Futuristic Premium Digital Platform for Youth Hostels, Scientific/Cultural Club Development, and Youth Community Initiatives in Algeria with a Neo-Flat borderless dark aesthetic and physical motion-based tactile feedback.

## 🎯 Platform Objectives
1. **Youth Hostel Transformation**: Elevating Algerian youth hostels into vibrant scientific, cultural, and community learning hubs.
2. **Scientific & Cultural Clubs**: Supporting youth clubs, cultural initiatives, and innovative tech collaborations.
3. **Youth Empowerment**: Providing youth (ages 12-30) with modern digital tools to collaborate, grow, and display community impact.
4. **Prevention & Awareness**: Direct focus on raising awareness about health, digital literacy, and active citizenship.

## ⚡ Technical Stack & Architecture
- **Design Paradigm**: **Neo-Flat Borderless Glassmorphic** UI system. Curated color palette (Crimson Pink `#FF2A6D`, Cyber Cyan `#05D9E8`, Amethyst Purple `#A300FF`, and Solar Amber `#FFBE0B`) with physical spring motion animations (`cubic-bezier` curves) and zero-border aesthetics.
- **Backend Infrastructure**: Custom serverless RESTful **Neon PostgreSQL Client** (`neon.js`) executing dynamic PostgREST operations directly without bloated vendor libraries.
- **Real-time Engine**: Long-polling serverless heartbeat system (`realtime.js`) built directly on top of the Neon client for robust sync.
- **PWA Capabilities**: Full service-worker offline caching capability, standard web manifest support, and responsive layouts.
- **Development & Routing**: Integrated Node.js local dev server (`server.js`) simulating Vercel's edge routing rewrites for frictionless SPA-like navigation.

## 🛠️ Local Development

### 1. Database Seeding
Ensure you have a PostgreSQL or Neon database. You can execute `sql/schema.sql` inside your query editor to create standard profiles, initiatives, members, tasks, and notifications.

### 2. Configuration
Create/update `src/js/config.js` or set environment variables:
```bash
NEON_AUTH_URL="https://your-neon-auth-instance.neonauth.c-3.us-east-2.aws.neon.tech/neondb/auth"
NEON_API_URL="https://your-neon-api-instance.apirest.c-3.us-east-2.aws.neon.tech/neondb/rest/v1"
```

### 3. Build & Run
To run the project locally:
```bash
# Install development helper dependencies (if any)
npm install

# Run the project build script
node build.js

# Start the dev server
node server.js
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## 📁 Directory Structure
- `pages/`: Clean SPA views (index, dashboard, explore, initiative, admin, profiles, tasks, etc.).
- `src/css/`: Advanced Neo-Flat borderless token systems (`variables.css`, `glass.css`, `components.css`, `animations.css`).
- `src/js/`: Modular ES modules (`neon.js`, `auth.js`, `i18n.js`, `realtime.js`, `layout.js`).
- `sql/`: PostgreSQL database schema source code.
- `public/`: Output build folder targeted by Vercel deployments.

## 🚀 Deploy (Grade C & Phase A Production Correctness)

### 1. Environment Variables Configuration
Configure the following environment variables in your Vercel project settings (or copy `.env.example` to `.env` for local staging):
- **Client-Safe (Injected during build):**
  - `NEON_AUTH_URL`: GoTrue authentication service endpoint (`.../neondb/auth`)
  - `NEON_API_URL`: PostgREST data API endpoint (`.../neondb/rest/v1`)
  - `NEON_ANON_KEY`: Neon anonymous API key for public read operations
- **Server-Only (Never exposed to client / static build):**
  - `SERVICE_ROLE_KEY`: Service role key for bypass operations and audit logging
  - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`: Upstash REST Redis for distributed rate limiting (optional; graceful fallback if absent)
  - `APP_ORIGIN`: Allowed application origin for CORS headers (`https://your-domain.vercel.app`)

### 2. Database Schema (`sql/schema.sql`)
1. Open your Neon PostgreSQL console / SQL Editor.
2. Execute `sql/schema.sql` to apply all tables, RLS policies, security-definer RPCs (`try_award_points`, `record_quiz_attempt`, `get_impact_summary`, `get_platform_stats`, `award_points_admin`, `update_profile_settings`, volunteer session lifecycle functions), and triggers.
3. *Note:* The Phase A database block is fully additive for any database already initialized at the Task-5 baseline.

### 3. Build Contract & Vercel Security (`vercel.json`)
- **Build Command:** `node build.js` bundles static assets into `public/`, securely injecting active Neon configuration values.
- **CSP & Headers (`vercel.json`):** Enforces strict Content Security Policy (`connect-src` restricted to Neon endpoints), X-Content-Type-Options `nosniff`, and `no-referrer` policies. No secrets are ever included in the static build output.

### 4. Pre-Flight Verification & Live Smoke Ladder
Before promoting to production, execute the automated test suites and the manual live smoke script:
```bash
# Run the 3 automated test suites (120 + 25 + 18 tests = 163 total assertions)
node tests/run_tests.js
node tests/api_test.js
node tests/auth_contract_test.js

# Run the project build
node build.js

# Run live production smoke ladder against staging/production
# (Safely skips with exit 0 if .env is absent or unconfigured)
node tests/run_live.js
```

**Designed for Algiers Smart City 2035 & Youth Digital Empowerment.** 🇩🇿
