// Shared Helpers for Athar
export function sanitizeHTML(str) {
    const p = new DOMParser().parseFromString(str, 'text/html');
    return p.body.textContent || '';
}

export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function validateForm(fields) {
    const errors = {};
    let valid = true;

    if (fields.full_name && (fields.full_name.length < 2 || fields.full_name.length > 60)) {
        errors.full_name = '2-60 chars required';
        valid = false;
    }
    if (fields.phone && !/^(05|06|07)[0-9]{8}$/.test(fields.phone)) {
        errors.phone = 'Invalid Algerian format (05/06/07 + 8 digits)';
        valid = false;
    }
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
        errors.email = 'Invalid email address';
        valid = false;
    }
    if (fields.password && (fields.password.length < 8 || !/\d/.test(fields.password))) {
        errors.password = 'Min 8 chars, 1 number';
        valid = false;
    }

    return { valid, errors };
}

export function formatDate(date, lang = 'ar') {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : (lang === 'fr' ? 'fr-FR' : 'en-US'), {
        dateStyle: 'medium'
    }).format(new Date(date));
}

export function timeAgo(date, lang = 'ar') {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);

    const translations = {
        ar: { s: 'منذ ثوان', m: 'منذ دقيقة', h: 'منذ ساعة', d: 'منذ يوم' },
        fr: { s: 'il y a quelques secondes', m: 'il y a 1 min', h: 'il y a 1h', d: 'il y a 1 jour' },
        en: { s: 'seconds ago', m: '1 min ago', h: '1 hour ago', d: '1 day ago' }
    };

    if (diff < 60) return translations[lang].s;
    if (diff < 3600) return translations[lang].m;
    if (diff < 86400) return translations[lang].h;
    return translations[lang].d;
}

// ── Global Toast Notification System ──────────────────────────────────────────
// Usage: import { showToast } from '../src/js/utils.js';
//        showToast('Saved!', 'success');  // type: 'success' | 'error' | 'info'

export function showToast(message, type = 'success', durationMs = 3200) {
    let container = document.getElementById('athar-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'athar-toast-container';
        container.style.cssText = `
            position:fixed; bottom:30px; left:50%; transform:translateX(-50%);
            z-index:9999; display:flex; flex-direction:column;
            gap:10px; pointer-events:none; min-width:240px;
        `;
        document.body.appendChild(container);

        // Inject toast CSS once
        const style = document.createElement('style');
        style.textContent = `
            .athar-toast {
                padding:14px 28px; border-radius:14px;
                font-size:14px; font-weight:700; text-align:center;
                box-shadow:4px 4px 0px rgba(0,0,0,0.3);
                animation:atharToastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
                pointer-events:auto;
            }
            .athar-toast.out { animation:atharToastOut 0.25s ease forwards; }
            .athar-toast-success { background:var(--accent-cyan,#05D9E8); color:#000; }
            .athar-toast-error   { background:var(--accent-pink,#FF2A6D); color:#fff; }
            .athar-toast-info    { background:rgba(163,0,255,0.9); color:#fff; }
            @keyframes atharToastIn  { from{opacity:0;transform:translateY(16px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
            @keyframes atharToastOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(0.9)} }
        `;
        document.head.appendChild(style);
    }

    const el = document.createElement('div');
    el.className = `athar-toast athar-toast-${type}`;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
        el.classList.add('out');
        setTimeout(() => el.remove(), 280);
    }, durationMs);
}
