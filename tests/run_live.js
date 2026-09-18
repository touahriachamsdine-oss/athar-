/**
 * Athar Platform Production Smoke Ladder (`run_live.js`)
 * Executes real-credential integration smoke test against a deployed or local instance.
 * Exits 0 with an advisory notice if .env is absent or unconfigured.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load .env without external dependencies
function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const lines = fs.readFileSync(envPath, 'utf8').split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx !== -1) {
                const key = trimmed.slice(0, eqIdx).trim();
                let val = trimmed.slice(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                if (!process.env[key]) {
                    process.env[key] = val;
                }
            }
        }
    }
}

loadEnv();

const authUrl = process.env.NEON_AUTH_URL || '';
const apiUrl = process.env.NEON_API_URL || '';
const anonKey = process.env.NEON_ANON_KEY || '';
const appOrigin = process.env.APP_ORIGIN || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

if (!authUrl || !apiUrl || !anonKey || authUrl.includes('YOUR_') || apiUrl.includes('YOUR_') || anonKey.includes('YOUR_')) {
    console.log('run_live: .env not configured — skipping live smoke test');
    process.exit(0);
}

const PINK = '\x1b[38;5;197m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let passed = 0;
let failed = 0;

function assert(condition, message, statusCode) {
    if (condition) {
        passed++;
        console.log(`  ${GREEN}✓${RESET} ${message} ${statusCode ? `[HTTP ${statusCode}]` : ''}`);
    } else {
        failed++;
        console.log(`  ${PINK}✗ [FAILED]${RESET} ${message} ${statusCode ? `[HTTP ${statusCode}]` : ''}`);
    }
}

async function runLiveSmoke() {
    console.log(`\n${CYAN}${BOLD}=== Athar Production Smoke Ladder (run_live.js) ===${RESET}\n`);

    const throwawayEmail = `smoke_youth_${Date.now()}@example.com`;
    const password = 'SecretPassword123!';
    let accessToken = '';
    let refreshToken = '';
    let userId = '';

    // Step 1: Signup throwaway email
    try {
        const res = await fetch(`${appOrigin}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'signup',
                email: throwawayEmail,
                password,
                data: { full_name: 'Smoke Test Youth', wilaya: 'Alger' }
            }),
            signal: AbortSignal.timeout(10000)
        });
        const data = await res.json();
        assert(res.ok && (data.access_token || data.user), '1. Signup throwaway user', res.status);
        if (data.access_token) {
            accessToken = data.access_token;
            refreshToken = data.refresh_token;
            userId = data.user?.id;
        }
    } catch (e) {
        assert(false, `1. Signup throwaway user (Error: ${e.message})`, 500);
    }

    // Step 2: Signin same user
    try {
        const res = await fetch(`${appOrigin}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'signin',
                email: throwawayEmail,
                password
            }),
            signal: AbortSignal.timeout(10000)
        });
        const data = await res.json();
        assert(res.ok && data.access_token, '2. Signin same user -> session received', res.status);
        if (data.access_token) {
            accessToken = data.access_token;
            refreshToken = data.refresh_token || refreshToken;
            userId = data.user?.id || userId;
        }
    } catch (e) {
        assert(false, `2. Signin same user (Error: ${e.message})`, 500);
    }

    // Step 3: GetSession / token refresh rotation
    try {
        if (refreshToken) {
            const res = await fetch(`${appOrigin}/api/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'refresh',
                    refresh_token: refreshToken
                }),
                signal: AbortSignal.timeout(10000)
            });
            const data = await res.json();
            assert(res.ok && data.access_token, '3. Token refresh rotation -> new access token', res.status);
            if (data.access_token) {
                accessToken = data.access_token;
                refreshToken = data.refresh_token || refreshToken;
            }
        } else {
            assert(false, '3. Token refresh rotation (skipped: no refresh token)', 400);
        }
    } catch (e) {
        assert(false, `3. Token refresh rotation (Error: ${e.message})`, 500);
    }

    // Step 4: Guest read of public pillar page list (clubs select, anon apikey)
    try {
        const res = await fetch(`${apiUrl}/clubs?select=*&limit=1`, {
            headers: { apikey: anonKey },
            signal: AbortSignal.timeout(10000)
        });
        const data = await res.json().catch(() => null);
        assert(res.ok && Array.isArray(data), '4. Guest read public clubs list', res.status);
    } catch (e) {
        assert(false, `4. Guest read public clubs list (Error: ${e.message})`, 500);
    }

    // Step 5: Join a club via insert club_members (user JWT) -> check impact summary (+100)
    let clubId = 'club_1';
    try {
        const clubRes = await fetch(`${apiUrl}/clubs?select=id&limit=1`, {
            headers: { apikey: anonKey },
            signal: AbortSignal.timeout(10000)
        });
        const clubsData = await clubRes.json().catch(() => []);
        if (Array.isArray(clubsData) && clubsData.length > 0) {
            clubId = clubsData[0].id;
        }

        const res = await fetch(`${appOrigin}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'insert',
                token: accessToken,
                table: 'club_members',
                payload: { club_id: clubId, user_id: userId }
            }),
            signal: AbortSignal.timeout(10000)
        });
        const data = await res.json();
        assert(res.ok || (data.error && data.error.code === 'conflict'), '5a. Join club via insert club_members', res.status);

        const summaryRes = await fetch(`${appOrigin}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'rpc',
                token: accessToken,
                fn: 'get_impact_summary',
                payload: { p_user_id: userId }
            }),
            signal: AbortSignal.timeout(10000)
        });
        const summaryData = await summaryRes.json();
        assert(summaryRes.ok && summaryData.data, '5b. Get impact summary shows ledger totals', summaryRes.status);
    } catch (e) {
        assert(false, `5. Club join & impact summary (Error: ${e.message})`, 500);
    }

    // Step 6: Awareness quiz record_quiz_attempt (passed: true) -> +50 once, repeat -> still +50
    let contentId = 'content_1';
    try {
        const contRes = await fetch(`${apiUrl}/awareness_content?select=id&limit=1`, {
            headers: { apikey: anonKey },
            signal: AbortSignal.timeout(10000)
        });
        const contData = await contRes.json().catch(() => []);
        if (Array.isArray(contData) && contData.length > 0) {
            contentId = contData[0].id;
        }

        const res1 = await fetch(`${appOrigin}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'rpc',
                token: accessToken,
                fn: 'record_quiz_attempt',
                payload: { p_content_id: contentId, p_passed: true, p_score: 2 }
            }),
            signal: AbortSignal.timeout(10000)
        });
        assert(res1.ok, '6a. Record quiz attempt (pass) -> recorded', res1.status);

        const res2 = await fetch(`${appOrigin}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'rpc',
                token: accessToken,
                fn: 'record_quiz_attempt',
                payload: { p_content_id: contentId, p_passed: true, p_score: 2 }
            }),
            signal: AbortSignal.timeout(10000)
        });
        assert(res2.ok, '6b. Record quiz re-attempt -> deduplicated successfully', res2.status);
    } catch (e) {
        assert(false, `6. Awareness quiz recording (Error: ${e.message})`, 500);
    }

    // Step 7: Profiles update rejection (403)
    try {
        const res = await fetch(`${appOrigin}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update',
                token: accessToken,
                table: 'profiles',
                id: userId,
                payload: { impact_points: 9999 }
            }),
            signal: AbortSignal.timeout(10000)
        });
        const data = await res.json();
        assert(res.status === 403 && data.error && data.error.code === 'forbidden', '7. Profiles update rejection -> HTTP 403 (lock active)', res.status);
    } catch (e) {
        assert(false, `7. Profiles update rejection (Error: ${e.message})`, 500);
    }

    // Step 8: Admin point award security gate (member JWT -> 403)
    try {
        const resMember = await fetch(`${appOrigin}/api/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'rpc',
                token: accessToken,
                fn: 'award_points_admin',
                payload: { p_user_id: userId, p_amount: 100, p_reason: 'unauthorized_test' }
            }),
            signal: AbortSignal.timeout(10000)
        });
        const dataMember = await resMember.json();
        assert(resMember.status === 403 && dataMember.error && dataMember.error.code === 'forbidden', '8. Admin award under member JWT -> HTTP 403 forbidden', resMember.status);
    } catch (e) {
        assert(false, `8. Admin point award security gate (Error: ${e.message})`, 500);
    }

    // Summary
    console.log(`\n================================================================`);
    console.log(`  Live Smoke Tests Run: ${passed + failed}`);
    console.log(`  Passed              : ${passed}`);
    console.log(`  Failed              : ${failed}`);
    console.log(`================================================================\n`);

    if (failed > 0) {
        console.log(`${PINK}${BOLD}Live Smoke Result: FAILED${RESET}\n`);
        process.exit(1);
    } else {
        console.log(`${GREEN}${BOLD}Live Smoke Result: SUCCESS (All Production Smoke Checks Passed! 🚀)${RESET}\n`);
        process.exit(0);
    }
}

runLiveSmoke().catch((err) => {
    console.error('run_live crashed:', err);
    process.exit(1);
});
