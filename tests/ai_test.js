// AI Assistant (api/ai.js + api/ai-knowledge.js) tests.
// Usage: node tests/ai_test.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

process.env.GROQ_API_KEY = 'gsk-fake-test-key';

import { buildSystemPrompt } from '../api/ai-knowledge.js';
import { processChat, RATE_LIMITS, resetRateLimits } from '../api/ai.js';

let pass = 0;
let fail = 0;
const calls = [];
let groqStatus = 200;
let groqBody = { choices: [{ message: { content: 'مرحبا بك في أثر!' } }] };

const fetchStub = async (url, opts) => {
    const s = String(url);
    calls.push({ url: s, opts: opts || {} });
    if (s.includes('api.groq.com')) {
        calls[calls.length - 1].groq = true;
        return {
            ok: groqStatus < 300,
            status: groqStatus,
            json: async () => groqBody,
            text: async () => JSON.stringify(groqBody)
        };
    }
    return { ok: true, status: 200, json: async () => ({}) };
};

function assert(cond, msg) {
    if (cond) { pass++; console.log('  \u001b[32m\u2713\u001b[0m ' + msg); }
    else { fail++; console.log('  \u001b[38;5;197m\u2717 [FAILED]\u001b[0m ' + msg); }
}

async function run() {
    globalThis.fetch = fetchStub;
    const meta = { ip: '9.9.9.9', userAgent: 'ai-test', requestId: 'ai-1' };
    const goodBody = () => ({ messages: [{ role: 'user', content: 'واش نقدر نشارك في التطوع؟' }], lang: 'ar' });

    console.log('\n[Phase 1] Validation');
    let out = await processChat(null, meta);
    assert(out.status === 400 && out.body.error.code === 'validation', 'null body rejected');
    out = await processChat({}, meta);
    assert(out.status === 400 && out.body.error.code === 'validation', 'empty body rejected');
    out = await processChat({ messages: 'x', lang: 'ar' }, meta);
    assert(out.status === 400, 'non-array messages rejected');
    out = await processChat({ messages: [], lang: 'ar' }, meta);
    assert(out.status === 400, 'empty messages rejected');
    out = await processChat({ messages: [{ role: 'user' }], lang: 'ar' }, meta);
    assert(out.status === 400, 'message without content rejected');
    out = await processChat({ messages: [{ role: 'user', content: 'x' }], lang: 'xx' }, meta);
    assert(out.status === 400 && out.body.error.code === 'validation', 'invalid lang rejected');

    console.log('\n[Phase 1B] Size guards');
    const many = Array.from({ length: 31 }, (_, i) => ({ role: 'user', content: `m${i}` }));
    out = await processChat({ messages: many, lang: 'ar' }, meta);
    assert(out.status === 400 && out.body.error.code === 'too_large', 'over-turn-cap history rejected');
    out = await processChat({ messages: [{ role: 'user', content: 'x'.repeat(700) }], lang: 'ar' }, meta);
    assert(out.status === 400 && out.body.error.code === 'too_large', 'oversized single message rejected');
    const long = Array.from({ length: 11 }, () => ({ role: 'user', content: 'c'.repeat(600) }));
    out = await processChat({ messages: long, lang: 'ar' }, meta);
    assert(out.status === 400 && out.body.error.code === 'too_large', 'oversized total history rejected');

    console.log('\n[Phase 1C] Unconfigured key');
    const savedKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    out = await processChat(goodBody(), meta);
    assert(out.status === 503 && out.body.error.code === 'unconfigured', 'missing GROQ_API_KEY returns 503');
    process.env.GROQ_API_KEY = savedKey;

    console.log('\n[Phase 2] Knowledge + persona prompt');
    const promptAr = buildSystemPrompt({ lang: 'ar' });
    assert(typeof promptAr === 'string' && promptAr.length > 200, 'Arabic prompt is substantial');
    assert(promptAr.includes('أثر') && promptAr.includes('دار الشباب'), 'prompt carries platform identity');
    assert(promptAr.includes('تطوع') || promptAr.includes('volontariat'), 'prompt references program topics');
    const promptAmz = buildSystemPrompt({ lang: 'amz' });
    assert(/Tamazight|Tarifit/i.test(promptAmz), 'Amazigh prompt instructs Tamazight mode');
    const personal = buildSystemPrompt({ lang: 'fr', context: { full_name: 'Karim', points: 90, clubs: ['Musique'] } });
    assert(personal.includes('Karim') && personal.includes('90') && personal.includes('Musique'), 'personalized context embedded for logged-in member');
    assert(!personal.includes('gsk-'), 'prompt never leaks the API key');

    console.log('\n[Phase 3] Groq request contract');
    calls.length = 0;
    out = await processChat(goodBody(), meta);
    assert(out.status === 200 && out.body.reply === 'مرحبا بك في أثر!', 'returns Groq reply text');
    const groqCall = calls.find(c => c.groq);
    assert(!!groqCall, 'calls Groq chat completions endpoint');
    assert(groqCall && groqCall.opts.method === 'POST', 'Groq call is POST');
    assert(groqCall && groqCall.opts.headers.Authorization === 'Bearer gsk-fake-test-key', 'Groq uses Bearer env key');
    assert(groqCall && groqCall.opts.headers['Content-Type'] === 'application/json', 'Groq call is JSON');
    const groqPayload = JSON.parse(groqCall.opts.body);
    assert(groqPayload.messages[0].role === 'system', 'system prompt is first message');
    assert(groqPayload.messages[groqPayload.messages.length - 1].content === goodBody().messages[0].content, 'user turn is last message');
    assert(groqPayload.messages.length === 2, 'history is system + user');
    assert(typeof groqPayload.model === 'string' && groqPayload.model.length > 0, 'model is selected');
    assert(groqPayload.max_tokens > 0, 'max_tokens bounded');

    console.log('\n[Phase 3B] Provider errors');
    groqStatus = 500;
    groqBody = { error: { message: 'provider down' } };
    calls.length = 0;
    out = await processChat(goodBody(), meta);
    assert(out.status === 502 && out.body.error.code === 'ai_provider', 'Groq 5xx maps to 502 ai_provider');
    groqStatus = 200;
    groqBody = { choices: [{ message: { content: 'ok' } }] };
    globalThis.fetch = async () => { throw new Error('boom'); };
    try {
        out = await processChat(goodBody(), meta);
        assert(out.status === 502 && out.body.error.code === 'network', 'network failure maps to 502 network');
    } catch (e) {
        assert(false, 'network failure must not throw: ' + e.message);
    }
    globalThis.fetch = fetchStub;

    console.log('\n[Phase 4] Rate limiting (always enforced, in-memory)');
    resetRateLimits();
    RATE_LIMITS.max = 3;
    RATE_LIMITS.windowMs = 60000;
    for (let i = 0; i < 3; i++) {
        out = await processChat(goodBody(), meta);
        assert(out.status === 200, `request ${i + 1} allowed under limit`);
    }
    out = await processChat(goodBody(), meta);
    assert(out.status === 429 && out.body.error.code === 'rate_limit', 'over-limit request returns 429 rate_limit');
    assert(out.body.error.retry_after > 0, 'rate_limit carries retry_after');
    RATE_LIMITS.max = 20;
    RATE_LIMITS.windowMs = 60000;

    // A different IP is not penalized (per-IP isolation)
    out = await processChat(goodBody(), { ip: '1.1.1.1', userAgent: 'x', requestId: 'ai-2' });
    assert(out.status === 200, 'rate limit is per-IP');

    console.log('\n[Phase 5] Client + structural checks');
    assert(fs.existsSync(path.join(ROOT, 'pages', 'chat.html')), 'pages/chat.html exists');
    assert(fs.existsSync(path.join(ROOT, 'src', 'pages', 'chat.js')), 'src/pages/chat.js exists');
    const chatHtml = fs.readFileSync(path.join(ROOT, 'pages', 'chat.html'), 'utf8');
    assert(chatHtml.includes('cookieconsent.js'), 'chat page includes cookie consent');
    assert(chatHtml.includes('icons.js'), 'chat page includes icons');
    assert(!/onclick=|onsubmit=/.test(chatHtml), 'chat page has no inline event handlers (CSP-safe)');
    const layoutSrc = fs.readFileSync(path.join(ROOT, 'src', 'js', 'layout.js'), 'utf8');
    assert(layoutSrc.includes('chatwidget.js') && layoutSrc.includes('toggleChatWidget'), 'layout wires the corner chat widget');
    assert(layoutSrc.includes('floating-ai-btn'), 'layout ships the floating chat button');
    const widgetSrc = fs.readFileSync(path.join(ROOT, 'src', 'js', 'chatwidget.js'), 'utf8');
    assert(widgetSrc.includes("typeof c === 'string'"), 'widget el() accepts ic() SVG strings (no appendChild crash)');

    console.log('\n[Phase 6] i18n chat keys (trilingual symmetry)');
    const i18n = await import('../src/js/i18n.js');
    const T = i18n.TRANSLATIONS;
    const chatKeys = ['nav_chat', 'chat_title', 'chat_subtitle', 'chat_placeholder', 'chat_send', 'chat_offline', 'chat_suggest_club', 'chat_suggest_volunteer', 'chat_suggest_points', 'chat_suggest_register'];
    chatKeys.forEach(k => {
        assert(T.ar[k] && T.fr[k] && T.en[k], `chat key "${k}" present in AR/FR/EN`);
    });
    const lens = [Object.keys(T.ar).length, Object.keys(T.fr).length, Object.keys(T.en).length];
    assert(lens[0] === lens[1] && lens[1] === lens[2], `dictionaries stay symmetric (${lens[0]}/${lens[1]}/${lens[2]})`);

    console.log('\n================================================================');
    console.log(`  Total Tests Run: ${pass + fail}`);
    console.log(`  Passed Tests   : ${pass}`);
    console.log(`  Failed Tests   : ${fail}`);
    console.log('================================================================');
    console.log(`\nDiagnostic Result: ${fail === 0 ? 'SUCCESS (AI assistant verified)' : 'FAILED'}\n`);
    process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => {
    console.error('ai_test crashed:', e);
    process.exit(1);
});