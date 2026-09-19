import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';
import { ic } from '../js/icons.js';
import { mountSkeleton, SKEL_ROWS } from '../js/skeletons.js';

const CAT_ICONS = { robotics: 'robot', programming: 'code', theater: 'theater', music: 'music', reading: 'book', other: 'sparkle' };

const DICT = {
    ar: {
        welcome: 'مرحباً بك، ',
        subtitle: 'تتبع أثرك ومشاركتك الفعالة ببيت الشباب',
        welcome_guest: 'مرحباً بك في منصة أثر',
        guest_cta: 'أنشئ حسابك واستفد من كل المنصة',
        guest_desc: 'النوادي، الدورات، العمل التطوعي، ونقاط الأثر بانتظارك — التسجيل مجاني وسريع.',
        guest_btn: 'تسجيل الدخول / إنشاء حساب',
        my_clubs: 'النوادي المشترك بها',
        my_training: 'الدورات التكوينية',
        my_counseling: 'الاستشارات النفسية',
        clubs_title: 'نواديّ العلمية والثقافية',
        explore_clubs: 'استكشف النوادي',
        no_clubs: 'لم تشترك في أي نادٍ علمي بعد.',
        courses_title: 'دورات التكوين وصقل المهارات',
        register_course: 'سجل في دورة',
        no_courses: 'لا يوجد دورات مسجلة حالياً.',
        pillar_meter: 'مقياس التمكين الشبابي',
        counseling_title: 'الاستشارات والردود الآمنة',
        ask_counselor: 'طرح استشارة',
        no_consultations: 'لم تقم بطرح أي استشارة سرية بعد.',
        pending: 'قيد المراجعة والتحليل',
        answered: 'تم الرد والإرشاد',
        active: 'نشط',
        completed: 'مكتمل'
    },
    fr: {
        welcome: 'Bienvenue, ',
        subtitle: 'Suivez votre impact et vos activités au foyer de jeunes',
        welcome_guest: 'Bienvenue sur la plateforme Athar',
        guest_cta: 'Créez votre compte et profitez de tout',
        guest_desc: 'Clubs, formations, bénévolat et points d\'impact vous attendent — inscription gratuite.',
        guest_btn: 'Se connecter / Créer un compte',
        my_clubs: 'Clubs Rejoints',
        my_training: 'Formations Suivies',
        my_counseling: 'Consultations Privées',
        clubs_title: 'Mes Clubs Scientifiques',
        explore_clubs: 'Explorer les Clubs',
        no_clubs: 'Vous n\'avez encore rejoint aucun club.',
        courses_title: 'Formations & Compétences',
        register_course: 'S\'inscrire',
        no_courses: 'Aucune formation enregistrée.',
        pillar_meter: 'Indicateurs d\'autonomisation',
        counseling_title: 'Consultations & Réponses',
        ask_counselor: 'Poser une question',
        no_consultations: 'Aucune consultation privée soumise.',
        pending: 'En cours d\'analyse',
        answered: 'Réponse disponible',
        active: 'Actif',
        completed: 'Complété'
    },
    en: {
        welcome: 'Welcome, ',
        subtitle: 'Track your impact and active engagements in youth hostels',
        welcome_guest: 'Welcome to the Athar platform',
        guest_cta: 'Create your account and use the whole platform',
        guest_desc: 'Clubs, training, volunteering and impact points await you — free and fast sign-up.',
        guest_btn: 'Log in / Create account',
        my_clubs: 'Joined Clubs',
        my_training: 'Training Courses',
        my_counseling: 'Private Support',
        clubs_title: 'My Scientific & Cultural Clubs',
        explore_clubs: 'Explore Clubs',
        no_clubs: 'You have not joined any youth clubs yet.',
        courses_title: 'Skills & Certified Training',
        register_course: 'Register',
        no_courses: 'No courses registered currently.',
        pillar_meter: 'Youth Empowerment Scale',
        counseling_title: 'Consultations & Anonymous Support',
        ask_counselor: 'Ask Support',
        no_consultations: 'No support requests submitted yet.',
        pending: 'Pending Analysis',
        answered: 'Response Issued',
        active: 'Active',
        completed: 'Completed'
    }
};

