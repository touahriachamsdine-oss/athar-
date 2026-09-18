// Real-branch GoTrue contract tests for src/js/auth.js.
// Usage: node tests/auth_contract_test.js
// Stubs DOM + fetch, then imports the module lazily (no import-time globals).

const store = new Map();

globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
};

globalThis.window = { location: { href: '' } };

const calls = [];
globalThis.fetch = async (url, opts) => {
    const s = String(url);
    calls.push({ url: s, opts: opts || {} });
    if (s.includes('/v1/token?grant_type=password')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'AT-1', refresh_token: 'RT-1', expires_in: 3600, token_type: 'bearer', user: { id: 'u-1', email: 'real@example.com', user_metadata: { full_name: 'Real User' } } }) };
    }
    if (s.includes('/v1/token?grant_type=refresh_token')) {
        const body = JSON.parse((opts && opts.body) || '{}');
        if (body.refresh_token === 'bogus') {
            return { ok: false, status: 400, json: async () => ({ error_description: 'Invalid Refresh Token' }) };
        }
        return { ok: true, status: 200, json: async () => ({ access_token: 'AT-2', refresh_token: 'RT-2', expires_in: 3600, token_type: 'bearer', user: { id: 'u-1', email: 'real@example.com', user_metadata: { full_name: 'Real User' } } }) };
    }
    if (s.includes('/v1/signup')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'AT-S', refresh_token: 'RT-S', expires_in: 3600, token_type: 'bearer', user: { id: 'u-s', email: 'new@example.com', user_metadata: { full_name: 'New User' } } }) };
    }
    if (s.includes('/v1/logout')) {
        return { ok: true, status: 204, json: async () => null };
    }
    if (s.includes('/profiles')) {
        return { ok: true, status: 200, json: async () => [{ id: 'u-1', role: 'member' }] };
    }
    return { ok: true, status: 200, json: async () => ({}) };
};

let pass = 0;
let fail = 0;
function assert(cond, msg) {
    if (cond) { pass++; console.log('  \u001b[32m\u2713\u001b[0m ' + msg); }
    else { fail++; console.log('  \u001b[38;5;197m\u2717 [FAILED]\u001b[0m ' + msg); }
}

async function run() {
    const { signIn, signUp, getSession, refreshSession } = await import('../src/js/auth.js?contract-test-' + Date.now());

    console.log('\n[Phase 1] signIn real branch');
    calls.length = 0;
    let out = await signIn('real@example.com', 'pw');
    const tokenCall = calls.find((c) => c.url.includes('/v1/token?grant_type=password'));
    assert(!!tokenCall, 'signIn posts to /v1/token?grant_type=password');
    assert(tokenCall && tokenCall.opts.headers.apikey === 'YOUR_NEON_ANON_KEY', 'signIn carries apikey header from config');
    const tokenBody = JSON.parse(tokenCall.opts.body);
    assert(tokenBody.email === 'real@example.com' && tokenBody.password === 'pw', 'signIn body is {email,password}');
    assert(!!tokenCall && tokenCall.opts.headers['Content-Type'] === 'application/json', 'signIn posts JSON');
    assert(out.session && out.session.access_token === 'AT-1', 'signIn returns GoTrue access_token');
    assert(out.session && out.session.refresh_token === 'RT-1', 'signIn returns GoTrue refresh_token');
    assert(out.session && out.session.expires_at > Date.now(), 'expires_at derived from expires_in');
    assert(out.session && out.session.token === 'AT-1', 'legacy token alias preserved for older page code');
    assert(out.session && out.session.user.id === 'u-1' && out.session.user.name === 'Real User', 'user mapped from user_metadata.full_name');

    console.log('\n[Phase 2] signUp real branch');
    calls.length = 0;
    out = await signUp('new@example.com', 'pw2', 'New User', '0555111222', 'Alger', 'Bab El Oued');
    const upCall = calls.find((c) => c.url.includes('/v1/signup'));
    assert(!!upCall, 'signUp posts to /v1/signup');
    assert(upCall && upCall.opts.headers.apikey === 'YOUR_NEON_ANON_KEY', 'signUp carries apikey header');
    const upBody = JSON.parse(upCall.opts.body);
    assert(upBody.data.full_name === 'New User' && upBody.data.phone === '0555111222' && upBody.data.wilaya === 'Alger', 'signUp metadata under data.full_name/phone/wilaya/neighborhood');
    const upStored = JSON.parse(store.get('neon_session'));
    assert(upStored.access_token === 'AT-S', 'signUp session persisted');

    console.log('\n[Phase 3] getSession + auto-refresh');
    const stored = JSON.parse(store.get('neon_session'));
    assert(stored.access_token === 'AT-S', 'signUp session persisted in localStorage');
    localStorage.removeItem('athar_mock_mode');

    store.set('neon_session', JSON.stringify({ access_token: 'AT-STALE', refresh_token: 'RT-STALE', expires_at: Date.now() - 60000, token: 'AT-STALE', user: { id: 'u-1' } }));
    calls.length = 0;
    let sess = await getSession();
    const refCall = calls.find((c) => c.url.includes('/v1/token?grant_type=refresh_token'));
    assert(!!refCall, 'expired session triggers refresh via grant_type=refresh_token');
    assert(sess && sess.access_token === 'AT-2', 'getSession returns refreshed session');

    store.set('neon_session', JSON.stringify({ access_token: 'AT-FRESH', refresh_token: 'RT-FRESH', expires_at: Date.now() + 3600000, token: 'AT-FRESH', user: { id: 'u-1' } }));
    calls.length = 0;
    sess = await getSession();
    assert(!calls.some((c) => c.url.includes('/v1/token?grant_type=refresh_token')), 'valid session does not re-fetch');

    console.log('\n[Phase 4] refreshSession fallback');
    calls.length = 0;
    const bad = await refreshSession('bogus');
    assert(!!bad.error, 'failed refresh returns {error}');

    console.log('\n================================================================');
    console.log(`  Total Tests Run: ${pass + fail}`);
    console.log(`  Passed Tests   : ${pass}`);
    console.log(`  Failed Tests   : ${fail}`);
    console.log('================================================================');
    console.log(`\nDiagnostic Result: ${fail === 0 ? 'SUCCESS (GoTrue contract verified)' : 'FAILED'}\n`);
    process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => {
    console.error('auth_contract_test crashed:', e);
    process.exit(1);
});