import { requireAuth, requireUser } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';
import { APP_CONFIG } from '../js/config.js';

const DICT = {
    ar: {
        title: 'النوادي العلمية والثقافية',
        subtitle: 'انخرط في نوادي بيت الشباب وشارك في المسابقات الوطنية والمحلية',
        filter_by: 'تصفية حسب:',
        found: 'عدد النوادي المتاحة: ',
        btn_join: 'انضمام الآن',
        btn_joined: 'عضو بالفعل ✓',
        success: 'تهانينا! لقد تم انضمامك إلى النادي بنجاح وزادت نقاط الأثر لديك!',
        already: 'أنت مسجل بالفعل في هذا النادي'
    },
    fr: {
        title: 'Clubs Scientifiques & Culturels',
        subtitle: 'Rejoignez un club du foyer de jeunes et participez aux compétitions',
        filter_by: 'Filtrer par :',
        found: 'Clubs trouvés : ',
        btn_join: 'Rejoindre le Club',
        btn_joined: 'Déjà Membre ✓',
        success: 'Félicitations ! Vous avez rejoint le club avec succès et gagné des points !',
        already: 'Vous êtes déjà inscrit dans ce club'
    },
    en: {
        title: 'Scientific & Cultural Clubs',
        subtitle: 'Join a youth hostel club and participate in local and national contests',
        filter_by: 'Filter by:',
        found: 'Clubs found: ',
        btn_join: 'Join Club',
        btn_joined: 'Already Member ✓',
        success: 'Congratulations! You successfully joined the club and gained impact points!',
        already: 'You are already registered in this club'
    }
};

let currentClubs = [];
let memberClubIds = [];
let authSession = null;
let lang = 'ar';

async function init() {
    authSession = await requireAuth({ guests: true });
    if (!authSession) return;

    lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;

    setLanguage(lang);
    injectLayout();

    // Populate Wilaya select
    const wSelect = document.getElementById('filter-wilaya');
    APP_CONFIG.wilayas.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        wSelect.appendChild(opt);
    });

    // Localize text
    document.getElementById('page-title').innerText = d.title;
    document.getElementById('page-subtitle').innerText = d.subtitle;
    document.getElementById('lbl-filter-by').innerText = d.filter_by;

    // Fetch user memberships to highlight joined clubs
    if (authSession.user) {
        const memRes = await neon.from('club_members').select().eq('user_id', authSession.user.id);
        memberClubIds = (memRes.data || []).map(m => m.club_id);
    }

    // Fetch all clubs
    const clubsRes = await neon.from('clubs').select();
    currentClubs = clubsRes.data || [];

    renderClubs();

    // Set up events
    document.getElementById('filter-category').onchange = renderClubs;
    document.getElementById('filter-wilaya').onchange = renderClubs;
}

function renderClubs() {
    const cat = document.getElementById('filter-category').value;
    const wilaya = document.getElementById('filter-wilaya').value;
    const grid = document.getElementById('clubs-grid');
    const d = DICT[lang] || DICT.ar;

    let filtered = currentClubs;
    if (cat !== 'all') {
        filtered = filtered.filter(c => c.category === cat);
    }
    if (wilaya !== 'all') {
        filtered = filtered.filter(c => c.wilaya === wilaya);
    }

    document.getElementById('lbl-total-clubs').innerText = `${d.found}${filtered.length}`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:60px;">لا يوجد نوادي مطابقة لخيارات البحث حالياً.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(c => {
        const isJoined = memberClubIds.includes(c.id);
        const name = lang === 'ar' ? c.name_ar : (lang === 'fr' ? c.name_fr : c.name_en);
        const desc = lang === 'ar' ? c.description_ar : (lang === 'fr' ? c.description_fr : c.description_en);
        const catIcon = c.category === 'robotics' ? '🤖' : (c.category === 'programming' ? '💻' : (c.category === 'theater' ? '🎭' : (c.category === 'music' ? '🎵' : '📚')));

        return `
            <div class="club-card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px;">
                        <div style="font-size:38px;">${catIcon}</div>
                        <span class="badge" style="background:rgba(0, 255, 178, 0.08); color:var(--neon-green); font-size:10px;">${c.wilaya}</span>
                    </div>
                    <h3 class="syne mb-10" style="font-size:22px; font-weight:700;">${name}</h3>
                    <p style="font-size:14px; opacity:0.65; line-height:1.6; margin-bottom:25px;">${desc || ''}</p>
                </div>
                
                <button class="btn ${isJoined ? 'btn-outline' : 'btn-primary'} join-btn" data-id="${c.id}" style="width:100%; justify-content:center;" ${isJoined ? 'disabled' : ''}>
                    ${isJoined ? d.btn_joined : d.btn_join}
                </button>
            </div>
        `;
    }).join('');

    // Hook click handlers
    document.querySelectorAll('.join-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const clubId = e.currentTarget.getAttribute('data-id');
            await joinClub(clubId, e.currentTarget);
        };
    });
}

async function joinClub(clubId, element) {
    if (!requireUser(authSession)) return;
    const d = DICT[lang] || DICT.ar;
    element.disabled = true;
    element.innerText = '...';

    const { data, error } = await neon.from('club_members').insert({
        club_id: clubId,
        user_id: authSession.user.id,
        status: 'active'
    });

    if (error) {
        alert(d.already);
        element.disabled = false;
        element.innerText = d.btn_join;
        return;
    }

    // Award 100 impact points
    const currentPoints = authSession.profile.impact_points || 0;
    await neon.from('profiles').update({ impact_points: currentPoints + 100 }, authSession.user.id);
    
    memberClubIds.push(clubId);
    element.className = 'btn btn-outline';
    element.innerText = d.btn_joined;

    alert(d.success);
}

init();