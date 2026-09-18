import { requireAuth, requireUser } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';

const DICT = {
    ar: {
        title: 'الدورات التكوينية والشهادات الرقمية',
        subtitle: 'طوّر مهاراتك التقنية والحياتية، واحصل على شهادة معتمدة من ديوان مؤسسات الشباب',
        search_placeholder: 'ابحث عن دورة تكوينية...',
        found: 'عدد الدورات المتاحة: ',
        btn_enroll: 'تسجيل في الدورة',
        btn_complete: 'إكمال الدورة والاختبار',
        btn_certificate: '🎓 تحميل الشهادة الرقمية',
        completed: 'مكتمل ✓',
        enrolled: 'مسجل بالفعل',
        success_enroll: 'تم التسجيل في الدورة بنجاح وزادت نقاط أثرك بمقدار 50 نقطة!',
        success_complete: 'تهانينا! لقد أكملت الدورة وحصلت على 200 نقطة أثر إضافية وشهادة رقمية معتمدة!'
    },
    fr: {
        title: 'Formations & Certifications',
        subtitle: 'Développez vos compétences et obtenez un certificat officiel',
        search_placeholder: 'Rechercher une formation...',
        found: 'Formations disponibles : ',
        btn_enroll: 'S\'inscrire',
        btn_complete: 'Valider et Passer le Test',
        btn_certificate: '🎓 Télécharger le Certificat',
        completed: 'Complété ✓',
        enrolled: 'Déjà inscrit',
        success_enroll: 'Inscription réussie ! +50 points d\'impact gagnés !',
        success_complete: 'Félicitations ! Formation complétée ! +200 points d\'impact et certificat généré !'
    },
    en: {
        title: 'Certified Skill Training & Courses',
        subtitle: 'Empower your technical & soft skills, and earn certified digital credentials',
        search_placeholder: 'Search courses...',
        found: 'Available courses: ',
        btn_enroll: 'Enroll in Course',
        btn_complete: 'Complete Course & Test',
        btn_certificate: '🎓 Download Digital Certificate',
        completed: 'Completed ✓',
        enrolled: 'Enrolled',
        success_enroll: 'Successfully enrolled! +50 impact points gained!',
        success_complete: 'Congratulations! You completed the course, gained 200 points and a certified credential!'
    }
};

let currentCourses = [];
let enrolledList = [];
let authSession = null;
let lang = 'ar';

async function init() {
    authSession = await requireAuth({ guests: true });
    if (!authSession) return;

    lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;

    setLanguage(lang);
    injectLayout();

    // Localize Strings
    document.getElementById('page-title').innerText = d.title;
    document.getElementById('page-subtitle').innerText = d.subtitle;
    document.getElementById('search-input').placeholder = d.search_placeholder;

    // Fetch user enrollments
    if (authSession.user) {
        const enrollRes = await neon.from('training_enrollments').select().eq('user_id', authSession.user.id);
        enrolledList = enrollRes.data || [];
    }

    // Fetch all courses
    const coursesRes = await neon.from('training_courses').select();
    currentCourses = coursesRes.data || [];

    renderCourses();

    // Search trigger
    document.getElementById('search-input').oninput = renderCourses;
}

