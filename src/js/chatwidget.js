// Athar AI Assistant — non-modal corner widget.
// A compact chat panel pinned to the corner; the page behind stays visible
// and interactive. Talks to server-side /api/ai (Groq), personalizes for
// signed-in members, allows guests.
import { requireAuth } from './auth.js';
import { neon } from './neon.js';
import { getCurrentLang, TRANSLATIONS } from './i18n.js';
import { ic } from './icons.js';

const LANGS = ['ar', 'fr', 'en', 'amz'];

let built = false;
let opened = false;
let busy = false;
let ready = false;
let context = null;
let chatLang = localStorage.getItem('athar_lang') || 'ar';
if (!LANGS.includes(chatLang)) chatLang = 'ar';
const history = [];

function t(key) {
    const dict = TRANSLATIONS[chatLang] || TRANSLATIONS.ar;
    return dict[key] || TRANSLATIONS.ar[key] || key;
}

function byId(id) { return document.getElementById(id); }

function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
        Object.entries(attrs).forEach(([k, v]) => {
            if (k === 'class') node.className = v;
            else if (k === 'style') node.style.cssText = v;
            else node.setAttribute(k, v);
        });
    }
    (children || []).forEach(c => {
        // ic() returns SVG markup (a string), so accept both strings and Nodes.
        if (typeof c === 'string') node.insertAdjacentHTML('beforeend', c);
        else node.appendChild(c);
    });
    return node;
}

function bubble(role, text) {
    const wrap = el('div', { style: 'display:flex;' + (role === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;') });
    const b = el('div', {
        style: 'max-width:80%; padding:10px 14px; border-radius:14px; font-size:13px; line-height:1.65; white-space:pre-wrap; word-break:break-word;' +
            (role === 'user'
                ? 'background:linear-gradient(135deg, rgba(255,42,109,0.18), rgba(5,217,244,0.14)); border:1px solid rgba(255,42,109,0.25);'
                : 'background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);')
    });
    b.textContent = text;
    wrap.appendChild(b);
    return wrap;
}

function typingEl() {
    const wrap = el('div', { style: 'display:flex; justify-content:flex-start;' });
    const dots = el('div', { class: 'typing-dots', style: 'padding:11px 14px; border-radius:14px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08);' },
        [0, 1, 2].map(() => el('span')));
    wrap.appendChild(dots);
    return wrap;
}

function scrollToBottom() {
    const box = byId('ai-messages');
    if (box) box.scrollTop = box.scrollHeight;
}

function renderBubble(role, text) {
    byId('ai-messages').appendChild(bubble(role, text));
    scrollToBottom();
}

function showTyping() {
    const box = byId('ai-messages');
    const prev = box.querySelector('.typing-dots');
    if (prev) prev.closest('div').remove();
    box.appendChild(typingEl());
    scrollToBottom();
}

function hideTyping() {
    const box = byId('ai-messages');
    const prev = box.querySelector('.typing-dots');
    if (prev) prev.closest('div').remove();
}

function renderSuggestions() {
    const holder = byId('ai-suggestions');
    holder.innerHTML = '';
    ['chat_suggest_club', 'chat_suggest_volunteer', 'chat_suggest_points', 'chat_suggest_register'].forEach(key => {
        const chip = el('button', {
            type: 'button',
            class: 'ai-chip',
            style: 'border:1px solid rgba(5,217,232,0.25); background:rgba(5,217,232,0.06); color:var(--text-primary); border-radius:999px; padding:6px 12px; font-size:11.5px; cursor:pointer;'
        });
        chip.textContent = t(key);
        chip.onclick = () => {
            const input = byId('ai-input');
            input.value = t(key);
            send();
        };
        holder.appendChild(chip);
    });
}

function setStaticUI() {
    byId('ai-title').textContent = t('chat_title');
    byId('ai-lang').value = chatLang;
    byId('ai-input').placeholder = t('chat_placeholder');
    byId('ai-send').title = t('chat_send');
    renderSuggestions();
}

async function ensureContext() {
    if (ready) return;
    ready = true;
    try {
        const auth = await requireAuth({ guests: true });
        if (auth && auth.user && !auth.guest) {
            const { data: profileRows } = await neon.from('profiles').select().id(auth.user.id);
            const p = profileRows && profileRows[0];
            if (p) {
                const { data: memberships } = await neon.from('club_members').select();
                const { data: clubs } = await neon.from('clubs').select();
                const mine = (memberships || []).filter(m => m.user_id === auth.user.id);
                const clubNames = mine.map(m => {
                    const c = (clubs || []).find(x => x.id === m.club_id);
                    return c ? (c.title_ar || c.name || c.title) : null;
                }).filter(Boolean);
                context = {
                    full_name: p.full_name || null,
                    role: p.role || null,
                    points: typeof p.impact_points === 'number' ? p.impact_points : null,
                    clubs: clubNames.length ? clubNames : undefined
                };
            }
        }
    } catch (e) { /* personalization is best-effort */ }
}

async function send() {
    if (busy) return;
    const input = byId('ai-input');
    const text = input.value.trim().slice(0, 600);
    if (!text) return;
    input.value = '';
    history.push({ role: 'user', content: text });
    renderBubble('user', text);
    busy = true;
    showTyping();
    try {
        const res = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history.slice(-30), lang: chatLang, context })
        });
        const data = await res.json().catch(() => null);
        const reply = (data && data.reply) || t('chat_offline');
        history.push({ role: 'assistant', content: reply });
        renderBubble('assistant', reply);
    } catch (e) {
        renderBubble('assistant', t('chat_offline'));
    } finally {
        busy = false;
        hideTyping();
        input.focus();
    }
}