async function init() {
    const auth = await requireAuth({ guests: true });
    if (!auth) return;

    const lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;

    setLanguage(lang);
    injectLayout();

    if (!auth.guest) {
        mountSkeleton(document.getElementById('joined-clubs-list'), SKEL_ROWS(3));
        mountSkeleton(document.getElementById('joined-courses-list'), SKEL_ROWS(3));
        mountSkeleton(document.getElementById('counseling-list'), SKEL_ROWS(3));
    }

    if (auth.guest) {
        document.getElementById('welcome-title').innerText = d.welcome_guest;
        document.getElementById('welcome-subtitle').innerText = d.subtitle;
        document.getElementById('user-points').innerText = '0';
        ['cnt-clubs', 'cnt-courses', 'cnt-support'].forEach(id => { document.getElementById(id).innerText = '0'; });
        document.getElementById('joined-clubs-list').innerHTML = `
            <div class="stat-card flex-center" style="flex-direction:column; gap:14px; padding:34px; background:rgba(5,217,232,0.04); border-radius:18px; text-align:center;">
                <div style="display:flex;">${ic('key', 28)}</div>
                <div style="font-size:15px; font-weight:700;">${d.guest_cta}</div>
                <div style="font-size:12px; opacity:0.8; line-height:1.6;">${d.guest_desc}</div>
                <a class="btn btn-primary" href="/pages/auth.html" style="justify-content:center; margin-top:6px;">${d.guest_btn}</a>
            </div>`;
        return;
    }

    // Localize Dashboard Strings
    document.getElementById('welcome-title').innerText = `${d.welcome}${auth.profile.full_name || 'مستخدم جديد'}`;
    document.getElementById('welcome-subtitle').innerText = d.subtitle;
    document.getElementById('lbl-my-clubs').innerText = d.my_clubs;
    document.getElementById('lbl-my-training').innerText = d.my_training;
    document.getElementById('lbl-my-counseling').innerText = d.my_counseling;
    document.getElementById('title-joined-clubs').innerText = d.clubs_title;
    document.getElementById('btn-explore-clubs').innerText = d.explore_clubs;
    document.getElementById('title-joined-courses').innerText = d.courses_title;
    document.getElementById('btn-explore-courses').innerText = d.register_course;
    document.getElementById('title-pillar-progress').innerText = d.pillar_meter;
    document.getElementById('title-consultations').innerText = d.counseling_title;
    document.getElementById('btn-ask-counselor').innerText = d.ask_counselor;

    // Load user profile points
    document.getElementById('user-points').innerText = auth.profile.impact_points || 0;

    // Fetch joined clubs
    const clubsRes = await neon.from('club_members').select().eq('user_id', auth.user.id);
    const joinedClubs = clubsRes.data || [];
    document.getElementById('cnt-clubs').innerText = joinedClubs.length;

    if (joinedClubs.length > 0) {
        const clubsListContainer = document.getElementById('joined-clubs-list');
        clubsListContainer.innerHTML = '';
        
        // Fetch clubs metadata individually
        for (const member of joinedClubs) {
            const cRes = await neon.from('clubs').select().id(member.club_id);
            const club = cRes.data ? cRes.data[0] : null;
            if (club) {
                const name = lang === 'ar' ? club.name_ar : (lang === 'fr' ? club.name_fr : club.name_en);
                const catIcon = ic(CAT_ICONS[club.category] || 'sparkle', 22);
                clubsListContainer.innerHTML += `
                    <div class="stat-card flex-center" style="justify-content:space-between; padding:15px 20px; background:rgba(255,255,255,0.01); border-radius:18px;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="font-size:22px;">${catIcon}</span>
                            <div>
                                <div style="font-size:14px; font-weight:700;">${name}</div>
                                <div style="font-size:11px; opacity:0.75;">${club.wilaya}</div>
                            </div>
                        </div>
                        <span class="badge" style="background:rgba(0,255,178,0.08); color:var(--neon-green); font-size:10px;">${d.active}</span>
                    </div>
                `;
            }
        }
    }

    // Fetch training enrollments
    const trainRes = await neon.from('training_enrollments').select().eq('user_id', auth.user.id);
    const enrolledCourses = trainRes.data || [];
    document.getElementById('cnt-courses').innerText = enrolledCourses.length;

    if (enrolledCourses.length > 0) {
        const coursesContainer = document.getElementById('joined-courses-list');
        coursesContainer.innerHTML = '';

        for (const enroll of enrolledCourses) {
            const coRes = await neon.from('training_courses').select().id(enroll.course_id);
            const course = coRes.data ? coRes.data[0] : null;
            if (course) {
                const title = lang === 'ar' ? course.title_ar : (lang === 'fr' ? course.title_fr : course.title_en);
                coursesContainer.innerHTML += `
                    <div class="stat-card" style="padding:18px 20px; background:rgba(255,255,255,0.01); border-radius:18px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <div style="font-size:14px; font-weight:700;">${title}</div>
                            <span class="badge" style="${enroll.status === 'completed' ? 'background:rgba(0,255,178,0.08); color:var(--neon-green);' : 'background:rgba(0,212,255,0.08); color:var(--neon-teal);'} font-size:10px;">
                                    ${enroll.status === 'completed' ? d.completed : d.active}
                                </span>
                        </div>
                        <div style="height:4px; background:rgba(255,255,255,0.05); border-radius:2px;">
                            <div style="height:100%; width:${enroll.status === 'completed' ? '100%' : '50%'}; background:var(--neon-teal); border-radius:2px;"></div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Fetch consultations
    const supportRes = await neon.from('consultations').select().eq('user_id', auth.user.id);
    const consultations = supportRes.data || [];
    document.getElementById('cnt-support').innerText = consultations.length;

    if (consultations.length > 0) {
        const cList = document.getElementById('counseling-list');
        cList.innerHTML = '';

        consultations.forEach(q => {
            const isAnswered = q.answer && q.answer.trim().length > 0;
            cList.innerHTML += `
                <div class="stat-card" style="padding:15px; background:rgba(255,255,255,0.01); border-radius:18px; display:flex; flex-direction:column; gap:8px;">
                    <div style="font-size:13px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${q.subject}</div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span class="badge" style="${isAnswered ? 'background:rgba(0,255,178,0.08); color:var(--neon-green);' : 'background:rgba(255,75,75,0.08); color:var(--neon-red);'} font-size:10px;">
                            ${isAnswered ? d.answered : d.pending}
                        </span>
                        <span class="mono" style="font-size:10px; opacity:0.75;">${new Date(q.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
        });
    }

    // Update Pillar Meter dynamically
    const p1 = joinedClubs.length > 0 ? 100 : 0;
    const p2 = (auth.profile.impact_points || 0) >= 50 ? 100 : 0; // Did at least one awareness quiz
    const p3 = enrolledCourses.some(e => e.status === 'completed') ? 100 : (enrolledCourses.length > 0 ? 50 : 0);

    document.getElementById('bar-p1').style.width = `${p1}%`;
    document.getElementById('val-p1').innerText = `${p1}%`;

    document.getElementById('bar-p2').style.width = `${p2}%`;
    document.getElementById('val-p2').innerText = `${p2}%`;

    document.getElementById('bar-p3').style.width = `${p3}%`;
    document.getElementById('val-p3').innerText = `${p3}%`;
}

init();