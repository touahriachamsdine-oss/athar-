// Gateway (api/action.js) tests — run against the raw processAction core.
// Usage: node tests/api_test.js

process.env.NEON_AUTH_URL = 'https://auth.test/neondb/auth';
process.env.NEON_API_URL = 'https://data.test/neondb/rest/v1';
process.env.NEON_ANON_KEY = 'anon-key';
process.env.SERVICE_ROLE_KEY = 'svc-key';
process.env.UPSTASH_REDIS_REST_URL = '';
process.env.UPSTASH_REDIS_REST_TOKEN = '';
process.env.APP_ORIGIN = 'http://localhost:8080';

import { processAction } from '../api/action.js';

let pass = 0;
let fail = 0;
const calls = [];
let upstashLimit = '';

const fetchStub = async (url, opts) => {
    const s = String(url);
    calls.push({ url: s, opts: opts || {} });
    if (s.includes('/incr/')) return { ok: true, status: 200, text: async () => upstashLimit || '1' };
    if (s.includes('/expire/')) return { ok: true, status: 200, text: async () => '1' };
    if (s.endsWith('/audit_logs')) return { ok: true, status: 201, json: async () => null };
    if (opts && opts.body && s.includes('/token?grant_type=password')) {
        return { ok: true, status: 200, json: async () => ({ access_token: 'tok', user: { id: 'u1' } }) };
    }
    return { ok: true, status: 200, json: async () => ({ id: 'r1' }) };
};

function assert(cond, msg) {
    if (cond) { pass++; console.log('  \u001b[32m\u2713\u001b[0m ' + msg); }
    else { fail++; console.log('  \u001b[38;5;197m\u2717 [FAILED]\u001b[0m ' + msg); }
}

