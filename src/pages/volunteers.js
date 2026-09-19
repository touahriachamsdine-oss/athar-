import { requireAuth, requireUser } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';
import { esc } from '../js/utils.js';
import { APP_CONFIG } from '../js/config.js';

const DICT = {
    ar: {
        title: 'العمل التطوعي والأنشطة',
        subtitle: 'انخرط في أنشطة تطوعية منظمة واكسب نقاط الأثر',
        create_btn: 'إنشاء نشاط تطوعي',
        create_title: 'إنشاء نشاط تطوعي جديد',
        queue_title: 'بانتظار موافقة الإدارة',
        available_title: 'الأنشطة المتاحة',
        approve: 'موافقة',
        reject: 'رفض',
        signup: 'سجل في النشاط',
        cancel_signup: 'إلغاء التسجيل',
        joined: 'مسجل ✓',
        full: 'اكتمل العدد',
        past: 'انتهى النشاط',
        complete: 'إنهاء وإسناد النقاط',
        completed: 'منتهي ✓',
        rejected: 'مرفوض',
        seats: 'العدد الأقصى: ',
        seats_left: 'متبقية',
        date: 'التاريخ: ',
        you: 'أنت',
        no_sessions: 'لا توجد أنشطة تطوعية حالياً.',
        no_queue: 'لا توجد أنشطة بانتظار الموافقة.',
        err_signup: 'تعذر التسجيل في النشاط',
        err_rpc: 'تعذر تنفيذ العملية. تأكد من صلاحياتك أو امتلاء الحجز.',
        ok_created: 'تم إنشاء النشاط وستُراجع من الإدارة.',
        ok_signup: 'تم تسجيلك في النشاط بنجاح!',
        ok_cancelled: 'تم إلغاء تسجيلك في النشاط.',
        ok_completed: 'تم إنهاء النشاط وإسناد نقاط الأثر للمشاركين.',
        ok_approved: 'تمت الموافقة على النشاط.',
        ok_rejected: 'تم رفض النشاط.',
        reason_prompt: 'سبب الرفض:',
        heat_title: 'خريطة النشاط في الجزائر',
        heat_sub: 'مناطق العمل التطوعي النشط في الوقت الحقيقي — كلما زادت الحرارة زادت الحركة',
        heat_low: 'قليل',
        heat_mid: 'متوسط',
        heat_high: 'عالٍ',
        stories_title: 'لقطات الأثر',
        stories_sub: 'أدلة ميدانية عابرة تختفي بعد 24 ساعة — شارك ما تفعله الآن',
        post_story: 'شارك لقطة',
        story_ph: 'ماذا تفعل الآن في الميدان؟',
        share: 'نشر',
        story_likes: 'تفاعل',
        expired: 'انتهت',
        live: 'مباشر',
        emergency_title: 'تنبيه استجابة عاجلة',
        emergency_sub: 'حاجة ميدانية طارئة — فرق الاستجابة تتجمع الآن، انضم قبل انتهاء المهلة',
        join_now: 'انضم الآن',
        squad_title: 'فرق الاستجابة',
        squad_sub: 'فرق نشطة في الميدان الآن — كن جزءاً من الحركة',
        lb_title: 'لوحة الأثر والتفاعل',
        lb_sub: 'أعلى الأعضاء تفاعلاً والأكثر أثراً',
        lb_points: 'نقطة',
        lb_you: 'أنت',
        lb_empty: 'لا يوجد أعضاء بعد.',
        guest_banner: 'أنت تتصفح أمثلة تفاعلية كاملة — سجّل الدخول للانضمام والتفاعل',
        guest_btn: 'تسجيل الدخول',
        need_login: 'سجّل الدخول أولاً للتفاعل والمشاركة',
        rank_label: 'الترتيب',
        close: 'إغلاق',
        missions: 'مهمة'
    },
    fr: {
        title: 'Bénévolat & Activités',
        subtitle: 'Participez à des activités de bénévolat organisées et gagnez des points',
        create_btn: 'Créer une activité',
        create_title: 'Créer une nouvelle activité de bénévolat',
        queue_title: 'En attente d\'approbation',
        available_title: 'Activités disponibles',
        approve: 'Approuver',
        reject: 'Rejeter',
        signup: 'S\'inscrire',
        cancel_signup: 'Annuler',
        joined: 'Inscrit ✓',
        full: 'Complet',
        past: 'Terminé',
        complete: 'Clôturer & créditer',
        completed: 'Clôturé ✓',
        rejected: 'Rejeté',
        seats: 'Capacité : ',
        seats_left: 'disponibles',
        date: 'Date : ',
        you: 'Vous',
        no_sessions: 'Aucune activité de bénévolat pour le moment.',
        no_queue: 'Aucune activité en attente d\'approbation.',
        err_signup: 'Inscription impossible',
        err_rpc: 'Opération impossible. Vérifiez vos permissions ou la disponibilité.',
        ok_created: 'Activité créée, en attente de validation par l\'administration.',
        ok_signup: 'Inscription réussie !',
        ok_cancelled: 'Inscription annulée.',
        ok_completed: 'Activité clôturée et points d\'impact crédités.',
        ok_approved: 'Activité approuvée.',
        ok_rejected: 'Activité rejetée.',
        reason_prompt: 'Motif du rejet :',
        heat_title: 'Carte de Chaleur d\'Activité',
        heat_sub: 'Les zones de bénévolat actif en temps réel — plus c\'est chaud, plus ça bouge',
        heat_low: 'Faible',
        heat_mid: 'Moyen',
        heat_high: 'Élevé',
        stories_title: 'Stories d\'Impact',
        stories_sub: 'Preuves de terrain éphémères — 24h puis disparition',
        post_story: 'Publier une story',
        story_ph: 'Que faites-vous sur le terrain ?',
        share: 'Partager',
        story_likes: 'J\'aime',
        expired: 'Expirée',
        live: 'En direct',
        emergency_title: 'Alerte Urgence',
        emergency_sub: 'Besoin urgent sur le terrain — les squads se mobilisent maintenant',
        join_now: 'Rejoindre',
        squad_title: 'Squads de Réponse',
        squad_sub: 'Des équipes actives sur le terrain — rejoignez le mouvement',
        lb_title: 'Classement Impact & Engagement',
        lb_sub: 'Les membres les plus actifs',
        lb_points: 'pts',
        lb_you: 'Vous',
        lb_empty: 'Aucun membre.',
        guest_banner: 'Vous naviguez en démo complète — connectez-vous pour participer',
        guest_btn: 'Se connecter',
        need_login: 'Connectez-vous d\'abord pour interagir',
        rank_label: 'Rang',
        close: 'Fermer',
        missions: 'mission'
    },
    en: {
        title: 'Volunteering & Activities',
        subtitle: 'Join organized volunteer sessions and earn impact points',
        create_btn: 'Create Session',
        create_title: 'Create a new volunteer session',
        queue_title: 'Awaiting admin approval',
        available_title: 'Available sessions',
        approve: 'Approve',
        reject: 'Reject',
        signup: 'Sign up',
        cancel_signup: 'Cancel',
        joined: 'Registered ✓',
        full: 'Full',
        past: 'Ended',
        complete: 'Complete & award points',
        completed: 'Completed ✓',
        rejected: 'Rejected',
        seats: 'Capacity: ',
        seats_left: 'left',
        date: 'Date: ',
        you: 'You',
        no_sessions: 'No volunteer sessions right now.',
        no_queue: 'No sessions awaiting approval.',
        err_signup: 'Unable to register',
        err_rpc: 'Operation failed. Check your permissions or seat availability.',
        ok_created: 'Session created and sent for admin review.',
        ok_signup: 'You are registered!',
        ok_cancelled: 'Registration cancelled.',
        ok_completed: 'Session completed and impact points awarded.',
        ok_approved: 'Session approved.',
        ok_rejected: 'Session rejected.',
        reason_prompt: 'Rejection reason:',
        heat_title: 'Algeria Activity Heatmap',
        heat_sub: 'Live volunteer activity across Algeria — the hotter the dot, the more action',
        heat_low: 'Low',
        heat_mid: 'Medium',
        heat_high: 'High',
        stories_title: 'Impact Stories',
        stories_sub: 'Ephemeral field proof — gone after 24 hours',
        post_story: 'Post a story',
        story_ph: 'What are you doing on the field?',
        share: 'Share',
        story_likes: 'Like',
        expired: 'Expired',
        live: 'LIVE',
        emergency_title: 'Flash Squad Alert',
        emergency_sub: 'Urgent field need — response squads are mobilizing now',
        join_now: 'Join now',
        squad_title: 'Response Squads',
        squad_sub: 'Active teams on the ground — be part of the action',
        lb_title: 'Impact Leaderboard',
        lb_sub: 'Most engaged and impactful members',
        lb_points: 'pts',
        lb_you: 'You',
        lb_empty: 'No members yet.',
        guest_banner: 'You are browsing full interactive examples — sign in to join and engage',
        guest_btn: 'Sign in',
        need_login: 'Sign in first to engage and participate',
        rank_label: 'Rank',
        close: 'Close',
        missions: 'mission'
    }
};

