// Athar AI Assistant route — serverless (Vercel Function) + local server.js parity.
// Read-only consultant powered by Groq (OpenAI-compatible chat completions).
// The GROQ_API_KEY lives in server env only, never in the client bundle.

import { buildSystemPrompt } from './ai-knowledge.js';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const VALID_LANGS = ['ar', 'fr', 'en', 'amz'];

export const RATE_LIMITS = { max: 20, windowMs: 60000 };
export const MAX_TURNS = 30;
export const MAX_MSG_LEN = 600;
export const MAX_TOTAL_CHARS = 6000;

const hits = new Map();

export function resetRateLimits() {
    hits.clear();
}

function rateBlocked(key) {
    const now = Date.now();
    const list = (hits.get(key) || []).filter(t => now - t < RATE_LIMITS.windowMs);
    if (list.length >= RATE_LIMITS.max) {
        hits.set(key, list);
        return Math.ceil((RATE_LIMITS.windowMs - (now - list[0])) / 1000);
    }
    list.push(now);
    hits.set(key, list);
    return 0;
}

function env(key) {
    return process.env[key] || '';
}

function jsonOut(status, body) {
    return { status, body };
}

export async function processChat(body, meta) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonOut(400, { error: { code: 'validation', message: 'json body required' } });

    const { messages, lang = 'ar', context } = body;
    if (!Array.isArray(messages) || messages.length === 0) return jsonOut(400, { error: { code: 'validation', message: 'messages required' } });
    for (const m of messages) {
        if (!m || typeof m.content !== 'string' || !m.content.trim()) return jsonOut(400, { error: { code: 'validation', message: 'invalid message' } });
    }
    if (messages.length > MAX_TURNS) return jsonOut(400, { error: { code: 'too_large', message: 'too many messages' } });
    if (messages.some(m => m.content.length > MAX_MSG_LEN)) return jsonOut(400, { error: { code: 'too_large', message: 'message too long' } });
    const totalChars = messages.reduce((sum, m) => sum + m.content.length, 0);
    if (totalChars > MAX_TOTAL_CHARS) return jsonOut(400, { error: { code: 'too_large', message: 'history too large' } });
    if (!VALID_LANGS.includes(lang)) return jsonOut(400, { error: { code: 'validation', message: 'invalid lang' } });

    const key = env('GROQ_API_KEY');
    if (!key) return jsonOut(503, { error: { code: 'unconfigured', message: 'AI not configured' } });

    const ip = (meta && (meta.ip || meta.userAgent)) || 'anon';
    const retryAfter = rateBlocked(ip);
    if (retryAfter > 0) return jsonOut(429, { error: { code: 'rate_limit', retry_after: retryAfter } });

    if (context && typeof context !== 'object') return jsonOut(400, { error: { code: 'validation', message: 'invalid context' } });

    const system = buildSystemPrompt({ lang, context: context || null });
    const chat = [
        { role: 'system', content: system },
        ...messages.slice(-MAX_TURNS).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ];

    try {
        const res = await fetch(GROQ_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: GROQ_MODEL, messages: chat, temperature: 0.4, max_tokens: 700 }),
            signal: AbortSignal.timeout(25000)
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            const message = (data && (data.error && data.error.message)) || 'provider error';
            return jsonOut(502, { error: { code: 'ai_provider', message } });
        }
        const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        return jsonOut(200, { reply: reply || '' });
    } catch (e) {
        return jsonOut(502, { error: { code: 'network', message: e.message } });
    }
}

// Vercel Function handler
export default function handler(req, res) {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', env('APP_ORIGIN') || '*');
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
            const out = await processChat(body, {
                ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || '',
                userAgent: req.headers['user-agent'] || ''
            });
            res.setHeader('Access-Control-Allow-Origin', env('APP_ORIGIN') || '*');
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