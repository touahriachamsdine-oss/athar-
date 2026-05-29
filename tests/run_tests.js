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

        // Test GET query builder
        await neon.from('profiles').select().id('user_456');
        assert(lastFetch !== null, 'Fetch called for query select.id');
        assert(lastFetch.url.endsWith('/profiles?id=eq.user_456'), 'Correct query parameter for ID filter');
        assert(lastFetch.options.headers['Authorization'] === 'Bearer auth_token_secret', 'Correct token sent in header');

        // Test POST builder
        await neon.from('clubs').insert({ name: 'Robotics Club' });
        assert(lastFetch.options.method === 'POST', 'POST request generated for insert');
        assert(lastFetch.options.headers['Prefer'] === 'return=representation', 'Representation headers requested');
        assert(JSON.parse(lastFetch.options.body).name === 'Robotics Club', 'Body contains valid insert payload');

        // Test PATCH builder
        await neon.from('profiles').update({ xp: 100 }, 'user_789');
        assert(lastFetch.options.method === 'PATCH', 'PATCH request generated for update');
        assert(lastFetch.url.endsWith('/profiles?id=eq.user_789'), 'Correct target endpoint for patch query');

        // Test DELETE builder
        await neon.from('notifications').delete('notif_111');
        assert(lastFetch.options.method === 'DELETE', 'DELETE request generated for remove action');
        assert(lastFetch.url.endsWith('/notifications?id=eq.notif_111'), 'Correct target endpoint for delete query');

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
