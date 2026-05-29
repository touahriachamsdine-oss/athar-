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

**Designed for Algiers Smart City 2035 & Youth Digital Empowerment.** 🇩🇿