async function run() {
    globalThis.fetch = fetchStub;
    const meta = { ip: '1.2.3.4', userAgent: 'test-agent', requestId: 'rid-1' };

    console.log('\n[Phase 1] Validation');
    let out = await processAction({}, meta);
    assert(out.status === 400 && out.body.error.code === 'validation', 'empty body rejected');
    out = await processAction(null, meta);
    assert(out.status === 400, 'null body rejected');
    out = await processAction({ token: 'a.b.c' }, meta);
    assert(out.status === 400 && out.body.error.code === 'validation', 'missing action rejected');

    console.log('\n[Phase 2] Auth actions (proxied to GoTrue)');
    calls.length = 0;
    out = await processAction({ action: 'signin', email: 'a@b.c', password: 'x' }, meta);
    assert(out.status === 200 && out.body.access_token === 'tok', 'signin proxies to /v1/token?grant_type=password');
    const authCall = calls.find((c) => c.url.includes('/token?grant_type=password'));
    assert(authCall && authCall.opts.headers.apikey === 'anon-key', 'auth call carries anon apikey');
    out = await processAction({ action: 'signout' }, meta);
    assert(out.status === 200 && out.body.data.status === 'signed_out', 'signout is client-side only');

    console.log('\n[Phase 3] Mutations (RLS-protected proxy)');
    calls.length = 0;
    out = await processAction({ action: 'insert', token: 'abc.eyJzdWIiOiJ1c2VyLTEifQ.xyz', table: 'initiatives', payload: { title: 'T' } }, meta);
    assert(out.status === 200 && out.body.ok === true, 'insert returns ok');
    const insCall = calls.find((c) => c.url.endsWith('/initiatives'));
    assert(insCall && insCall.opts.method === 'POST', 'insert POSTs to table endpoint');
    assert(insCall && insCall.opts.headers.Prefer === 'return=representation', 'insert requests representation');
    assert(insCall && insCall.opts.headers.Authorization === 'Bearer abc.eyJzdWIiOiJ1c2VyLTEifQ.xyz', 'user JWT forwarded (RLS preserved)');

    calls.length = 0;
    out = await processAction({ action: 'update', token: 'abc.eyJzdWIiOiJ1c2VyLTEifQ.xyz', table: 'tasks', id: 't1', payload: { status: 'done' } }, meta);
    const updCall = calls.find((c) => c.url.includes('/tasks?id=eq.t1'));
    assert(out.status === 200 && updCall && updCall.opts.method === 'PATCH', 'update PATCHes by id');

    calls.length = 0;
    out = await processAction({ action: 'delete', token: 'abc.eyJzdWIiOiJ1c2VyLTEifQ.xyz', table: 'tasks', id: 't1' }, meta);
    const delCall = calls.find((c) => c.url.includes('/tasks?id=eq.t1'));
    assert(out.status === 200 && delCall && delCall.opts.method === 'DELETE', 'delete DELETEs by id');

    out = await processAction({ action: 'insert', table: 'audit_logs', payload: {} }, meta);
    assert(out.status === 403 && out.body.error.code === 'forbidden', 'audit_logs is not client-writable');

    console.log('\n[Phase 3B] profiles is read-only through the gateway');
    calls.length = 0;
    out = await processAction({ action: 'insert', table: 'profiles', payload: { full_name: 'X' }, token: 'jwt' }, {});
    assert(out.status === 403 && out.body.error.code === 'forbidden', 'profiles insert rejected');
    out = await processAction({ action: 'update', table: 'profiles', id: 'u-1', payload: { impact_points: 999 }, token: 'jwt' }, {});
    assert(out.status === 403 && out.body.error.code === 'forbidden', 'profiles update rejected (no self-inflation)');
    out = await processAction({ action: 'delete', table: 'profiles', id: 'u-1', token: 'jwt' }, {});
    assert(out.status === 403 && out.body.error.code === 'forbidden', 'profiles delete rejected');
    assert(!calls.some(c => c.url.includes('/profiles')), 'no profiles request ever reaches the DB');

    out = await processAction({ action: 'bogus', table: 'tasks', payload: {} }, meta);
    assert(out.status === 400 && out.body.error.code === 'validation', 'unknown action rejected');

    console.log('\n[Phase 4] RPC + audit');
    calls.length = 0;
    out = await processAction({ action: 'rpc', token: 'abc.eyJzdWIiOiJ1c2VyLTEifQ.xyz', fn: 'complete_session', payload: { p_session_id: 'vs1' } }, meta);
    const rpcCall = calls.find((c) => c.url.includes('/rpc/complete_session'));
    assert(out.status === 200 && rpcCall && rpcCall.opts.method === 'POST', 'rpc POSTs to /rpc/<fn>');
    const auditCall = calls.find((c) => c.url.endsWith('/audit_logs'));
    assert(!!auditCall, 'mutation writes an audit_log row');
    assert(auditCall && auditCall.opts.headers.apikey === 'svc-key', 'audit uses service role (bypasses RLS)');
    let auditBody = JSON.parse(auditCall.opts.body);
    assert(auditBody.action === 'complete_session' && auditBody.actor_user_id === 'user-1', 'audit records fn + decoded actor');

    console.log('\n[Phase 5] Rate limiting (Upstash)');
    process.env.UPSTASH_REDIS_REST_URL = 'https://upstash.test';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'utok';
    upstashLimit = '31';
    calls.length = 0;
    out = await processAction({ action: 'rpc', token: 'abc.eyJzdWIiOiJ1c2VyLTEifQ.xyz', fn: 'complete_session', payload: {} }, meta);
    assert(out.status === 429 && out.body.error.code === 'rate_limit', 'over-limit mutation returns 429 rate_limit');
    const incCall = calls.find((c) => c.url.includes('/incr/'));
    assert(!!incCall, 'rate check hits Upstash INCR');
    upstashLimit = '';
    process.env.UPSTASH_REDIS_REST_URL = '';
    process.env.UPSTASH_REDIS_REST_TOKEN = '';

    calls.length = 0;
    out = await processAction({ action: 'signin', email: 'a@b.c', password: 'x' }, meta);
    assert(out.status === 200, 'auth path unaffected once limit resets');

    console.log('\n================================================================');
    console.log(`  Total Tests Run: ${pass + fail}`);
    console.log(`  Passed Tests   : ${pass}`);
    console.log(`  Failed Tests   : ${fail}`);
    console.log('================================================================');
    console.log(`\nDiagnostic Result: ${fail === 0 ? 'SUCCESS (gateway parity verified)' : 'FAILED'}\n`);
    process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => {
    console.error('api_test crashed:', e);
    process.exit(1);
});