function renderCourses() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const grid = document.getElementById('courses-grid');
    const d = DICT[lang] || DICT.ar;

    let filtered = currentCourses;
    if (search) {
        filtered = filtered.filter(c => {
            const title = (lang === 'ar' ? c.title_ar : (lang === 'fr' ? c.title_fr : c.title_en)) || '';
            return title.toLowerCase().includes(search);
        });
    }

    document.getElementById('lbl-total-courses').innerText = `${d.found}${filtered.length}`;

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:40px;">لا يوجد دورات مطابقة للبحث حالياً.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(c => {
        const enrollment = enrolledList.find(e => e.course_id === c.id);
        const title = lang === 'ar' ? c.title_ar : (lang === 'fr' ? c.title_fr : c.title_en);
        const desc = lang === 'ar' ? c.description_ar : (lang === 'fr' ? c.description_fr : c.description_en);
        
        let actionBtnHTML = '';
        if (!enrollment) {
            actionBtnHTML = `<button class="btn btn-primary enroll-btn" data-id="${c.id}" style="width:100%; justify-content:center;">${d.btn_enroll}</button>`;
        } else if (enrollment.status !== 'completed') {
            actionBtnHTML = `<button class="btn btn-secondary complete-btn" data-id="${enrollment.id}" style="width:100%; justify-content:center;">${d.btn_complete}</button>`;
        } else {
            actionBtnHTML = `
                <div style="display:flex; flex-direction:column; gap:10px; width:100%;">
                    <span class="badge" style="background:rgba(0, 255, 178, 0.08); color:var(--neon-green); text-align:center; display:block; padding:10px;">${d.completed}</span>
                    <a href="${enrollment.certificate_url || '#'}" target="_blank" class="btn btn-outline" style="justify-content:center;">${d.btn_certificate}</a>
                </div>
            `;
        }

        return `
            <div class="course-card">
                <div>
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:20px;">
                        <div style="font-size:38px;">🎓</div>
                        <span class="badge" style="background:rgba(255,255,255,0.03); color:rgba(255,255,255,0.6); font-size:10px;">${c.duration || ''} • ${c.instructor || ''}</span>
                    </div>
                    <h3 class="syne mb-10" style="font-size:22px; font-weight:700;">${title}</h3>
                    <p style="font-size:14px; opacity:0.65; line-height:1.6; margin-bottom:25px;">${desc || ''}</p>
                </div>
                
                ${actionBtnHTML}
            </div>
        `;
    }).join('');

    // Bind events
    document.querySelectorAll('.enroll-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const courseId = e.currentTarget.getAttribute('data-id');
            await enrollCourse(courseId, e.currentTarget);
        };
    });

    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.onclick = async (e) => {
            const enrollId = e.currentTarget.getAttribute('data-id');
            await completeCourse(enrollId, e.currentTarget);
        };
    });
}

async function enrollCourse(courseId, element) {
    if (!requireUser(authSession)) return;
    const d = DICT[lang] || DICT.ar;
    element.disabled = true;
    element.innerText = '...';

    const { data, error } = await neon.from('training_enrollments').insert({
        course_id: courseId,
        user_id: authSession.user.id,
        status: 'enrolled'
    });

    if (error) {
        alert(error.message);
        element.disabled = false;
        element.innerText = d.btn_enroll;
        return;
    }

    // Award 50 points
    const currentPoints = authSession.profile.impact_points || 0;
    await neon.from('profiles').update({ impact_points: currentPoints + 50 }, authSession.user.id);

    // Refetch enrollments
    const enrollRes = await neon.from('training_enrollments').select().eq('user_id', authSession.user.id);
    enrolledList = enrollRes.data || [];
    
    renderCourses();
    alert(d.success_enroll);
}

async function completeCourse(enrollId, element) {
    if (!requireUser(authSession)) return;
    const d = DICT[lang] || DICT.ar;
    element.disabled = true;
    element.innerText = '...';

    // Generate simulated certificate url
    const certUrl = `https://athar.dev/credentials/cert-${enrollId}.pdf`;

    const { error } = await neon.from('training_enrollments').update({
        status: 'completed',
        certificate_url: certUrl
    }, enrollId);

    if (error) {
        alert(error.message);
        element.disabled = false;
        element.innerText = d.btn_complete;
        return;
    }

    // Award 200 points
    const currentPoints = authSession.profile.impact_points || 0;
    await neon.from('profiles').update({ impact_points: currentPoints + 200 }, authSession.user.id);

    // Refetch enrollments
    const enrollRes = await neon.from('training_enrollments').select().eq('user_id', authSession.user.id);
    enrolledList = enrollRes.data || [];

    renderCourses();
    alert(d.success_complete);
}

init();