let lang = 'ar';
let sess = null;
let sessions = [];
let signups = [];
let stories = [];
let profiles = [];
let myInitiativeRoles = {};
let adminInitiatives = [];
let isAdmin = false;

const STORY_PALETTES = [
    ['#ff2a6d', '#7209b7'],
    ['#06d6a0', '#0077b6'],
    ['#ffbe0b', '#fb5607'],
    ['#4cc9f0', '#4361ee'],
    ['#8ac926', '#2a9d8f']
];
const STORY_TTL = 24 * 3600000;
const STICKERS = ['🧤', '🌱', '🚰', '🌊', '🎨', '📦', '🏥', '🤝'];
const GEO = { lonMin: -8.7, lonMax: 10.2, latMin: 18.9, latMax: 37.4 };
const MAP_W = 620;
const MAP_H = 620;
const PAD = 46;
const OUTLINE = [
    [-2.3, 35.0], [-1.3, 35.35], [-0.5, 35.7], [0.1, 35.95], [0.9, 36.4], [1.9, 36.65],
    [3.0, 36.7], [3.9, 36.5], [4.9, 36.7], [5.9, 36.9], [6.9, 36.9], [7.7, 36.95],
    [8.5, 36.85], [8.6, 36.1], [8.1, 35.3], [8.6, 34.9], [8.2, 34.2], [8.4, 33.6],
    [9.0, 32.6], [9.6, 31.2], [9.8, 29.8], [9.6, 28.2], [9.2, 26.8], [9.5, 25.3],
    [8.6, 23.8], [7.4, 21.9], [9.0, 19.7], [4.5, 19.6], [2.5, 19.7], [1.0, 20.3],
    [0.0, 20.8], [-1.2, 21.6], [-2.6, 22.7], [-3.6, 24.1], [-4.6, 25.6], [-5.6, 27.1],
    [-8.1, 27.2], [-8.2, 26.0], [-6.5, 27.9], [-3.5, 29.6], [-1.5, 30.5], [0.0, 31.0],
    [-1.0, 32.2], [-1.8, 33.4], [-2.3, 35.0]
];

