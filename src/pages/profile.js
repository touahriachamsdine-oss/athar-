import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { injectLayout } from '../js/layout.js';
import { getCurrentLang, setLanguage } from '../js/i18n.js';

function toast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    c.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

const DICT = {
    ar: { page: 'الملف الشخصي', form_title: 'تعديل المعلومات', lbl_name: 'الاسم الكامل', lbl_phone: 'رقم الهاتف', lbl_wilaya: 'الولاية', lbl_neighborhood: 'الحي', lbl_lang: 'اللغة المفضلة', btn_save: '💾 حفظ التغييرات', saved: '✅ تم حفظ التغييرات بنجاح!', error: '❌ حدث خطأ، حاول مرة أخرى', lbl_clubs: 'النوادي', lbl_courses: 'الدورات' },
    fr: { page: 'Mon Profil', form_title: 'Modifier le profil', lbl_name: 'Nom complet', lbl_phone: 'Téléphone', lbl_wilaya: 'Wilaya', lbl_neighborhood: 'Quartier', lbl_lang: 'Langue préférée', btn_save: '💾 Sauvegarder', saved: '✅ Profil mis à jour !', error: '❌ Erreur, réessayez.', lbl_clubs: 'Clubs', lbl_courses: 'Formations' },
    en: { page: 'My Profile', form_title: 'Edit Profile', lbl_name: 'Full Name', lbl_phone: 'Phone', lbl_wilaya: 'Wilaya', lbl_neighborhood: 'Neighborhood', lbl_lang: 'Preferred Language', btn_save: '💾 Save Changes', saved: '✅ Profile saved!', error: '❌ Error, please retry.', lbl_clubs: 'Clubs', lbl_courses: 'Courses' }
};

async function init() {
    const auth = await requireAuth();
    if (!auth) return;
    injectLayout();

    const lang = getCurrentLang();
    const t = DICT[lang] || DICT.ar;

    // Translate static labels
    document.getElementById('page-title').textContent = t.page;
    document.getElementById('form-title').textContent = t.form_title;
    document.getElementById('lbl-name').textContent = t.lbl_name;
    document.getElementById('lbl-phone').textContent = t.lbl_phone;
    document.getElementById('lbl-wilaya').textContent = t.lbl_wilaya;
    document.getElementById('lbl-neighborhood').textContent = t.lbl_neighborhood;
    document.getElementById('lbl-lang').textContent = t.lbl_lang;
    document.getElementById('btn-save').textContent = t.btn_save;
    document.getElementById('lbl-clubs').textContent = t.lbl_clubs;
    document.getElementById('lbl-courses').textContent = t.lbl_courses;

    const p = auth.profile;
    document.getElementById('user-name').textContent = p.full_name || '—';
    document.getElementById('user-wilaya').textContent = p.wilaya || '—';
    document.getElementById('user-points').textContent = p.impact_points || 0;

    // Role badge
    const rb = document.getElementById('role-badge');
    rb.textContent = p.role;
    rb.className = `role-badge role-${p.role}`;

    // Populate form
    document.getElementById('full_name').value = p.full_name || '';
    document.getElementById('phone').value = p.phone || '';
    document.getElementById('wilaya').value = p.wilaya || '';
    document.getElementById('neighborhood').value = p.neighborhood || '';

    // Stats
    const { data: clubs } = await neon.from('club_members').select().eq('user_id', auth.user.id);
    const { data: courses } = await neon.from('training_enrollments').select().eq('user_id', auth.user.id);
    document.getElementById('stat-clubs').textContent = (clubs || []).length;
    document.getElementById('stat-courses').textContent = (courses || []).length;

    // Save
    document.getElementById('profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save');
        btn.disabled = true;
        btn.textContent = '⏳ ...';

        const { error } = await neon.rpc('update_profile_settings', {
            p_full_name: document.getElementById('full_name').value,
            p_phone: document.getElementById('phone').value,
            p_wilaya: document.getElementById('wilaya').value,
            p_neighborhood: document.getElementById('neighborhood').value
        });

        btn.disabled = false;
        btn.textContent = t.btn_save;
        toast(error ? t.error : t.saved, error ? 'error' : 'success');
    };

    // Language switcher
    document.querySelectorAll('.lang-opt').forEach(btn => {
        if (btn.dataset.lang === lang) btn.style.background = 'rgba(255,42,109,0.15)';
        btn.onclick = () => { setLanguage(btn.dataset.lang); window.location.reload(); };
    });
}

init();