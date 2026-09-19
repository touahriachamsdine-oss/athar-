import { requireAuth, requireUser } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';
import { ic } from '../js/icons.js';

const DICT = {
    ar: {
        title: 'الاستشارات والدعم الوقائي',
        subtitle: 'اطرح استشارتك بسرية تامة وتلقى الإجابة من أخصائيين نفسيين واجتماعيين معتمدين',
        tab_ask: 'طرح استشارة جديدة',
        tab_public: 'استشارات عامة مجابة',
        tab_mine: 'استشاراتي الخاصة',
        form_heading: 'اكتب سؤالك أو مشكلتك هنا بسرية تامة',
        placeholder: 'اكتب تفاصيل استشارتك هنا... نحن هنا للاستماع إليك ومساعدتك دون أي إحراج.',
        lbl_anon: 'إرسال كـ "مجهول الهوية" (لن يتم ربطه بحسابك)',
        lbl_public: 'السماح بنشر الاستشارة والإجابة بشكل عام (بدون هويتك) للاستفادة',
        btn_submit: 'إرسال الاستشارة الآمنة',
        no_public: 'لا توجد استشارات عامة مجابة متوفرة حالياً.',
        no_mine: 'لم تقم بطرح أي استشارات خاصة بعد.',
        success_submit: 'تم إرسال استشارتك بنجاح! سيقوم أحد الأخصائيين بمراجعتها والإجابة عليها قريباً بسرية تامة.',
        waiting_answer: 'بانتظار الإجابة من أخصائي...'
    },
    fr: {
        title: 'Consultations Anonymes',
        subtitle: 'Obtenez des conseils d\'experts en toute confidentialité',
        tab_ask: 'Nouvelle Consultation',
        tab_public: 'Consultations Publiques',
        tab_mine: 'Mes Demandes',
        form_heading: 'Posez votre question en toute sécurité et confidentialité',
        placeholder: 'Écrivez votre message ici... Nous sommes là pour vous aider sans aucun jugement.',
        lbl_anon: 'Envoyer anonymement (ne sera pas lié à votre compte)',
        lbl_public: 'Autoriser la publication publique (votre identité reste masquée)',
        btn_submit: 'Envoyer la demande',
        no_public: 'Aucune consultation publique disponible pour le moment.',
        no_mine: 'Vous n\'avez soumis aucune consultation.',
        success_submit: 'Votre consultation a été envoyée avec succès! Nos experts y répondront sous peu.',
        waiting_answer: 'En attente de réponse...'
    },
    en: {
        title: 'Anonymous Counseling & Guidance',
        subtitle: 'Submit your queries securely and receive professional answers from mental specialists',
        tab_ask: 'New Consultation',
        tab_public: 'Public Q&A',
        tab_mine: 'My Requests',
        form_heading: 'Write your question or concern in absolute privacy',
        placeholder: 'Write your message here... We are here to support you without any judgment.',
        lbl_anon: 'Send as "Anonymous" (will not be linked to your profile)',
        lbl_public: 'Allow this to be published publicly (your identity stays hidden)',
        btn_submit: 'Submit Secure Request',
        no_public: 'No public consultations available at this moment.',
        no_mine: 'You have not submitted any private consultations yet.',
        success_submit: 'Your query has been submitted successfully! An expert will review and answer it shortly.',
        waiting_answer: 'Awaiting expert answer...'
    }
};

let authSession = null;
let lang = 'ar';

async function init() {
    authSession = await requireAuth({ guests: true });
    if (!authSession) return;

    lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;

    setLanguage(lang);
    injectLayout();

    // Localize text content
    document.getElementById('page-title').innerText = d.title;
    document.getElementById('page-subtitle').innerText = d.subtitle;
    document.getElementById('tab-ask').innerText = d.tab_ask;
    document.getElementById('tab-public').innerText = d.tab_public;
    document.getElementById('tab-mine').innerText = d.tab_mine;
    document.getElementById('form-heading').innerText = d.form_heading;
    document.getElementById('question-textarea').placeholder = d.placeholder;
    document.getElementById('lbl-anon').innerText = d.lbl_anon;
    document.getElementById('lbl-public').innerText = d.lbl_public;
    document.getElementById('btn-submit').innerText = d.btn_submit;
}

