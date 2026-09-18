// Athar Grade-C gateway: auth + all mutations through one endpoint.
// Runs as a Vercel Function (Node) and mirrors local server.js parity.
// Zero-dependency by design: rate limiting talks to Upstash REST directly.

import crypto from 'crypto';

const ALLOWED_TABLES = new Set([
    'profiles', 'initiatives', 'initiative_members', 'tasks', 'notifications',
    'clubs', 'club_members', 'training_courses', 'training_enrollments', 'consultations',
    'awareness_content', 'school_visits', 'invites', 'volunteer_sessions', 'volunteer_signups'
]);

function env(key, fallback = '') {
    return process.env[key] || fallback;
}

function jsonOut(status, body) {
    return { status, body };
}

function mapDbCode(code) {
    switch (code) {
        case '28000': return 'unauthorized';
        case '42501': return 'forbidden';
        case 'P0002': return 'not_found';
        case '22023': return 'validation';
        case '23514': return 'conflict';
        case '23505': return 'conflict';
        default: return 'validation';
    }
}

function mapDbError(status, data) {
    const code = (data && typeof data === 'object') ? (data.code || '') : '';
    const message = (data && typeof data === 'object') ? (data.message || 'database error') : 'database error';
    return { code: mapDbCode(code), message };
}

function decodeUserId(token) {
    if (!token || typeof token !== 'string' || token.split('.').length < 2) return null;
    try {
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const json = Buffer.from(b64, 'base64').toString('utf8');
        const payload = JSON.parse(json);
        return payload.sub || payload.user_id || null;
    } catch (e) {
        return null;
    }
}

// Redis fixed-window rate limit via Upstash REST; unlimited fallback without env.
async function rateCheck(scope, key, limit, windowSec) {
    const base = env('UPSTASH_REDIS_REST_URL');
    const token = env('UPSTASH_REDIS_REST_TOKEN');
    if (!base || !token) return null;
    const winKey = `rl:athar:${scope}:${key}:${Math.floor(Date.now() / (windowSec * 1000))}`;
    try {
        const inc = await fetch(`${base}/incr/${encodeURIComponent(winKey)}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: AbortSignal.timeout(5000)
        });
        const count = parseInt(await inc.text(), 10) || 0;
        if (count === 1) {
            await fetch(`${base}/expire/${encodeURIComponent(winKey)}/${windowSec}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: AbortSignal.timeout(5000)
            });
        }
        return { blocked: count > limit, retryAfter: windowSec };
    } catch (e) {
        return null;
    }
}

async function proxy(url, method, payload, token, prefer) {
    const headers = { apikey: env('NEON_ANON_KEY'), 'Content-Type': 'application/json' };
    if (prefer) headers['Prefer'] = prefer;
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers, signal: AbortSignal.timeout(15000) };
    if (payload !== null) opts.body = JSON.stringify(payload);
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
        return jsonOut(res.status, { error: mapDbError(res.status, data) });
    }
    return jsonOut(res.status, { ok: true, data });
}

async function proxyAuth(action, body) {
    if (action === 'signout') return jsonOut(200, { ok: true, data: { status: 'signed_out' } });
    let url = `${env('NEON_AUTH_URL')}/v1/`;
    let payload = null;
    if (action === 'signup') {
        url += 'signup';
        payload = { email: body.email, password: body.password, data: body.data || {} };
    } else if (action === 'signin') {
        url += 'token?grant_type=password';
        payload = { email: body.email, password: body.password };
    } else if (action === 'refresh') {
        url += 'token?grant_type=refresh_token';
        payload = { refresh_token: body.refresh_token };
    }
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { apikey: env('NEON_ANON_KEY'), 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000)
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            const msg = (data && (data.msg || data.message || data.error_description)) || 'authentication failed';
            return jsonOut(res.status, { error: { code: 'auth_error', message: msg } });
        }
        return jsonOut(200, data);
    } catch (e) {
        return jsonOut(502, { error: { code: 'network', message: e.message } });
    }
}

