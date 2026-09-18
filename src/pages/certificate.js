import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { getCurrentLang } from '../js/i18n.js';
import { formatDate } from '../js/utils.js';

const DICT = {
    ar: {
        label: 'شهادة تأهيل',
        issuer: 'أثر — المنصة الرقمية لبيوت الشباب',
        btn_print: '🖨️ طباعة الشهادة',
        msg_missing: 'لم يتم العثور على الشهادة.',
        msg_not_yours: 'هذه الشهادة ليست لك.',
        name_fallback: '—'
    },
    fr: {
        label: 'Certificat de Qualification',
        issuer: 'Athar — Plateforme des Maisons de Jeunes',
        btn_print: '🖨️ Imprimer le Certificat',
        msg_missing: 'Certificat introuvable.',
        msg_not_yours: 'Ce certificat ne vous appartient pas.',
        name_fallback: '—'
    },
    en: {
        label: 'Certificate of Qualification',
        issuer: 'Athar — Youth Hostels Digital Platform',
        btn_print: '🖨️ Print Certificate',
        msg_missing: 'Certificate not found.',
        msg_not_yours: 'This certificate does not belong to you.',
        name_fallback: '—'
    }
};

async function init() {
    const sess = await requireAuth({ guests: false });
    if (!sess) return;

    const lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;

    document.getElementById('btn-print').onclick = () => window.print();

    const params = new URLSearchParams(window.location.search);
    const enrollId = params.get('enroll');

    const showMessage = (msg) => {
        document.getElementById('cert-message').textContent = msg;
        document.getElementById('cert-message').classList.add('visible');
        document.getElementById('cert-body').classList.add('hidden');
    };

    if (!enrollId) {
        showMessage(d.msg_missing);
        return;
    }

    const enrollRes = await neon.from('training_enrollments').select().id(enrollId);
    const enroll = enrollRes.data ? enrollRes.data[0] : null;

    if (!enroll) {
        showMessage(d.msg_missing);
        return;
    }

    if (enroll.user_id !== sess.user.id) {
        showMessage(d.msg_not_yours);
        return;
    }

    document.getElementById('cert-label').textContent = d.label;
    document.getElementById('cert-issuer').textContent = d.issuer;
    document.getElementById('btn-print').textContent = d.btn_print;

    const courseRes = await neon.from('training_courses').select().id(enroll.course_id);
    const course = courseRes.data ? courseRes.data[0] : null;

    const profileRes = await neon.from('profiles').select().id(sess.user.id);
    const profileRow = profileRes.data ? profileRes.data[0] : (sess.profile || null);

    document.getElementById('cert-name').textContent = (profileRow && profileRow.full_name) || sess.user.name || d.name_fallback;
    document.getElementById('cert-course').textContent = course
        ? (lang === 'ar' ? course.title_ar : (lang === 'fr' ? course.title_fr : course.title_en)) || ''
        : '';
    document.getElementById('cert-date').textContent = formatDate(enroll.completed_at || enroll.enrolled_at, lang);
}

init();