import { requireAuth } from '../js/auth.js';
import { createInitiative } from '../js/db.js';
import { APP_CONFIG } from '../js/config.js';
import { injectLayout } from '../js/layout.js';
import { getCurrentLang } from '../js/i18n.js';

const DICT = {
    ar: {
        title: 'إطلاق مبادرة جديدة',
        subtitle: 'ابدأ تغييراً إيجابياً في حيك اليوم',
        ph_title: 'عنوان المبادرة',
        ph_desc: 'اشرح هدف المبادرة بالتفصيل...',
        btn_publish: 'نشر المبادرة',
        publishing: 'جاري النشر...',
        success: 'تم إرسال المبادرة للمراجعة',
        neighborhood: 'حي افتراضي'
    },
    fr: {
        title: 'Lancer une nouvelle initiative',
        subtitle: 'Commencez un changement positif dans votre quartier dès aujourd\'hui',
        ph_title: 'Titre de l\'initiative',
        ph_desc: 'Expliquez l\'objectif de l\'initiative en détail...',
        btn_publish: 'Publier l\'initiative',
        publishing: 'Publication en cours...',
        success: 'Initiative envoyée pour examen',
        neighborhood: 'Quartier fictif'
    },
    en: {
        title: 'Launch a New Initiative',
        subtitle: 'Start a positive change in your neighborhood today',
        ph_title: 'Initiative Title',
        ph_desc: 'Explain the initiative goal in detail...',
        btn_publish: 'Publish Initiative',
        publishing: 'Publishing...',
        success: 'Initiative submitted for review',
        neighborhood: 'Demo neighborhood'
    }
};

async function init() {
    await requireAuth();
    injectLayout();

    const lang = getCurrentLang() && ['ar', 'fr', 'en'].includes(getCurrentLang()) ? getCurrentLang() : 'ar';
    const d = DICT[lang];

    document.getElementById('page-title').textContent = d.title;
    document.getElementById('page-subtitle').textContent = d.subtitle;
    document.getElementById('title').placeholder = d.ph_title;
    document.getElementById('description').placeholder = d.ph_desc;
    document.getElementById('btn-publish').textContent = d.btn_publish;

    const select = document.getElementById('wilaya');
    APP_CONFIG.wilayas.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        select.appendChild(opt);
    });

    const catSelect = document.getElementById('category');
    APP_CONFIG.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c[lang] || c.ar;
        catSelect.appendChild(opt);
    });
}

document.getElementById('create-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-publish');
    const lang = getCurrentLang() && ['ar', 'fr', 'en'].includes(getCurrentLang()) ? getCurrentLang() : 'ar';
    const d = DICT[lang];
    btn.disabled = true;
    btn.innerText = d.publishing;

    const { user } = await requireAuth();
    const res = await createInitiative({
        title_ar: document.getElementById('title').value,
        description_ar: document.getElementById('description').value,
        wilaya: document.getElementById('wilaya').value,
        category: document.getElementById('category').value,
        neighborhood: d.neighborhood // Manual for now
    }, user.id);

    if (res.data) {
        alert(d.success);
        location.href = 'dashboard.html';
    } else {
        alert(res.error);
    }
    btn.disabled = false;
};

init();