async function proxyMutation(action, body) {
    if (action === 'rpc') {
        const url = `${env('NEON_API_URL')}/rpc/${encodeURIComponent(body.fn || '')}`;
        return proxy(url, 'POST', body.payload || {}, body.token);
    }
    const table = body.table || '';
    if (!ALLOWED_TABLES.has(table)) {
        return jsonOut(403, { error: { code: 'forbidden', message: 'table not allowed' } });
    }
    const base = `${env('NEON_API_URL')}/${table}`;
    if (action === 'insert') return proxy(base, 'POST', body.payload, body.token, 'return=representation');
    if (action === 'update') return proxy(`${base}?id=eq.${encodeURIComponent(body.id || '')}`, 'PATCH', body.payload, body.token, 'return=representation');
    if (action === 'delete') return proxy(`${base}?id=eq.${encodeURIComponent(body.id || '')}`, 'DELETE', null, body.token);
    return jsonOut(400, { error: { code: 'validation', message: `unknown action ${action}` } });
}

async function auditWrite(action, body, actorId, meta, success) {
    const svc = env('SERVICE_ROLE_KEY');
    if (!svc) return;
    const tableLabel = action === 'rpc' ? (body.fn || 'rpc') : `${action}:${body.table || ''}`;
    try {
        await fetch(`${env('NEON_API_URL')}/audit_logs`, {
            method: 'POST',
            headers: {
                apikey: svc, Authorization: `Bearer ${svc}`,
                'Content-Type': 'application/json', Prefer: 'return=minimal'
            },
            body: JSON.stringify({
                actor_user_id: actorId || null,
                action: tableLabel,
                entity: action === 'rpc' ? 'volunteer_sessions' : (body.table || null),
                entity_id: body.id || null,
                success,
                ip: meta.ip || null,
                user_agent: meta.userAgent || null,
                request_id: meta.requestId || null,
                meta: { action, table: body.table || null, fn: body.fn || null }
            }),
            signal: AbortSignal.timeout(10000)
        });
    } catch (e) { /* audit must never fail the request path */ }
}

export async function processAction(body, meta) {
    if (!body || typeof body !== 'object') return jsonOut(400, { error: { code: 'validation', message: 'json body required' } });
    const action = body.action;
    if (!action) return jsonOut(400, { error: { code: 'validation', message: 'action required' } });
    const requestId = meta.requestId || ('req-' + Date.now());
    const ip = meta.ip || '';
    const userAgent = meta.userAgent || '';
    const actorId = decodeUserId(body.token);

    if (['signup', 'signin', 'refresh', 'signout'].includes(action)) {
        const lim = await rateCheck('auth', ip, 5, 60);
        if (lim && lim.blocked) return jsonOut(429, { error: { code: 'rate_limit', retry_after: lim.retryAfter } });
        return proxyAuth(action, body);
    }

    const limit = (action === 'rpc' && ['complete_session', 'approve_session', 'reject_session'].includes(body.fn || '')) ? 10 : 30;
    const lim = await rateCheck('mut', `${actorId || 'anon'}:${ip}`, limit, 60);
    if (lim && lim.blocked) return jsonOut(429, { error: { code: 'rate_limit', retry_after: lim.retryAfter } });

    const out = await proxyMutation(action, body);
    await auditWrite(action, body, actorId, { ip, userAgent, requestId }, out.status < 300);
    return out;
}

// Vercel Functions handler
export default function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', env('APP_ORIGIN', '*'));
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.statusCode = 204;
        res.end();
        return;
    }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', async () => {
        try {
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
            const requestId = req.headers['x-request-id'] || crypto.randomUUID();
            const out = await processAction(body, {
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
                userAgent: req.headers['user-agent'] || '',
                requestId
            });
            res.setHeader('Access-Control-Allow-Origin', env('APP_ORIGIN', '*'));
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = out.status;
            res.end(JSON.stringify(out.body));
        } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: { code: 'server_error', message: e.message } }));
        }
    });
}