function buildWidget() {
    if (built) return;
    built = true;

    // Widget header: title + language selector + minimize
    const header = el('div', {
        style: 'display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02);'
    }, [
        el('div', { style: 'display:flex;' }, [el('span', { style: 'display:flex; color:var(--accent-cyan);' }, [ic('chat', 18)])]),
        el('div', { style: 'flex:1; min-width:0;' }, [
            el('div', { id: 'ai-title', style: 'font-size:14px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;' }),
            el('div', { style: 'font-size:10px; opacity:0.6; margin-top:1px;' }, [t('chat_lang')])
        ]),
        el('select', {
            id: 'ai-lang',
            style: 'background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:inherit; font-size:11px; padding:5px 6px; border-radius:9px; outline:none; cursor:pointer;'
        }, ['ar', 'fr', 'en', 'amz'].map(v => {
            const o = el('option', { value: v });
            o.textContent = v === 'ar' ? 'عربية' : v === 'fr' ? 'FR' : v === 'en' ? 'EN' : 'AMZ';
            return o;
        })),
        el('button', {
            type: 'button',
            id: 'ai-min',
            title: 'Minimize',
            style: 'background:none; border:none; color:var(--text-dim); cursor:pointer; padding:4px; display:flex;'
        }, [ic('x', 16)])
    ]);

    const messages = el('div', {
        id: 'ai-messages',
        style: 'flex:1; overflow-y:auto; padding:14px 14px; display:flex; flex-direction:column; gap:10px;'
    });

    const suggestions = el('div', {
        id: 'ai-suggestions',
        style: 'display:flex; gap:6px; flex-wrap:wrap; padding:0 14px 10px;'
    });

    const input = el('input', {
        type: 'text',
        id: 'ai-input',
        autocomplete: 'off',
        style: 'flex:1; height:44px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:inherit; padding:0 14px; border-radius:12px; font-family:inherit; font-size:13px; outline:none;'
    });

    const sendBtn = el('button', {
        type: 'submit',
        id: 'ai-send',
        style: 'width:46px; height:44px; border:none; cursor:pointer; border-radius:12px; background:linear-gradient(135deg, rgba(255,42,109,0.85), rgba(5,217,232,0.8)); color:#fff; display:flex; align-items:center; justify-content:center;'
    }, [ic('send', 17)]);

    const form = el('form', {
        id: 'ai-form',
        style: 'display:flex; gap:8px; padding:12px 14px; border-top:1px solid rgba(255,255,255,0.06); background:rgba(255,255,255,0.02);'
    }, [input, sendBtn]);

    const panel = el('div', {
        id: 'ai-widget',
        style: 'position:fixed; bottom:90px; right:22px; z-index:450; width:360px; max-width:calc(100vw - 44px); height:min(62vh, 520px); display:none; flex-direction:column; overflow:hidden; border-radius:20px; box-shadow:0 24px 60px rgba(0,0,0,0.45); background:var(--bg-panel, rgba(12,13,30,0.96)); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); border:1px solid rgba(255,255,255,0.08);'
    }, [header, messages, suggestions, form]);

    document.body.appendChild(panel);

    byId('ai-min').onclick = closeChatWidget;
    byId('ai-form').onsubmit = (e) => { e.preventDefault(); send(); };
    byId('ai-lang').onchange = (e) => {
        chatLang = e.target.value;
        // keep the app language untouched; only the assistant language changes
        byId('ai-input').placeholder = t('chat_placeholder');
        renderSuggestions();
    };
}

export function toggleChatWidget() {
    if (opened) closeChatWidget();
    else openChatWidget();
}

export function openChatWidget() {
    buildWidget();
    const panel = byId('ai-widget');
    if (!panel) return;
    panel.style.display = 'flex';
    opened = true;
    setStaticUI();
    ensureContext().then(() => {
        const box = byId('ai-messages');
        if (box && box.childElementCount === 0) {
            const g = bubble('assistant', t('chat_greeting'));
            g.classList.add('chat-greeting');
            box.appendChild(g);
            scrollToBottom();
        }
    });
    byId('ai-input').focus();
}

export function closeChatWidget() {
    const panel = byId('ai-widget');
    if (panel) panel.style.display = 'none';
    opened = false;
}