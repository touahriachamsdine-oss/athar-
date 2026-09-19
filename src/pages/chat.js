// Athar AI Assistant — client (read-only consultant, Groq via /api/ai)
import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { getCurrentLang, TRANSLATIONS } from '../js/i18n.js';

const LANGS = ['ar', 'fr', 'en', 'amz'];
let chatLang = localStorage.getItem('athar_lang') || 'ar';
if (!LANGS.includes(chatLang)) chatLang = 'ar';
let context = null;
let busy = false;
const history = [];

function byId(id) { return document.getElementById(id); }

function t(key) {
    const dict = TRANSLATIONS[chatLang] || TRANSLATIONS.ar;
    return dict[key] || TRANSLATIONS.ar[key] || key;
}

function bubble(role, text) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;' + (role === 'user' ? 'justify-content:flex-end;' : 'justify-content:flex-start;');
    const b = document.createElement('div');
    b.className = role === 'user' ? 'ai-bubble-user' : 'ai-bubble-assistant';
    b.style.cssText = 'padding:12px 16px; border-radius:16px; font-size:14px; line-height:1.7; white-space:pre-wrap; word-break:break-word;';
    b.textContent = text;
    wrap.appendChild(b);
    return wrap;
}

function renderBubble(role, text) {
    const box = byId('chat-messages');
    box.appendChild(bubble(role, text));
    box.scrollTop = box.scrollHeight;
}

function showTyping() {
    const box = byId('chat-messages');
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; justify-content:flex-start;';
    wrap.dataset.typing = '1';
    const b = document.createElement('div');
    b.style.cssText = 'max-width:78%; padding:14px 18px; border-radius:16px; font-size:14px; background:rgba(255,255,255,0.05);';
    b.innerHTML = '<div class="typing-dots" aria-label="typing"><span></span><span></span><span></span></div>';
    wrap.appendChild(b);
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
}

function hideTyping() {
    const box = byId('chat-messages');
    const el = box.querySelector('[data-typing="1"]');
    if (el) el.remove();
}

function setStaticUI() {
    document.documentElement.lang = chatLang === 'amz' ? 'ar' : chatLang;
    document.documentElement.dir = (chatLang === 'ar' || chatLang === 'amz') ? 'rtl' : 'ltr';
    byId('chat-title').textContent = t('chat_title');
    byId('chat-subtitle').textContent = t('chat_subtitle');
    byId('chat-lang-label').textContent = t('chat_lang');
    byId('chat-input').placeholder = t('chat_placeholder');
    byId('chat-lang').value = chatLang;

    const chips = [
        'chat_suggest_club', 'chat_suggest_volunteer',
        'chat_suggest_points', 'chat_suggest_register'
    ];
    const holder = byId('chat-suggestions');
    holder.innerHTML = '';
    chips.forEach(key => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ai-chip';
        chip.style.cssText = 'padding:7px 14px; font-size:12px;';
        chip.textContent = t(key);
        chip.onmouseenter = () => { chip.style.background = 'rgba(5,217,232,0.14)'; };
        chip.onmouseleave = () => { chip.style.background = 'rgba(5,217,232,0.06)'; };
        chip.onclick = () => sendChip(key);
        holder.appendChild(chip);
    });
}

function sendChip(key) {
    const dict = TRANSLATIONS[chatLang] || TRANSLATIONS.ar;
    const question = dict[key] || TRANSLATIONS.ar[key];
    const input = byId('chat-input');
    input.value = question;
    input.focus();
    send(false);
}

function clearGreetingIfPresent() {
    const box = byId('chat-messages');
    const first = box.firstElementChild;
    if (first && first.classList && first.classList.contains('chat-greeting')) box.removeChild(first);
}

async function send() {
    if (busy) return;
    const input = byId('chat-input');
    const text = input.value.trim().slice(0, 600);
    if (!text) return;
    clearGreetingIfPresent();
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
        let reply = data && data.reply;
        if (!res.ok || !reply) {
            const code = data && data.error && data.error.code;
            reply = code === 'unconfigured' ? t('chat_offline') : t('chat_offline');
        }
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

async function init() {
    const auth = await requireAuth({ guests: true });
    if (auth && auth.user && !auth.guest) {
        try {
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
        } catch (e) { /* personalization is best-effort */ }
    }

    setStaticUI();
    const greeting = bubble('assistant', t('chat_greeting'));
    greeting.classList.add('chat-greeting');
    byId('chat-messages').appendChild(greeting);

    byId('chat-lang').onchange = (e) => {
        chatLang = e.target.value;
        setStaticUI();
    };
    byId('chat-form').onsubmit = (e) => { e.preventDefault(); send(); };
}

init();