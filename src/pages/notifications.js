import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { injectLayout } from '../js/layout.js';
import { getCurrentLang } from '../js/i18n.js';
import { timeAgo } from '../js/utils.js';
import { ic } from '../js/icons.js';

const DICT = {
    ar: { page: 'التنبيهات', subtitle: 'آخر الأخبار والتحديثات', mark_all: '✓ تحديد الكل كمقروء', empty_state: 'لا توجد إشعارات بعد' },
    fr: { page: 'Notifications', subtitle: 'Dernières nouvelles et mises à jour', mark_all: '✓ Tout marquer comme lu', empty_state: 'Aucune notification pour l\'instant' },
    en: { page: 'Notifications', subtitle: 'Latest updates and news for you', mark_all: '✓ Mark all as read', empty_state: 'No notifications yet' }
};

// Mock notifications for demo
const MOCK_NOTIFS = [
    { id: '1', title_ar: 'تمت الموافقة على انضمامك لنادي الروبوتيك', title_fr: 'Votre adhésion au club robotique est approuvée', title_en: 'Your robotics club membership is approved', type: 'success', is_read: false, created_at: new Date(Date.now() - 1000*60*15).toISOString() },
    { id: '2', title_ar: 'دورة تدريبية جديدة متاحة: القيادة الشبابية', title_fr: 'Nouvelle formation disponible : Leadership jeunesse', title_en: 'New training available: Youth Leadership', type: 'info', is_read: false, created_at: new Date(Date.now() - 1000*60*60*2).toISOString() },
    { id: '3', title_ar: 'تم الرد على استشارتك رقم #3', title_fr: 'Votre consultation #3 a reçu une réponse', title_en: 'Your support request #3 has been answered', type: 'success', is_read: true, created_at: new Date(Date.now() - 1000*60*60*24).toISOString() },
    { id: '4', title_ar: 'تذكير: فعالية بيت الشباب غداً الساعة 10 صباحاً', title_fr: 'Rappel : Événement au foyer jeunes demain à 10h', title_en: 'Reminder: Youth hostel event tomorrow at 10 AM', type: 'warning', is_read: true, created_at: new Date(Date.now() - 1000*60*60*48).toISOString() }
];

const TYPE_COLORS = { success: 'var(--accent-cyan)', info: 'var(--accent-purple)', warning: 'var(--accent-amber)', error: 'var(--accent-pink)' };
const TYPE_ICONS  = { success: 'checkRound', info: 'bulb', warning: 'alert', error: 'x' };

async function init() {
    const auth = await requireAuth();
    if (!auth) return;
    injectLayout();

    const lang = getCurrentLang();
    const t = DICT[lang] || DICT.ar;
    document.getElementById('page-title').textContent = t.page;
    document.getElementById('page-subtitle').textContent = t.subtitle;
    document.getElementById('mark-all-btn').textContent = t.mark_all;

    // Real data in real mode; fall back to mock only in demo mode
    let notifs = [];
    if (localStorage.getItem('athar_mock_mode') === 'true') {
        try {
            const { data } = await neon.from('notifications').select().eq('user_id', auth.user.id);
            notifs = data && data.length ? data : MOCK_NOTIFS;
        } catch { notifs = MOCK_NOTIFS; }
    } else {
        const { data } = await neon.from('notifications').select().eq('user_id', auth.user.id);
        notifs = data || [];
    }
    notifs = [...notifs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const titleKey = lang === 'fr' ? 'title_fr' : (lang === 'en' ? 'title_en' : 'title_ar');
    const list = document.getElementById('notif-list');

    if (!notifs.length) {
        list.innerHTML = `<div class="empty-state"><div>${ic('bell', 26)}</div><p>${t.empty_state}</p></div>`;
        return;
    }

    list.innerHTML = notifs.map(n => `
        <div class="notif-card ${!n.is_read ? 'unread' : ''}" data-id="${n.id}">
            <div style="display:flex; align-items:flex-start; gap:15px;">
                <div style="display:flex; margin-top:2px;">${ic(TYPE_ICONS[n.type] || 'bell', 22)}</div>
                <div style="flex:1;">
                    <div style="font-size:15px; font-weight:${n.is_read ? '500' : '700'}; line-height:1.5;">
                        ${n[titleKey] || n.title_ar}
                    </div>
                    <div class="mono" style="font-size:11px; opacity:0.75; margin-top:6px;">
                        ${timeAgo(n.created_at, lang)}
                    </div>
                </div>
                ${!n.is_read ? `<div class="notif-dot" style="margin-top:6px;"></div>` : ''}
            </div>
        </div>
    `).join('');

    // Mark all read
    document.getElementById('mark-all-btn').onclick = () => {
        document.querySelectorAll('.notif-card.unread').forEach(el => {
            el.classList.remove('unread');
            el.querySelector('.notif-dot')?.remove();
            el.querySelector('div[style*="font-weight:700"]')?.setAttribute('style', 'font-size:15px; font-weight:500; line-height:1.5;');
        });
    };
}
init();