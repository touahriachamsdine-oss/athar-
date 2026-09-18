// Notification and Toast System
import { APP_CONFIG } from './config.js';
import { getCurrentLang } from './i18n.js';

export function showToast(notif) {
    const lang = getCurrentLang();
    const container = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = 'glass toast reveal active';

    const icons = { join: '👥', step: '✅', risk: '⚠️', rotate: '🔄' };
    const icon = icons[notif.type] || '✨';

    toast.innerHTML = `
        <div style="display:flex; gap:15px; align-items:center;">
            <div style="font-size:24px;">${icon}</div>
            <div>
                <div class="mono" style="font-size:14px; font-weight:bold;">${notif['title_' + lang]}</div>
                <div style="font-size:12px; opacity:0.8;">${notif['body_' + lang]}</div>
            </div>
        </div>
    `;

    toast.onclick = () => {
        if (notif.initiative_id) window.location.href = `/pages/initiative.html?id=${notif.initiative_id}`;
    };

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, APP_CONFIG.toastDuration);
}

function createToastContainer() {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.style.cssText = 'position:fixed; top:20px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px;';
    document.body.appendChild(el);
    return el;
}
