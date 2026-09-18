import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { injectLayout } from '../js/layout.js';
import { getCurrentLang } from '../js/i18n.js';

const CATEGORY_COLORS = {
    clubs:    { bg: 'rgba(5,217,232,0.1)', color: 'var(--accent-cyan)' },
    awareness:{ bg: 'rgba(255,42,109,0.1)', color: 'var(--accent-pink)' },
    training: { bg: 'rgba(255,190,11,0.1)', color: 'var(--accent-amber)' },
    schools:  { bg: 'rgba(163,0,255,0.1)', color: 'var(--accent-purple)' }
};

const DICT = {
    ar: { page: 'استكشف المبادرات', subtitle: 'اكتشف المبادرات والنشاطات المعتمدة', filter_all: 'الكل', empty: 'لا توجد مبادرات حالياً', health: 'صحة', join: 'انضمام' },
    fr: { page: 'Explorer les Initiatives', subtitle: 'Découvrez les initiatives approuvées', filter_all: 'Tout', empty: 'Aucune initiative pour l\'instant', health: 'Santé', join: 'Rejoindre' },
    en: { page: 'Explore Initiatives', subtitle: 'Discover approved initiatives and activities', filter_all: 'All', empty: 'No initiatives yet', health: 'Health', join: 'Join' }
};

let allData = [];
let activeCat = 'all';

function renderCards(data, lang) {
    const t = DICT[lang] || DICT.ar;
    const grid = document.getElementById('explore-grid');
    if (!data.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div>🔭</div><p>${t.empty}</p></div>`;
        return;
    }
    const titleKey = lang === 'fr' ? 'title_fr' : (lang === 'en' ? 'title_en' : 'title_ar');
    const descKey  = lang === 'fr' ? 'description_fr' : (lang === 'en' ? 'description_en' : 'description_ar');

    const colorFill = { green: '#00d4b4', teal: '#05D9E8', blue: '#4A9EFF', amber: '#FFBE0B' };
    grid.innerHTML = data.map(i => {
        const cat = i.category || 'clubs';
        const cc = CATEGORY_COLORS[cat] || CATEGORY_COLORS.clubs;
        const score = i.health_score || 0;
        const fill = score > 70 ? '#00d4b4' : score > 40 ? '#FFBE0B' : '#FF2A6D';
        return `
        <div class="explore-card glass" onclick="location.href='initiative.html?id=${i.id}'">
            <div class="category-chip" style="background:${cc.bg}; color:${cc.color};">${cat.toUpperCase()}</div>
            <h2 class="syne" style="font-size:20px; font-weight:800; line-height:1.3; margin-bottom:10px;">${i[titleKey] || i.title_ar}</h2>
            <p style="font-size:13px; opacity:0.55; line-height:1.6; margin-bottom:20px;">${(i[descKey] || i.description_ar || '').substring(0,90)}...</p>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
                <span style="opacity:0.45; font-family:var(--mono);">📍 ${i.wilaya || '—'}</span>
                <span style="color:${fill}; font-family:var(--mono); font-weight:800;">${score}% ${t.health}</span>
            </div>
            <div class="health-bar">
                <div class="health-fill" style="width:${score}%; background:${fill};"></div>
            </div>
        </div>`;
    }).join('');
}

async function init() {
    const auth = await requireAuth({ guests: true });
    if (!auth) return;
    injectLayout();

    const lang = getCurrentLang();
    const t = DICT[lang] || DICT.ar;
    document.getElementById('page-title').textContent = t.page;
    document.getElementById('page-subtitle').textContent = t.subtitle;
    document.getElementById('filter-all').textContent = t.filter_all;

    const { data } = await neon.from('initiatives').select().eq('is_approved', true);
    allData = data || [];
    document.getElementById('loading-state')?.remove();
    renderCards(allData, lang);

    // Category filter
    document.getElementById('filters').addEventListener('click', e => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCat = btn.dataset.cat;
        const filtered = activeCat === 'all' ? allData : allData.filter(i => i.category === activeCat);
        const search = document.getElementById('search-input').value.toLowerCase();
        renderCards(search ? filtered.filter(i => (i.title_ar||'').includes(search) || (i.title_fr||'').toLowerCase().includes(search)) : filtered, lang);
    });

    // Search
    document.getElementById('search-input').addEventListener('input', e => {
        const q = e.target.value.toLowerCase();
        const base = activeCat === 'all' ? allData : allData.filter(i => i.category === activeCat);
        renderCards(q ? base.filter(i => (i.title_ar||'').includes(q) || (i.title_fr||'').toLowerCase().includes(q) || (i.title_en||'').toLowerCase().includes(q)) : base, lang);
    });
}
init();