import { requireAuth, requireUser } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';
import { APP_CONFIG } from '../js/config.js';

const DICT = {
    ar: {
        title: 'زيارات الشراكة وحملات التوعية المدرسية',
        subtitle: 'جدولة زيارات المدارس العمومية والخاصة إلى بيوت الشباب أو إرسال حملات توعوية تفاعلية',
        sec_list: 'الزيارات والحملات المجدولة',
        sec_form: 'جدولة زيارة أو حملة جديدة',
        school_name: 'اسم المدرسة / المؤسسة التعليمية',
        school_type: 'نوع المؤسسة',
        wilaya: 'الولاية',
        visit_date: 'تاريخ الفعالية',
        activity_type: 'نوع النشاط التوعوي',
        btn_submit: 'تأكيد الجدولة وحفظ الطلب',
        success: 'تمت جدولة الحملة التوعوية بنجاح وزادت نقاط أثرك بمقدار 120 نقطة لتنسيقك الفعال!',
        planned: 'مجدولة',
        completed: 'مكتملة',
        empty: 'لا يوجد زيارات مجدولة في هذه الولاية حالياً.',
        activities: {
            awareness_day: 'يوم توعوي وقائي 🩺',
            hostel_visit: 'زيارة لبيت الشباب 🤖',
            competition: 'مسابقة علمية 💻',
            partnership: 'اتفاقية شراكة 🤝'
        }
    },
    fr: {
        title: 'Partenariats & Visites Scolaires',
        subtitle: 'Planifiez des campagnes de sensibilisation ou des visites scolaires interactives',
        sec_list: 'Visites et Campagnes Planifiées',
        sec_form: 'Planifier une nouvelle visite',
        school_name: 'Nom de l\'établissement',
        school_type: 'Type d\'établissement',
        wilaya: 'Wilaya',
        visit_date: 'Date de l\'événement',
        activity_type: 'Type d\'activité',
        btn_submit: 'Confirmer la planification',
        success: 'Campagne planifiée avec succès ! +120 points d\'impact pour votre coordination !',
        planned: 'Planifié',
        completed: 'Complété',
        empty: 'Aucune visite planifiée pour le moment.',
        activities: {
            awareness_day: 'Sensibilisation 🩺',
            hostel_visit: 'Visite Foyer 🤖',
            competition: 'Compétition 💻',
            partnership: 'Partenariat 🤝'
        }
    },
    en: {
        title: 'School Partnerships & Visits',
        subtitle: 'Schedule visits from public and private schools to youth hostels or interactive campaigns',
        sec_list: 'Scheduled Visits & Campaigns',
        sec_form: 'Schedule New Visit or Campaign',
        school_name: 'School / Institution Name',
        school_type: 'Institution Type',
        wilaya: 'Wilaya',
        visit_date: 'Event Date',
        activity_type: 'Activity Type',
        btn_submit: 'Confirm & Save Schedule',
        success: 'Poison prevention campaign scheduled successfully! +120 impact points rewarded!',
        planned: 'Planned',
        completed: 'Completed',
        empty: 'No scheduled campaigns currently.',
        activities: {
            awareness_day: 'Awareness Campaign 🩺',
            hostel_visit: 'Hostel Visit 🤖',
            competition: 'Scientific Contest 💻',
            partnership: 'Partnership Agreement 🤝'
        }
    }
};

let authSession = null;
let lang = 'ar';
let visits = [];

async function init() {
    authSession = await requireAuth({ guests: true });
    if (!authSession) return;

    lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;

    setLanguage(lang);
    injectLayout();

    // Populate Wilayas select
    const wSelect = document.getElementById('wilaya');
    APP_CONFIG.wilayas.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        wSelect.appendChild(opt);
    });

    // Localize text
    document.getElementById('page-title').innerText = d.title;
    document.getElementById('page-subtitle').innerText = d.subtitle;
    document.getElementById('sec-list-title').innerText = d.sec_list;
    document.getElementById('sec-form-title').innerText = d.sec_form;
    document.getElementById('lbl-school-name').innerText = d.school_name;
    document.getElementById('lbl-school-type').innerText = d.school_type;
    document.getElementById('lbl-wilaya').innerText = d.wilaya;
    document.getElementById('lbl-visit-date').innerText = d.visit_date;
    document.getElementById('lbl-activity-type').innerText = d.activity_type;
    document.getElementById('btn-submit').innerText = d.btn_submit;

    // Load scheduled visits
    const res = await neon.from('school_visits').select();
    visits = res.data || [];

    renderVisits();

    // Form Submit Event
    document.getElementById('visit-form').onsubmit = handleFormSubmit;
}

function renderVisits() {
    const d = DICT[lang] || DICT.ar;
    const container = document.getElementById('visits-list');

    if (visits.length === 0) {
        container.innerHTML = `<p style="opacity:0.5; font-size:14px;">${d.empty}</p>`;
        return;
    }

    container.innerHTML = visits.map(v => {
        const actName = d.activities[v.activity_type] || v.activity_type;
        const statusName = v.status === 'completed' ? d.completed : d.planned;
        const badgeColor = v.status === 'completed' ? 'var(--accent-pink)' : 'var(--accent-cyan)';
        const instType = v.school_type === 'public' ? (lang === 'ar' ? 'مؤسسة عمومية' : 'Publique') : (lang === 'ar' ? 'مؤسسة خاصة' : 'Privée');

        return `
            <div class="visit-card">
                <div>
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
                        <h3 style="font-size:18px; font-weight:700;">${v.school_name}</h3>
                        <span class="badge" style="background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.6); font-size:9px;">${instType}</span>
                    </div>
                    <div style="font-size:14px; opacity:0.7; margin-bottom:10px;">${actName}</div>
                    <div style="font-size:12px; opacity:0.5;" class="mono">${v.wilaya} • ${new Date(v.visit_date).toLocaleDateString()}</div>
                </div>
                
                <span class="badge" style="background:rgba(255,255,255,0.02); color:${badgeColor}; font-size:10px;">${statusName}</span>
            </div>
        `;
    }).join('');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    if (!requireUser(authSession)) return;
    const d = DICT[lang] || DICT.ar;

    const name = document.getElementById('school-name').value;
    const type = document.getElementById('school-type').value;
    const wilaya = document.getElementById('wilaya').value;
    const date = document.getElementById('visit-date').value;
    const activity = document.getElementById('activity-type').value;

    const { data, error } = await neon.from('school_visits').insert({
        school_name: name,
        school_type: type,
        wilaya: wilaya,
        visit_date: date,
        activity_type: activity,
        status: 'pending'
    });

    if (error) {
        alert(error.message);
        return;
    }

    // Refetch visits
    const res = await neon.from('school_visits').select();
    visits = res.data || [];
    renderVisits();

    // Clear form
    document.getElementById('visit-form').reset();

    alert(d.success);
}

init();