window.switchTab = async function(tabName) {
    const tabs = ['ask', 'public', 'mine'];
    tabs.forEach(t => {
        document.getElementById(`tab-${t}`).classList.remove('active');
        document.getElementById(`sec-${t}`).style.display = 'none';
    });

    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`sec-${tabName}`).style.display = 'block';

    if (tabName === 'public') {
        await loadPublicConsultations();
    } else if (tabName === 'mine') {
        if (!requireUser(authSession)) return;
        await loadMyConsultations();
    }
};

async function loadPublicConsultations() {
    const d = DICT[lang] || DICT.ar;
    const sec = document.getElementById('sec-public');
    sec.innerHTML = '<div style="text-align:center; opacity:0.78; padding:40px;">...</div>';

    const { data, error } = await neon.from('consultations')
        .select()
        .eq('is_public', true);

    const answered = (data || []).filter(c => c.answer && c.answer.trim());

    if (error || answered.length === 0) {
        sec.innerHTML = `<div class="glass" style="text-align:center; opacity:0.78; padding:40px; border-radius:24px;">${d.no_public}</div>`;
        return;
    }

    sec.innerHTML = answered.map(c => `
        <div class="consult-card spring-in">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <span class="badge" style="background:rgba(163, 0, 255, 0.1); color:var(--accent-purple);">استشارة مجابة</span>
                <span class="mono" style="font-size:11px; opacity:0.75;">${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div style="font-weight:600; font-size:16px; margin-bottom:20px; color:var(--text-primary);">
                ${ic('question', 17)} ${c.subject}
            </div>
            <div style="background:rgba(16, 14, 37, 0.6); padding:20px; border-radius:14px; font-size:15px; opacity:0.95; line-height:1.6; border-right: 4px solid var(--accent-purple); box-shadow: inset 2px 2px 5px rgba(0,0,0,0.3);">
                ${ic('bulb', 17)} ${c.answer}
            </div>
        </div>
    `).join('');
}

async function loadMyConsultations() {
    const d = DICT[lang] || DICT.ar;
    const sec = document.getElementById('sec-mine');
    sec.innerHTML = '<div style="text-align:center; opacity:0.78; padding:40px;">...</div>';

    const { data, error } = await neon.from('consultations')
        .select()
        .eq('user_id', authSession.user.id);

    if (error || !data || data.length === 0) {
        sec.innerHTML = `<div class="glass" style="text-align:center; opacity:0.78; padding:40px; border-radius:24px;">${d.no_mine}</div>`;
        return;
    }

    sec.innerHTML = data.map(c => `
        <div class="consult-card spring-in">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <span class="badge" style="${c.answer ? 'background:rgba(163, 0, 255, 0.1); color:var(--accent-purple);' : 'background:rgba(255, 190, 11, 0.1); color:var(--accent-amber);'}">
                    ${c.answer ? 'تمت الإجابة' : d.waiting_answer}
                </span>
                <span class="mono" style="font-size:11px; opacity:0.75;">${new Date(c.created_at).toLocaleDateString()}</span>
            </div>
            <div style="font-weight:600; font-size:15px; margin-bottom:15px; opacity:0.9;">
                ${ic('question', 16)} ${c.subject}
            </div>
            ${c.answer ? `
                <div style="background:rgba(16, 14, 37, 0.6); padding:15px; border-radius:12px; font-size:14px; opacity:0.95; border-right: 4px solid var(--accent-purple); box-shadow: inset 2px 2px 5px rgba(0,0,0,0.3);">
                    ${ic('bulb', 16)} ${c.answer}
                </div>
            ` : ''}
        </div>
    `).join('');
}

window.submitConsultation = async function(event) {
    event.preventDefault();
    if (!requireUser(authSession)) return;
    const d = DICT[lang] || DICT.ar;
    const btn = document.getElementById('btn-submit');
    btn.disabled = true;
    btn.innerText = '...';

    const questionText = document.getElementById('question-textarea').value;
    const isAnon = document.getElementById('anon-checkbox').checked;
    const isPub = document.getElementById('public-checkbox').checked;

    const payload = {
        subject: questionText,
        message: questionText,
        is_anonymous: isAnon,
        is_public: isPub,
        user_id: isAnon ? null : authSession.user.id
    };

    const { error } = await neon.from('consultations').insert(payload);

    if (error) {
        alert(error.message);
        btn.disabled = false;
        btn.innerText = d.btn_submit;
        return;
    }

    // Clean up
    document.getElementById('question-textarea').value = '';
    btn.disabled = false;
    btn.innerText = d.btn_submit;

    alert(d.success_submit);
    switchTab('mine');
};

init();