const project = (lat, lng) => [
    PAD + (lng - GEO.lonMin) / (GEO.lonMax - GEO.lonMin) * (MAP_W - 2 * PAD),
    PAD + (GEO.latMax - lat) / (GEO.latMax - GEO.latMin) * (MAP_H - 2 * PAD)
];

const storyAge = (s) => new Date().getTime() - new Date(s.created_at).getTime();
const storyAlive = (s) => storyAge(s) < STORY_TTL;
const storyHoursLeft = (s) => Math.max(0, Math.ceil((STORY_TTL - storyAge(s)) / 3600000));

const uid = () => sess && sess.user ? sess.user.id : null;

function t(key) { return (DICT[lang] || DICT.ar)[key] || key; }

const fmt = (iso) => {
    try {
        return new Date(iso).toLocaleString(lang === 'ar' ? 'ar-DZ' : (lang === 'fr' ? 'fr-FR' : 'en-US'), {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return iso; }
};

const titleOf = (s) => esc(lang === 'ar' ? s.title_ar : (lang === 'fr' ? s.title_fr : s.title_en));
const descOf = (s) => esc(lang === 'ar' ? s.description_ar : (lang === 'fr' ? s.description_fr : s.description_en));

function wilayaHeat() {
    const heat = {};
    APP_CONFIG.wilayas.forEach(w => heat[w] = 0);
    sessions.forEach(s => {
        if (s.status !== 'approved' && s.status !== 'completed' && s.status !== 'pending') return;
        if (!s.location) return;
        const w = APP_CONFIG.wilayas.find(x => s.location.toLowerCase().includes(x.toLowerCase()));
        if (w) heat[w] += 1;
    });
    stories.filter(storyAlive).forEach(s => {
        if (heat[s.wilaya] !== undefined) heat[s.wilaya] += 1;
    });
    return heat;
}

function heatColor(r) {
    if (r <= 0) return '#3a4060';
    if (r < 0.34) return '#05d9e8';
    if (r < 0.67) return '#ffbe0b';
    return '#ff2a6d';
}

function renderHeatmap() {
    const heat = wilayaHeat();
    const max = Math.max(1, ...Object.values(heat));
    const top = Object.entries(heat).sort((a, b) => b[1] - a[1]).slice(0, 3).filter(x => x[1] > 0).map(x => x[0]);
    const path = OUTLINE.map(([lat, lng]) => {
        const [x, y] = project(lat, lng);
        return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');

    const dots = APP_CONFIG.wilayas.map((w, i) => {
        const [lat, lng] = APP_CONFIG.wilayaCoords[i];
        const [x, y] = project(lat, lng);
        const count = heat[w];
        const ratio = count / max;
        const r = (4.5 + 9 * ratio).toFixed(1);
        const pulse = top.includes(w) && ratio >= 0.5 ? `<circle class="hot-pulse" cx="${x}" cy="${y}" r="${(r * 2.1).toFixed(1)}" fill="none" stroke="${heatColor(ratio)}"></circle>` : '';
        const label = count > 0
            ? `<text x="${x}" y="${(y - r - 5).toFixed(1)}" text-anchor="middle" class="heat-label" fill="#d8d9ef" opacity="0.9">${esc(w)}</text>`
            : '';
        return `${pulse}
            <circle cx="${x}" cy="${y}" r="${r}" fill="${heatColor(ratio)}" opacity="${count > 0 ? 0.95 : 0.28}">
                <title>${esc(w)} — ${count} ${t('lb_points')}</title>
            </circle>${label}`;
    }).join('\n');

    document.getElementById('heat-map').innerHTML = `
        <svg viewBox="0 0 ${MAP_W} ${MAP_H}" xmlns="http://www.w3.org/2000/svg" class="heat-svg" role="img" aria-label="Algeria activity heatmap">
            <polygon points="${path}" fill="rgba(20,22,42,0.55)" stroke="rgba(255,255,255,0.14)" stroke-width="1"></polygon>
            ${dots}
        </svg>`;
    document.getElementById('heat-legend').innerHTML = `
        <div class="heat-cell"><span class="heat-swatch" style="background:#3a4060"></span> ${t('heat_low')}</div>
        <div class="heat-cell"><span class="heat-swatch" style="background:#05d9e8"></span> ${t('heat_mid')}</div>
        <div class="heat-cell"><span class="heat-swatch" style="background:#ffbe0b"></span> ${t('heat_high')}</div>
        <div class="heat-cell"><span class="heat-swatch" style="background:#ff2a6d"></span> ${t('heat_high')} 🔥</div>`;
}

function renderStories() {
    const grid = document.getElementById('stories-grid');
    const alive = stories.filter(storyAlive).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const meId = uid();
    grid.innerHTML = alive.length
        ? alive.map(s => {
            const [c1, c2] = STORY_PALETTES[s.palette % STORY_PALETTES.length];
            const liked = (s.likes || []).includes(meId);
            return `
            <button class="story-card" data-story="${s.id}" style="background:linear-gradient(150deg,${c1},${c2});" data-lang="story">
                <span class="story-sticker">${s.sticker || '📸'}</span>
                <span class="story-wilaya">📍 ${esc(s.wilaya || '')}</span>
                <span class="story-time">⏳ ${storyHoursLeft(s)}h</span>
                <span class="story-likes">${liked ? '❤️' : '🤍'} ${(s.likes || []).length}</span>
            </button>`;
        }).join('')
        : `<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:40px;">${t('lb_empty')}</div>`;

    grid.querySelectorAll('.story-card').forEach(btn => {
        btn.onclick = () => openStoryViewer(alive.find(s => s.id === btn.getAttribute('data-story')));
    });
}

function openStoryViewer(story) {
    if (!story) return;
    const meId = uid();
    const [c1, c2] = STORY_PALETTES[story.palette % STORY_PALETTES.length];
    const liked = (story.likes || []).includes(meId);
    const overlay = document.getElementById('story-viewer');
    overlay.style.display = 'flex';
    overlay.innerHTML = `
        <div class="story-view" style="background:linear-gradient(160deg,${c1},${c2});">
            <div class="story-view-head">
                <div class="story-view-author"><strong>${esc(story.author || '')}</strong> · 📍 ${esc(story.wilaya || '')}</div>
                <div class="story-view-time">⏳ ${storyHoursLeft(story)}h — ${t('live')}</div>
            </div>
            <div class="story-view-art">${story.sticker || '📸'}</div>
            <div class="story-view-cap">${esc(lang === 'ar' ? story.caption_ar : lang === 'fr' ? story.caption_fr : story.caption_en)}</div>
            <div class="story-view-actions">
                ${meId ? `<button class="btn btn-primary" id="sv-like">${liked ? '❤️' : '🤍'} ${t('story_likes')} (${(story.likes || []).length})</button>` : ''}
                <button class="btn btn-outline" id="sv-close">${t('close')}</button>
            </div>
        </div>`;
    const close = () => { overlay.style.display = 'none'; overlay.innerHTML = ''; };
    document.getElementById('sv-close').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    if (meId) {
        const storeId = story.id;
        document.getElementById('sv-like').onclick = async () => {
            if (!requireUser(sess)) return;
            await neon.rpc('like_volunteer_story', { p_story_id: storeId });
            await loadStories();
            openStoryViewer(stories.find(s => s.id === storeId));
        };
    }
}

function renderSquads() {
    const grid = document.getElementById('squads-grid');
    const upcoming = sessions.filter(s => s.status === 'approved' && new Date(s.end_at) > new Date());
    const wilayas = [...new Set(upcoming.map(s => (s.location || '').split(',').pop().trim()).filter(Boolean))];
    grid.innerHTML = wilayas.length
        ? wilayas.map((w, i) => {
            const sq = upcoming.filter(s => (s.location || '').toLowerCase().includes(w.toLowerCase()));
            const members = sq.reduce((n, s) => n + signups.filter(x => x.session_id === s.id && ['registered', 'attended'].includes(x.status)).length, 0);
            const hours = sq.reduce((n, s) => n + (new Date(s.end_at) - new Date(s.start_at)) / 3600000, 0);
            return `<button class="squad-chip" data-wilaya="${esc(w)}"><span>${i % 2 ? '🤝' : '⚡'}</span><strong>${esc(w)}</strong><small>${sq.length} ${t('missions')} · ${members} 👥 · ${hours}h</small></button>`;
        }).join('')
        : `<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:30px;">${t('no_sessions')}</div>`;

    grid.querySelectorAll('.squad-chip').forEach(chip => {
        chip.onclick = () => {
            const w = chip.getAttribute('data-wilaya');
            const target = [...document.querySelectorAll('.vs-card')].find(c => c.textContent.includes(w));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
    });

    const em = document.getElementById('emergency-strip');
    const emS = sessions.find(s => s.is_emergency && s.status === 'approved' && new Date(s.end_at) > new Date());
    if (emS) {
        em.style.display = 'flex';
        const seated = signups.filter(x => x.session_id === emS.id && ['registered', 'attended'].includes(x.status)).length;
        const minutesLeft = Math.max(0, Math.ceil((new Date(emS.end_at) - new Date()) / 60000));
        em.innerHTML = `
            <div style="flex:1">
                <strong>🚨 ${t('emergency_title')} — ${esc(lang === 'ar' ? emS.title_ar : lang === 'fr' ? emS.title_fr : emS.title_en)}</strong>
                <div style="opacity:0.75; font-size:13px; margin-top:4px;">${t('emergency_sub')} · ${esc(emS.location || '')} · ⏳ ${minutesLeft} min · 👥 ${seated}/${emS.capacity}</div>
            </div>
            <button class="btn btn-primary act" data-act="signup" data-id="${emS.id}" style="padding:10px 24px;">${t('join_now')}</button>`;
        em.querySelector('.act').onclick = () => act('signup', emS.id, em.querySelector('.act'));
    } else {
        em.style.display = 'none';
    }
}

function engagementScore(userId) {
    const rsvps = signups.filter(x => String(x.volunteer_id) === String(userId) && ['registered', 'attended'].includes(x.status)).length;
    const posts = stories.filter(x => String(x.user_id) === String(userId)).length;
    const likesReceived = stories.filter(x => String(x.user_id) === String(userId)).reduce((n, x) => n + (x.likes || []).length, 0);
    return { rsvps, posts, likesReceived, score: rsvps * 10 + posts * 5 + likesReceived * 2 };
}

function renderLeaderboard() {
    const rows = profiles
        .map(p => ({ p, ...engagementScore(p.id) }))
        .filter(r => (r.rsvps + r.posts + r.likesReceived + (r.p.impact_points || 0)) > 0)
        .sort((a, b) => b.score - a.score);
    const meId = uid();
    const medals = ['🥇', '🥈', '🥉'];
    const list = rows.slice(0, 5);
    if (meId && !list.some(r => String(r.p.id) === String(meId))) {
        const mine = rows.find(r => String(r.p.id) === String(meId));
        if (mine) list.push(mine);
    }
    document.getElementById('lb-grid').innerHTML = list.length
        ? list.map((r, i) => {
            const isMe = String(r.p.id) === String(meId);
            return `
            <div class="lb-row ${isMe ? 'lb-me' : ''}">
                <span class="lb-medal">${medals[i] || (i + 1)}</span>
                <span class="lb-name">${esc(r.p.full_name || '…')} ${isMe ? '<small style="opacity:0.5">(' + t('lb_you') + ')</small>' : ''}</span>
                <span class="lb-stats">${t('rank_label')} ${i + 1} · RSVP ${r.rsvps} · 📸 ${r.posts} · ❤️ ${r.likesReceived}</span>
                <strong class="lb-score">${r.score} ${t('lb_points')}</strong>
            </div>`;
        }).join('')
        : `<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:30px;">${t('lb_empty')}</div>`;
}

function styleGuestMode() {
    const banner = document.getElementById('guest-banner');
    if (banner) banner.style.display = uid() ? 'none' : 'flex';
}

function mySignup(sessionId) {
    return signups.find(x => x.session_id === sessionId && x.volunteer_id === uid());
}

function canManage(sessionId) {
    if (isAdmin) return true;
    const s = sessions.find(x => x.id === sessionId);
    if (!s) return false;
    return !!myInitiativeRoles[s.initiative_id];
}

function renderCard(s) {
    const signup = mySignup(s.id);
    const past = new Date(s.end_at) <= new Date();
    const seated = signups.filter(x => x.session_id === s.id && ['registered', 'attended'].includes(x.status)).length;
    const seatsLeft = Math.max(0, s.capacity - seated);
    const statusClass = s.status === 'approved' ? 'approved' : (s.status === 'pending' ? 'pending' : (s.status === 'completed' ? 'completed' : 'rejected'));
    const statusLabel = lang === 'ar' ? (s.status === 'approved' ? 'معتمد' : s.status === 'pending' ? 'قيد المراجعة' : s.status === 'completed' ? 'منتهي' : 'مرفوض')
        : (s.status === 'approved' ? 'APPROVED' : s.status === 'pending' ? 'PENDING' : s.status === 'completed' ? 'DONE' : 'REJECTED');
    const mineTxt = canManage(s.id) ? ` <span style="background:rgba(163,0,255,0.14); color:var(--accent-purple); padding:2px 10px; border-radius:100px; font-size:10px; font-weight:800;">${t('you')}</span>` : '';

    let action = '';
    if (s.status === 'approved' && !past) {
        if (signup && (signup.status === 'registered' || signup.status === 'attended')) {
            action = `<button class="btn btn-outline act" data-act="cancel" data-id="${s.id}" style="width:100%; justify-content:center;">${t('cancel_signup')}</button>`;
        } else if (seatsLeft <= 0) {
            action = `<button class="btn btn-outline" style="width:100%; justify-content:center;" disabled>${t('full')}</button>`;
        } else {
            action = `<button class="btn btn-primary act" data-act="signup" data-id="${s.id}" style="width:100%; justify-content:center;">${t('signup')}</button>`;
        }
    } else if (s.status === 'approved' && past && canManage(s.id) && s.status !== 'completed') {
        action = `<button class="btn btn-primary act" data-act="complete" data-id="${s.id}" style="width:100%; justify-content:center;">${t('complete')}</button>`;
    } else {
        action = `<div style="text-align:center; font-size:12px; font-weight:800; opacity:0.5;">${
            s.status === 'completed' ? t('completed') : s.status === 'rejected' ? t('rejected') : t('past')
        }</div>`;
    }

    return `
        <div class="vs-card">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:14px;">
                <span class="status-pill ${statusClass}">${statusLabel}</span>${mineTxt}
            </div>
            <h3 class="syne mb-10" style="font-size:19px; font-weight:800;">${titleOf(s)}</h3>
            <p style="font-size:13px; opacity:0.65; line-height:1.6; margin-bottom:18px; flex:1;">${descOf(s) || ''}</p>
            <div class="vs-row" style="margin-bottom:6px;">📍 ${esc(s.location || '')}</div>
            <div class="vs-row" style="margin-bottom:18px;">📅 ${fmt(s.start_at)}</div>
            <div class="vs-row" style="margin-bottom:20px;">🪑 ${t('seats')}${s.capacity} ${s.status === 'approved' ? '— ' + seatsLeft + ' ' + t('seats_left') : ''}</div>
            ${action}
        </div>`;
}

function renderQueue(s) {
    return `
        <div class="vs-card">
            <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:14px;">
                <span class="status-pill pending">PENDING</span>
            </div>
            <h3 class="syne mb-10" style="font-size:19px; font-weight:800;">${titleOf(s)}</h3>
            <p style="font-size:13px; opacity:0.65; line-height:1.6; margin-bottom:18px; flex:1;">${descOf(s) || ''}</p>
            <div class="vs-row" style="margin-bottom:18px;">📅 ${fmt(s.start_at)} — 📍 ${esc(s.location || '')}</div>
            ${isAdmin ? `
            <div style="display:flex; gap:12px;">
                <button class="btn btn-primary act" data-act="approve" data-id="${s.id}" style="flex:1; justify-content:center;">${t('approve')}</button>
                <button class="btn btn-outline act" data-act="reject" data-id="${s.id}" style="flex:1; justify-content:center;">${t('reject')}</button>
            </div>` : ''}
        </div>`;
}

async function load() {
    const ss = await Promise.all([
        neon.from('volunteer_sessions').select(),
        neon.from('volunteer_signups').select(),
        neon.from('volunteer_stories').select(),
        neon.from('profiles').select(),
        uid() ? neon.from('initiative_members').select().eq('user_id', uid()) : Promise.resolve({ data: [] })
    ]);
    sessions = ss[0].data || [];
    signups = ss[1].data || [];
    stories = ss[2].data || [];
    profiles = ss[3].data || [];
    const mem = ss[4].data || [];
    myInitiativeRoles = {};
    mem.forEach(m => { if (m.role === 'founder' || m.role === 'leader') myInitiativeRoles[m.initiative_id] = m.role; });

    renderHeatmap();
    renderStories();
    renderSquads();
    renderLeaderboard();
    styleGuestMode();

    const adminRes = isAdmin ? await neon.from('initiatives').select() : null;
    adminInitiatives = isAdmin ? ((adminRes && adminRes.data) || []).filter(i => i.is_approved) : [];
    const leaderInitiatives = (await Promise.all(
        Object.keys(myInitiativeRoles).map(id => neon.from('initiatives').select().id(id))
    )).flatMap(r => (r.data || []).filter(i => i.is_approved));

    const createInit = [...new Map([...leaderInitiatives, ...adminInitiatives].map(i => [i.id, i])).values()];
    const cInit = document.getElementById('c-init');
    cInit.innerHTML = createInit.map(i => `<option value="${i.id}">${esc(lang === 'ar' ? i.title_ar : lang === 'fr' ? i.title_fr : i.title_en)}</option>`).join('')
        || '<option value="">—</option>';

    document.getElementById('btn-create').style.display = (createInit.length > 0) ? 'inline-flex' : 'none';

    const canSeeQueue = isAdmin || Object.keys(myInitiativeRoles).length > 0;
    const queueEl = document.getElementById('queue-wrap');
    if (canSeeQueue) {
        queueEl.style.display = 'block';
        const pending = sessions.filter(s => s.status === 'pending');
        document.getElementById('lbl-queue-title').innerText = `${t('queue_title')} (${pending.length})`;
        document.getElementById('queue-grid').innerHTML = pending.length
            ? pending.map(renderQueue).join('')
            : `<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:40px;">${t('no_queue')}</div>`;
    } else {
        queueEl.style.display = 'none';
    }

    const available = sessions.filter(s => s.status === 'approved');
    document.getElementById('sessions-grid').innerHTML = available.length
        ? available.map(renderCard).join('')
        : `<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:50px;">${t('no_sessions')}</div>`;

    document.querySelectorAll('.act').forEach(btn => {
        btn.onclick = () => act(btn.getAttribute('data-act'), btn.getAttribute('data-id'), btn);
    });
}

async function act(action, id, el) {
    if (!requireUser(sess)) {
        alert(t('need_login'));
        return;
    }
    if (!uid()) return;
    const payloads = {
        signup: { p_session_id: id, p_volunteer_id: uid() },
        cancel: { p_session_id: id, p_volunteer_id: uid() },
        complete: { p_session_id: id },
        approve: { p_session_id: id },
        reject: { p_session_id: id, p_reason: prompt(t('reason_prompt')) || 'requested change' }
    };
    const res = await neon.rpc(
        action === 'signup' ? 'signup_to_session'
        : action === 'cancel' ? 'cancel_signup'
        : action + '_session',
        payloads[action]
    );
    const ok = action === 'approve' ? res.data && res.data.status === 'approved'
        : action === 'reject' ? res.data && res.data.status === 'rejected'
        : action === 'complete' ? res.data && res.data.status === 'completed'
        : action === 'signup' ? res.data && (res.data.status === 'registered' || res.error && res.error.code === 'conflict')
        : action === 'cancel' ? res.data && res.data.status === 'cancelled'
        : false;

    const msg = action === 'signup' ? (res.error && res.error.code === 'conflict' ? t('err_signup') : t('ok_signup'))
        : action === 'cancel' ? t('ok_cancelled')
        : action === 'complete' ? t('ok_completed')
        : action === 'approve' ? t('ok_approved')
        : action === 'reject' ? t('ok_rejected')
        : res.error ? (res.error.message || t('err_rpc')) : t('err_rpc');
    alert(ok ? msg : (res.error && res.error.message) || msg);
    load();
}

async function loadStories() {
    const r = await neon.from('volunteer_stories').select();
    stories = r.data || [];
    renderStories();
    renderSquads();
    renderLeaderboard();
    renderHeatmap();
}

async function init() {
    sess = await requireAuth({ guests: true });
    if (!sess) return;
    lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;
    setLanguage(lang);
    injectLayout();

    isAdmin = sess.profile && (sess.profile.role === 'admin' || sess.profile.role === 'superadmin');

    document.getElementById('page-title').innerText = d.title;
    document.getElementById('page-subtitle').innerText = d.subtitle;
    document.getElementById('lbl-available-title').innerText = d.available_title;
    document.getElementById('lbl-create-title').innerText = d.create_title;
    document.getElementById('lbl-heat-title').innerText = d.heat_title;
    document.getElementById('heat-sub').innerText = d.heat_sub;
    document.getElementById('lbl-stories-title').innerText = d.stories_title;
    document.getElementById('stories-sub').innerText = d.stories_sub;
    document.getElementById('lbl-squad-title').innerText = d.squad_title;
    document.getElementById('squad-sub').innerText = d.squad_sub;
    document.getElementById('lbl-lb-title').innerText = d.lb_title;
    document.getElementById('lb-sub').innerText = d.lb_sub;
    document.getElementById('guest-msg').innerText = d.guest_banner;
    document.getElementById('guest-btn').innerText = d.guest_btn;
    document.getElementById('btn-post-story').innerText = '📸 ' + d.post_story;
    document.getElementById('story-caption').placeholder = d.story_ph;
    document.getElementById('story-submit').innerText = d.share;
    document.getElementById('story-close').innerText = d.close;

    document.getElementById('btn-post-story').onclick = () => {
        if (!requireUser(sess) || !uid()) { alert(t('need_login')); return; }
        const wrap = document.getElementById('story-composer');
        wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('story-close').onclick = () => {
        document.getElementById('story-composer').style.display = 'none';
        document.getElementById('story-viewer').style.display = 'none';
    };
    document.getElementById('guest-btn').onclick = () => { window.location.href = 'auth.html'; };
    document.getElementById('btn-create').onclick = () => {
        const wrap = document.getElementById('create-wrap');
        wrap.style.display = wrap.style.display === 'none' ? 'block' : 'none';
    };

    const wilSel = document.getElementById('story-wilaya');
    wilSel.innerHTML = APP_CONFIG.wilayas.map(w => `<option value="${esc(w)}">${esc(w)}</option>`).join('') || '<option value="">—</option>';

    const stickerWrap = document.getElementById('sticker-pick');
    stickerWrap.innerHTML = STICKERS.map((s, i) =>
        `<button type="button" class="sticker-btn" data-i="${i}">${s}</button>`).join('');
    stickerWrap.querySelectorAll('.sticker-btn').forEach(b => {
        b.onclick = () => {
            stickerWrap.querySelectorAll('.sticker-btn').forEach(x => x.classList.remove('on'));
            b.classList.add('on');
        };
    });

    document.getElementById('story-submit').onclick = async () => {
        if (!requireUser(sess) || !uid()) { alert(t('need_login')); return; }
        const wilaya = document.getElementById('story-wilaya').value;
        const caption = document.getElementById('story-caption').value.trim();
        const sticker = stickerWrap.querySelector('.sticker-btn.on');
        if (!wilaya || !caption) { alert(t('err_rpc')); return; }
        const res = await neon.rpc('post_volunteer_story', {
            p_wilaya: wilaya,
            p_sticker: sticker ? sticker.textContent : '📸',
            p_palette: Math.floor(Math.random() * STORY_PALETTES.length),
            p_caption_ar: caption,
            p_caption_fr: caption,
            p_caption_en: caption
        });
        if (res && res.error) { alert(res.error.message || t('err_rpc')); return; }
        document.getElementById('story-caption').value = '';
        stickerWrap.querySelectorAll('.sticker-btn').forEach(x => x.classList.remove('on'));
        document.getElementById('story-composer').style.display = 'none';
        await loadStories();
    };

    document.getElementById('c-submit').onclick = async () => {
        if (!requireUser(sess) || !uid()) { alert(t('need_login')); return; }
        const initId = document.getElementById('c-init').value;
        const start = document.getElementById('c-start').value;
        const dur = parseInt(document.getElementById('c-duration').value, 10) || 3;
        if (!initId || !start) { alert(t('err_rpc')); return; }
        const r = await neon.rpc('create_volunteer_session', {
            p_payload: {
                initiative_id: initId,
                title_ar: document.getElementById('c-title').value,
                title_fr: document.getElementById('c-title').value,
                title_en: document.getElementById('c-title').value,
                description_ar: document.getElementById('c-desc').value,
                description_fr: document.getElementById('c-desc').value,
                description_en: document.getElementById('c-desc').value,
                location: document.getElementById('c-location').value,
                start_at: new Date(start).toISOString(),
                end_at: new Date(new Date(start).getTime() + dur * 3600000).toISOString(),
                capacity: parseInt(document.getElementById('c-capacity').value, 10) || 10
            }
        });
        alert((r && r.error) ? (r.error.message || t('err_rpc')) : t('ok_created'));
        document.getElementById('create-wrap').style.display = 'none';
        load();
    };

    await load();
}

init();