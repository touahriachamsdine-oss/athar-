/**
 * Athar Platform Automated Test Suite
 * Fully automated diagnostics for rebrand verification, config validity,
 * dictionary completeness, and database client accuracy.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define beautiful terminal styling
const PINK = '\x1b[38;5;197m';
const CYAN = '\x1b[36m';
const PURPLE = '\x1b[35m';
const GREEN = '\x1b[32m';
const GOLD = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

console.log(`\n${PINK}${BOLD}================================================================${RESET}`);
console.log(`${CYAN}${BOLD}                 أثر — ATHAR DIGITAL YOUTH PLATFORM             ${RESET}`);
console.log(`${PURPLE}${BOLD}                     Automated Diagnostic Suite                 ${RESET}`);
console.log(`${PINK}${BOLD}================================================================${RESET}\n`);

let testCount = 0;
let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
    testCount++;
    if (condition) {
        passedCount++;
        console.log(`  ${GREEN}✓${RESET} ${message}`);
    } else {
        failedCount++;
        console.log(`  ${PINK}✗ [FAILED]${RESET} ${message}`);
    }
}

async function runSuite() {
    try {
        // --- 1. MOCK ENVIRONMENT FOR ES MODULES ---
        console.log(`${BOLD}${CYAN}[Phase 1: Bootstrapping Mock Environment]${RESET}`);
        
        global.localStorage = {
            store: { 'athar_lang': 'ar' },
            getItem(key) { return this.store[key] || null; },
            setItem(key, val) { this.store[key] = val; }
        };
        
        global.document = {
            documentElement: { lang: 'ar', dir: 'rtl' },
            querySelectorAll() { return []; },
            createElement() {
                return { style: {}, prepend() {} };
            },
            body: {
                prepend() {}
            },
            getElementById() {
                return { onclick: null, onchange: null };
            }
        };
        
        global.window = global;
        
        // Mock fetch for database client test
        let lastFetch = null;
        global.fetch = async (url, options = {}) => {
            lastFetch = { url, options };
            return {
                ok: true,
                json: async () => ([{ id: 'mock_id', status: 'success' }])
            };
        };

        // --- 2. CONFIG SANITY CHECKS ---
        console.log(`\n${BOLD}${CYAN}[Phase 2: Checking Configuration Integrity]${RESET}`);
        const configModule = await import('../src/js/config.js');
        const APP_CONFIG = configModule.APP_CONFIG;
        
        assert(APP_CONFIG !== undefined, 'APP_CONFIG is defined');
        assert(APP_CONFIG.name.ar === 'أثر', 'App Arabic Name is rebranded to أثر');
        assert(APP_CONFIG.name.en === 'Athar', 'App English Name is rebranded to Athar');
        assert(APP_CONFIG.wilayas.length === 58, 'Algerian Wilayas list contains exactly 58 items');
        assert(APP_CONFIG.categories.length === 6, 'Youth Categories has exactly 6 options');
        assert(APP_CONFIG.steps.length === 5, 'Empowerment journey has exactly 5 steps');

        assert(configModule.VOLUNTEER_POINTS_PER_HOUR === 10, 'Volunteer points rate is 10/hour');
        assert(configModule.VOLUNTEER_MAX_SESSION_POINTS === 50, 'Volunteer session points cap is 50');

        // --- 3. DICTIONARY & I18N CHECKS ---
        console.log(`\n${BOLD}${CYAN}[Phase 3: Validating Trilingual Translations]${RESET}`);
        const i18nModule = await import('../src/js/i18n.js');
        const TRANSLATIONS = i18nModule.TRANSLATIONS;
        
        assert(TRANSLATIONS.ar !== undefined, 'Arabic dictionary is present');
        assert(TRANSLATIONS.fr !== undefined, 'French dictionary is present');
        assert(TRANSLATIONS.en !== undefined, 'English dictionary is present');

        // Symmetry Check: Every key in Arabic must have a translation in French and English
        const arKeys = Object.keys(TRANSLATIONS.ar);
        const frKeys = Object.keys(TRANSLATIONS.fr);
        const enKeys = Object.keys(TRANSLATIONS.en);

        assert(arKeys.length === frKeys.length && frKeys.length === enKeys.length, 
            `Dictionary keys are symmetric (AR: ${arKeys.length}, FR: ${frKeys.length}, EN: ${enKeys.length})`);

        let missingKeys = 0;
        arKeys.forEach(key => {
            if (!TRANSLATIONS.fr[key]) missingKeys++;
            if (!TRANSLATIONS.en[key]) missingKeys++;
        });
        assert(missingKeys === 0, 'No missing translation keys across dictionaries');

        // Check for any legacy reference to Moubadara in dictionaries
        let legacyCount = 0;
        ['ar', 'fr', 'en'].forEach(lang => {
            Object.values(TRANSLATIONS[lang]).forEach(val => {
                if (val.toLowerCase().includes('moubadara') || val.includes('مبادرة المنصة')) {
                    legacyCount++;
                }
            });
        });
        assert(legacyCount === 0, 'Zero legacy references to "Moubadara" found in dictionaries');

        // --- 4. NEON DATABASE CLIENT CHECKS ---
        console.log(`\n${BOLD}${CYAN}[Phase 4: Testing Neon Database client API]${RESET}`);
        const neonModule = await import('../src/js/neon.js');
        const neon = neonModule.neon;

        // Mock token authentication
        neon.setToken('auth_token_secret');

        // Test GET query builder (reads stay direct via PostgREST with apikey)
        await neon.from('profiles').select().id('user_456');
        assert(lastFetch !== null, 'Fetch called for query select.id');
        assert(lastFetch.url.endsWith('/profiles?id=eq.user_456'), 'Correct query parameter for ID filter');
        assert(lastFetch.options.headers['Authorization'] === 'Bearer auth_token_secret', 'Correct token sent in header');
        assert(lastFetch.options.headers['apikey'] !== undefined, 'apikey header sent on coordinate read requests');

        // Writes now route through the /api/action gateway
        await neon.from('clubs').insert({ name: 'Robotics Club' });
        assert(lastFetch.url === '/api/action', 'Writes route through /api/action gateway');
        assert(lastFetch.options.method === 'POST', 'Gateway request is POST');
        let gw = JSON.parse(lastFetch.options.body);
        assert(gw.action === 'insert', 'Gateway body carries action=insert');
        assert(gw.table === 'clubs', 'Gateway body carries table=clubs');
        assert(gw.payload.name === 'Robotics Club', 'Gateway body carries insert payload');
        assert(gw.token === 'auth_token_secret', 'Gateway body carries auth token');

        await neon.from('profiles').update({ xp: 100 }, 'user_789');
        gw = JSON.parse(lastFetch.options.body);
        assert(gw.action === 'update' && gw.table === 'profiles' && gw.id === 'user_789', 'Gateway update carries table+id');
        assert(gw.payload.xp === 100, 'Gateway update carries payload');

        await neon.from('notifications').delete('notif_111');
        gw = JSON.parse(lastFetch.options.body);
        assert(gw.action === 'delete' && gw.table === 'notifications' && gw.id === 'notif_111', 'Gateway delete carries table+id');

        // RPC routed through gateway
        await neon.rpc('approve_session', { p_session_id: 'vs_abc' });
        gw = JSON.parse(lastFetch.options.body);
        assert(gw.action === 'rpc' && gw.fn === 'approve_session', 'RPC routed through gateway with fn');
        assert(gw.payload.p_session_id === 'vs_abc', 'RPC payload preserved');

        // --- 4B. MOCK RPC VOLUNTEER LOGIC (parity with DB security-definer rules) ---
        console.log(`\n${BOLD}${CYAN}[Phase 4B: Mock RPC Volunteer Logic]${RESET}`);
        const store = global.localStorage.store;
        store['athar_mock_mode'] = 'true';
        store['neon_session'] = JSON.stringify({ user: { id: 'member_user_1' } });
        store['athar_mock_db_profiles'] = JSON.stringify([
            { id: 'member_user_1', role: 'member', impact_points: 10 },
            { id: 'member_user_2', role: 'member', impact_points: 0 },
            { id: 'admin_user_id', role: 'superadmin', impact_points: 0 }
        ]);
        store['athar_mock_db_initiative_members'] = JSON.stringify([
            { initiative_id: 'init_x', user_id: 'member_user_1', role: 'founder' }
        ]);
        const futureISODate = new Date(Date.now() + 86400000).toISOString();
        const futureEndISODate = new Date(Date.now() + 86400000 + 8 * 3600000).toISOString();
        const pastISODate = new Date(Date.now() - 86400000).toISOString();
        store['athar_mock_db_volunteer_sessions'] = JSON.stringify([
            { id: 'vs_open', initiative_id: 'init_x', status: 'approved', start_at: futureISODate, end_at: futureEndISODate, capacity: 3, created_by: 'admin_user_id' },
            { id: 'vs_full', initiative_id: 'init_x', status: 'approved', start_at: futureISODate, end_at: futureISODate, capacity: 1, created_by: 'admin_user_id' },
            { id: 'vs_pending', initiative_id: 'init_x', status: 'pending', start_at: futureISODate, end_at: futureISODate, capacity: 3, created_by: 'admin_user_id' },
            { id: 'vs_past', initiative_id: 'init_x', status: 'approved', start_at: pastISODate, end_at: pastISODate, capacity: 3, created_by: 'admin_user_id' }
        ]);
        store['athar_mock_db_volunteer_signups'] = JSON.stringify([
            { id: 'g1', session_id: 'vs_full', volunteer_id: 'member_user_2', status: 'registered', points_awarded: 0 }
        ]);

        let mr = await neon.rpc('signup_to_session', { p_session_id: 'vs_open', p_volunteer_id: 'member_user_1' });
        assert(!mr.error && mr.data.status === 'registered', 'Volunteer registers to an approved future session');

        mr = await neon.rpc('signup_to_session', { p_session_id: 'vs_open', p_volunteer_id: 'member_user_1' });
        assert(!mr.error && mr.data.status === 'registered', 'Re-registration is idempotent');

        const openSeats = JSON.parse(store['athar_mock_db_volunteer_signups']).filter(x => x.session_id === 'vs_open').length;
        assert(openSeats === 1, 'Duplicate signup does not consume extra seats');

        mr = await neon.rpc('signup_to_session', { p_session_id: 'vs_full', p_volunteer_id: 'member_user_1' });
        assert(mr.error && mr.error.code === 'conflict', 'Capacity-full session blocks signup');

        mr = await neon.rpc('signup_to_session', { p_session_id: 'vs_pending', p_volunteer_id: 'member_user_1' });
        assert(mr.error && mr.error.code === 'validation', 'Pending session blocks signup');

        mr = await neon.rpc('signup_to_session', { p_session_id: 'vs_past', p_volunteer_id: 'member_user_1' });
        assert(mr.error && mr.error.code === 'validation', 'Ended session blocks signup');

        mr = await neon.rpc('create_volunteer_session', { p_payload: { initiative_id: 'init_other', title_en: 'X', location: 'L', start_at: futureISODate, end_at: futureISODate, capacity: 2 } });
        assert(mr.error && mr.error.code === 'forbidden', 'Non-founder cannot create session for a foreign initiative');

        let createdSessionId = null;
        mr = await neon.rpc('create_volunteer_session', { p_payload: { initiative_id: 'init_x', title_en: 'Cleanup Day', location: 'Alger', start_at: futureISODate, end_at: futureISODate, capacity: 2 } });
        assert(!mr.error && mr.data[0].status === 'pending', 'Founder creates a pending session');
        createdSessionId = mr.data[0].id;

        mr = await neon.rpc('cancel_signup', { p_session_id: 'vs_open', p_volunteer_id: 'member_user_1' });
        assert(!mr.error && mr.data.status === 'cancelled', 'Volunteer cancels registration');

        mr = await neon.rpc('signup_to_session', { p_session_id: 'vs_open', p_volunteer_id: 'member_user_1' });
        assert(!mr.error && mr.data.status === 'registered', 'Cancelled volunteer can re-register');

        mr = await neon.rpc('mark_attendance', { p_session_id: 'vs_open', p_volunteer_id: 'member_user_1', p_attended: true });
        assert(!mr.error && mr.data.status === 'attended', 'Founder marks attendance');

        mr = await neon.rpc('complete_session', { p_session_id: 'vs_open' });
        assert(!mr.error && mr.data.status === 'completed' && mr.data.attended === 1, 'Completion credits the attended volunteer');

        const memberProfile = JSON.parse(store['athar_mock_db_profiles']).find(x => x.id === 'member_user_1');
        assert(memberProfile.impact_points === 10 + 50, 'Points awarded once on completion (capped at 50)');

        mr = await neon.rpc('complete_session', { p_session_id: 'vs_open' });
        assert(mr.error && mr.error.code === 'validation', 'Second completion is blocked (idempotent)');

        store['neon_session'] = JSON.stringify({ user: { id: 'admin_user_id' } });
        mr = await neon.rpc('approve_session', { p_session_id: createdSessionId });
        assert(!mr.error && mr.data.status === 'approved', 'Admin approves pending session');

        store['neon_session'] = JSON.stringify({ user: { id: 'member_user_1' } });
        mr = await neon.rpc('approve_session', { p_session_id: createdSessionId });
        assert(mr.error && mr.error.code === 'forbidden', 'Non-admin cannot approve sessions');

        store['athar_mock_mode'] = 'false';

        // --- 5. BUILD & COMPILED ASSETS VERIFICATION ---
        console.log(`\n${BOLD}${CYAN}[Phase 5: Verifying Output Build & Asset Compilation]${RESET}`);
        
        console.log('  Running `node build.js` dynamically...');
        execSync('node build.js', { stdio: 'ignore' });
        
        const publicDir = path.join(__dirname, '../public');
        assert(fs.existsSync(publicDir), 'Vercel build output folder `public/` created successfully');

        const indexHtml = path.join(publicDir, 'pages/index.html');
        assert(fs.existsSync(indexHtml), 'Homepage index.html exists in build output');

        const logoSvg = path.join(publicDir, 'public/logo.svg');
        assert(fs.existsSync(logoSvg), 'Logo asset is correctly compiled inside public/public/logo.svg');

        // Ensure injected Neon configuration inside output folder is active
        const compiledConfig = fs.readFileSync(path.join(publicDir, 'src/js/config.js'), 'utf8');
        assert(!compiledConfig.includes('YOUR_NEON_AUTH_URL') && !compiledConfig.includes('YOUR_NEON_API_URL'), 
            'Active Neon PostgreSQL URLs correctly injected into compiled configuration');

        // --- 6. SQL SCHEMA SURFACE CHECKS ---
        console.log(`\n${BOLD}${CYAN}[Phase 6: Verifying SQL Schema Surface (Grade C)]${RESET}`);
        const schemaSql = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');

        const sqlTables = [
            'profiles', 'initiatives', 'initiative_members', 'tasks', 'notifications',
            'clubs', 'club_members', 'training_courses', 'training_enrollments', 'consultations',
            'awareness_content', 'school_visits', 'invites',
            'volunteer_sessions', 'volunteer_signups', 'audit_logs'
        ];
        sqlTables.forEach(t => assert(schemaSql.includes(`create table public.${t}`), `Schema defines table ${t}`));

        const sqlFunctions = [
            'create_volunteer_session', 'signup_to_session', 'cancel_signup',
            'mark_attendance', 'complete_session', 'approve_session', 'reject_session',
            'is_platform_admin', 'is_initiative_member', 'is_initiative_leader', 'initiative_of_session'
        ];
        sqlFunctions.forEach(fn => assert(schemaSql.includes(`function public.${fn}`), `Schema defines function ${fn}`));

        sqlTables.forEach(t => assert(schemaSql.includes(`alter table public.${t} enable row level security`), `RLS enabled on ${t}`));

        const missingPolicies = sqlTables.filter(t => !schemaSql.includes(`on ${t} for`));
        assert(missingPolicies.length === 0, `Every table has at least one policy (missing: ${missingPolicies.join(', ') || 'none'})`);

        assert(schemaSql.includes('security definer'), 'RPCs run security-definer');
        assert(schemaSql.includes('auth.uid()'), 'Policies and RPCs use auth.uid()');

        // --- SUMMARY REPORT ---
        console.log(`\n${PINK}${BOLD}================================================================${RESET}`);
        console.log(`${GOLD}${BOLD}                       TEST SUITE SUMMARY                       ${RESET}`);
        console.log(`${PINK}${BOLD}================================================================${RESET}`);
        console.log(`  Total Tests Run: ${testCount}`);
        console.log(`  ${GREEN}Passed Tests   : ${passedCount}${RESET}`);
        if (failedCount > 0) {
            console.log(`  ${PINK}Failed Tests   : ${failedCount}${RESET}`);
            console.log(`\n${PINK}${BOLD}Diagnostic Result: FAILED${RESET}\n`);
            process.exit(1);
        } else {
            console.log(`  ${GREEN}All tests passed successfully!${RESET}`);
            console.log(`\n${GREEN}${BOLD}Diagnostic Result: SUCCESS (Athar is Production Ready! 🚀)${RESET}\n`);
            process.exit(0);
        }

    } catch (err) {
        console.error(`${PINK}Fatal Suite Error:${RESET}`, err);
        process.exit(1);
    }
}

runSuite();
