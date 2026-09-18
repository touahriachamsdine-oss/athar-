// Highly Capable Neon Client (With High Fidelity Local Mock/Demo Fallback)
import { NEON_API_URL, NEON_ANON_KEY } from './config.js';

function getMockTable(table) {
    const data = localStorage.getItem(`athar_mock_db_${table}`);
    return data ? JSON.parse(data) : [];
}

function saveMockTable(table, data) {
    localStorage.setItem(`athar_mock_db_${table}`, JSON.stringify(data));
}

// ---- Mock RPC parity: mirrors the DB security-definer rules (spec §6.2) ----
function mockUserId() {
    const s = JSON.parse(localStorage.getItem('neon_session') || 'null');
    return s && s.user ? s.user.id : null;
}

function mockErr(code) {
    return { data: null, error: { code, message: code } };
}

function mockOk(data) {
    return { data, error: null };
}

function mockIsAdmin() {
    const id = mockUserId();
    if (!id) return false;
    const p = getMockTable('profiles').find(x => String(x.id) === String(id));
    return !!p && (p.role === 'admin' || p.role === 'superadmin');
}

function mockIsInitiativeLeader(initiativeId) {
    const id = mockUserId();
    if (!id) return false;
    if (mockIsAdmin()) return true;
    return getMockTable('initiative_members').some(m =>
        String(m.initiative_id) === String(initiativeId) &&
        String(m.user_id) === String(id) &&
        (m.role === 'founder' || m.role === 'leader'));
}

function mockLogPoints(userId, amount, reason, refType, refId) {
    const db = JSON.parse(localStorage.getItem('athar_mock_db_ledger') || '[]');
    db.push({ id: 'm-' + Math.random().toString(36).slice(2), user_id: userId, amount, reason, ref_type: refType, ref_id: refId, created_at: new Date().toISOString() });
    localStorage.setItem('athar_mock_db_ledger', JSON.stringify(db));
    const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
    const p = profiles.find(x => x.id === userId);
    if (p) { p.impact_points = (p.impact_points || 0) + amount; }
    localStorage.setItem('athar_mock_db_profiles', JSON.stringify(profiles));
}
function mockBlockedProfilesWrite() {
    return { data: null, error: { code: 'forbidden', message: 'table not allowed' } };
}
async function mockRecordQuizAttempt(contentId, passed, score) {
    const sess = JSON.parse(localStorage.getItem('neon_session') || 'null');
    if (!sess || !sess.user) return { data: null, error: { code: 'unauthorized', message: 'login required' } };
    const uid = sess.user.id;
    const attempts = JSON.parse(localStorage.getItem('athar_mock_db_quiz_attempts') || '[]');
    const existing = attempts.find(a => a.user_id === uid && a.content_id === contentId);
    if (existing) { existing.passed = !!passed; existing.score = score || 0; }
    else { attempts.push({ id: 'm-quiz', user_id: uid, content_id: contentId, passed: !!passed, score: score || 0 }); }
    localStorage.setItem('athar_mock_db_quiz_attempts', JSON.stringify(attempts));
    if (passed) {
        const ledger = JSON.parse(localStorage.getItem('athar_mock_db_ledger') || '[]');
        if (!ledger.some(l => l.user_id === uid && l.reason === 'awareness_quiz' && l.ref_id === contentId)) {
            mockLogPoints(uid, 50, 'awareness_quiz', 'awareness_content', contentId);
        }
    }
    return { data: { status: 'recorded' }, error: null };
}
async function mockImpactSummary(userId) {
    const sess = JSON.parse(localStorage.getItem('neon_session') || 'null');
    if (!sess || !sess.user) return { data: null, error: { code: 'unauthorized', message: 'login required' } };
    const me = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]').find(x => x.id === sess.user.id);
    if (userId !== sess.user.id && !(me && ['admin', 'superadmin'].includes(me.role))) {
        return { data: null, error: { code: 'forbidden', message: 'forbidden' } };
    }
    const ledger = JSON.parse(localStorage.getItem('athar_mock_db_ledger') || '[]').filter(l => l.user_id === userId);
    const total = ledger.reduce((s, l) => s + l.amount, 0);
    const breakdown = ledger.reduce((o, l) => { o[l.reason] = (o[l.reason] || 0) + l.amount; return o; }, {});
    const tier = total >= 2000 ? 5 : total >= 1000 ? 4 : total >= 500 ? 3 : total >= 250 ? 2 : total > 0 ? 1 : 0;
    return { data: { total_points: total, breakdown, badge_tier: tier }, error: null };
}
async function mockPlatformStats() {
    const clubs = JSON.parse(localStorage.getItem('athar_mock_db_clubs') || '[]');
    const profilesCount = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]').length;
    const schoolVisits = JSON.parse(localStorage.getItem('athar_mock_db_school_visits') || '[]');
    const signups = JSON.parse(localStorage.getItem('athar_mock_db_volunteer_signups') || '[]');
    return { data: {
        clubs: clubs.length,
        members: profilesCount,
        school_visits: schoolVisits.length,
        volunteer_hours: signups.reduce((s, v) => s + (v.hours || 0), 0)
    }, error: null };
}
async function mockAwardAdmin(userId, amount, reason) {
    const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
    const me = profiles.find(x => x.id === JSON.parse(localStorage.getItem('neon_session') || 'null')?.user?.id);
    if (!me || !['admin', 'superadmin'].includes(me.role)) {
        return { data: null, error: { code: 'forbidden', message: 'forbidden' } };
    }
    mockLogPoints(userId, amount, reason || 'admin_adjustment', 'admin', null);
    return { data: { status: 'awarded' }, error: null };
}
async function mockUpdateProfileSettings(pLang, pTheme, pFullName, pPhone, pWilaya, pNeighborhood) {
    const sess = JSON.parse(localStorage.getItem('neon_session') || 'null');
    if (!sess || !sess.user) return { data: null, error: { code: 'unauthorized', message: 'login required' } };
    const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
    const p = profiles.find(x => x.id === sess.user.id);
    if (p) {
        if (pLang) p.lang = pLang;
        if (pTheme) p.theme = pTheme;
        if (pFullName) p.full_name = pFullName;
        if (pPhone) p.phone = pPhone;
        if (pWilaya) p.wilaya = pWilaya;
        if (pNeighborhood) p.neighborhood = pNeighborhood;
        localStorage.setItem('athar_mock_db_profiles', JSON.stringify(profiles));
    }
    return { data: { status: 'updated' }, error: null };
}
function mockRpcDispatch(fn, p) {
    const id = mockUserId();
    if (!id) return mockErr('unauthorized');

    if (fn === 'create_volunteer_session') {
        const pl = p.p_payload || {};
        if (!mockIsInitiativeLeader(pl.initiative_id)) return mockErr('forbidden');
        const rows = getMockTable('volunteer_sessions');
        const row = {
            id: 'vs-' + Math.random().toString(36).substring(2, 15),
            initiative_id: pl.initiative_id,
            title_ar: pl.title_ar || '', title_fr: pl.title_fr || '', title_en: pl.title_en || '',
            description_ar: pl.description_ar, description_fr: pl.description_fr, description_en: pl.description_en,
            location: pl.location || '',
            start_at: pl.start_at, end_at: pl.end_at,
            capacity: Math.max(1, parseInt(pl.capacity, 10) || 1),
            status: 'pending',
            created_by: id, reviewed_by: null, reviewed_at: null, reject_reason: null,
            created_at: new Date().toISOString(), updated_at: new Date().toISOString()
        };
        rows.push(row);
        saveMockTable('volunteer_sessions', rows);
        return mockOk([row]);
    }

    const sessions = getMockTable('volunteer_sessions');
    const session = sessions.find(s => String(s.id) === String(p.p_session_id));

    if (fn === 'signup_to_session') {
        if (!session) return mockErr('not_found');
        if (session.status !== 'approved') return mockErr('validation');
        if (new Date(session.end_at) <= new Date()) return mockErr('validation');
        if (String(p.p_volunteer_id) === String(session.created_by)) return mockErr('validation');
        const signups = getMockTable('volunteer_signups');
        const existing = signups.find(x => String(x.session_id) === String(session.id) && String(x.volunteer_id) === String(p.p_volunteer_id));
        if (existing && (existing.status === 'registered' || existing.status === 'attended')) return mockOk({ status: 'registered' });
        const seated = signups.filter(x => String(x.session_id) === String(session.id) && ['registered', 'attended'].includes(x.status)).length;
        if (seated >= session.capacity) return mockErr('conflict');
        if (existing && existing.status === 'cancelled') {
            existing.status = 'registered';
            saveMockTable('volunteer_signups', signups);
            return mockOk({ status: 'registered' });
        }
        signups.push({
            id: 'vsg-' + Math.random().toString(36).substring(2, 15),
            session_id: session.id, volunteer_id: p.p_volunteer_id,
            status: 'registered', attended_at: null, hours: null, points_awarded: 0,
            created_at: new Date().toISOString()
        });
        saveMockTable('volunteer_signups', signups);
        return mockOk({ status: 'registered' });
    }

    if (fn === 'cancel_signup') {
        const signups = getMockTable('volunteer_signups');
        const row = signups.find(x => String(x.session_id) === String(p.p_session_id) && String(x.volunteer_id) === String(p.p_volunteer_id) && x.status === 'registered');
        if (!row) return mockErr('not_found');
        row.status = 'cancelled';
        saveMockTable('volunteer_signups', signups);
        return mockOk({ status: 'cancelled' });
    }

    if (fn === 'mark_attendance') {
        if (!session) return mockErr('not_found');
        if (!mockIsInitiativeLeader(session.initiative_id)) return mockErr('forbidden');
        const signups = getMockTable('volunteer_signups');
        const row = signups.find(x => String(x.session_id) === String(p.p_session_id) && String(x.volunteer_id) === String(p.p_volunteer_id) && x.status === 'registered');
        if (!row) return mockErr('not_found');
        row.status = p.p_attended ? 'attended' : 'no_show';
        row.attended_at = p.p_attended ? new Date().toISOString() : null;
        saveMockTable('volunteer_signups', signups);
        return mockOk({ status: row.status });
    }

    if (fn === 'complete_session') {
        if (!session) return mockErr('not_found');
        if (!mockIsInitiativeLeader(session.initiative_id)) return mockErr('forbidden');
        if (session.status !== 'approved') return mockErr('validation');
        const hours = Math.max(1, Math.min(8, Math.floor((new Date(session.end_at) - new Date(session.start_at)) / 3600000)));
        const points = Math.min(50, hours * 10);
        session.status = 'completed';
        session.updated_at = new Date().toISOString();
        const signups = getMockTable('volunteer_signups');
        let attended = 0;
        signups.forEach(row => {
            if (String(row.session_id) === String(session.id) && row.status === 'attended') {
                row.hours = hours;
                row.points_awarded = points;
                attended++;
                mockLogPoints(row.volunteer_id, points, 'volunteer_complete', 'volunteer_signups', row.id);
            }
        });
        saveMockTable('volunteer_sessions', sessions);
        saveMockTable('volunteer_signups', signups);
        return mockOk({ status: 'completed', per_volunteer: points, attended });
    }

    if (fn === 'approve_session') {
        if (!mockIsAdmin()) return mockErr('forbidden');
        if (!session) return mockErr('not_found');
        if (session.status !== 'pending') return mockErr('not_found');
        session.status = 'approved';
        session.reviewed_by = id;
        session.reviewed_at = new Date().toISOString();
        session.updated_at = session.reviewed_at;
        saveMockTable('volunteer_sessions', sessions);
        return mockOk({ status: 'approved' });
    }

    if (fn === 'reject_session') {
        if (!mockIsAdmin()) return mockErr('forbidden');
        if (!session) return mockErr('not_found');
        if (session.status !== 'pending') return mockErr('not_found');
        session.status = 'rejected';
        session.reviewed_by = id;
        session.reviewed_at = new Date().toISOString();
        session.reject_reason = p.p_reason || null;
        session.updated_at = session.reviewed_at;
        saveMockTable('volunteer_sessions', sessions);
        if (session.created_by) {
            const notifs = getMockTable('notifications');
            notifs.push({
                id: 'ntf-' + Math.random().toString(36).substring(2, 15),
                user_id: session.created_by,
                type: 'volunteer_rejected',
                title_ar: 'تم رفض نشاط التطوع', title_fr: 'Session de bénévolat rejetée', title_en: 'Volunteer session rejected',
                body_ar: session.reject_reason || 'راجع البيانات وأعد المحاولة',
                body_fr: session.reject_reason || 'Vérifiez les données et réessayez',
                body_en: session.reject_reason || 'Check the data and try again',
                is_read: false, initiative_id: session.initiative_id,
                created_at: new Date().toISOString()
            });
            saveMockTable('notifications', notifs);
        }
        return mockOk({ status: 'rejected' });
    }

    if (fn === 'record_quiz_attempt') {
        return mockRecordQuizAttempt(p.p_content_id, p.p_passed, p.p_score);
    }
    if (fn === 'get_impact_summary') {
        return mockImpactSummary(p.p_user_id);
    }
    if (fn === 'get_platform_stats') {
        return mockPlatformStats();
    }
    if (fn === 'award_points_admin') {
        return mockAwardAdmin(p.p_user_id, p.p_amount, p.p_reason);
    }
    if (fn === 'update_profile_settings') {
        return mockUpdateProfileSettings(p.p_lang, p.p_theme, p.p_full_name, p.p_phone, p.p_wilaya, p.p_neighborhood);
    }

    return mockErr('unknown_rpc');
}

export function seedMockDB() {
    if (!localStorage.getItem('athar_mock_db_profiles')) {
        const initialProfiles = [
            {
                id: 'admin_user_id',
                full_name: 'أمين المشرف / Amin Admin',
                phone: '0555123456',
                wilaya: 'Alger',
                neighborhood: 'Didouche Mourad',
                avatar_url: '',
                role: 'superadmin',
                impact_points: 150,
                lang: 'ar',
                theme: 'dark',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'member_user_1',
                full_name: 'ياسمين بلعيدي / Yasmine Belaidi',
                phone: '0666987654',
                wilaya: 'Oran',
                neighborhood: 'Akid Lotfi',
                avatar_url: '',
                role: 'member',
                impact_points: 40,
                lang: 'fr',
                theme: 'dark',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'member_user_2',
                full_name: 'كريم قسنطيني / Karim Constantini',
                phone: '0777555666',
                wilaya: 'Constantine',
                neighborhood: 'Sidi M\'Cid',
                avatar_url: '',
                role: 'member',
                impact_points: 90,
                lang: 'en',
                theme: 'light',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'member_user_3',
                full_name: 'فاطمة الزهراء / Fatima Zohra',
                phone: '0555333444',
                wilaya: 'Tlemcen',
                neighborhood: 'Imama',
                avatar_url: '',
                role: 'member',
                impact_points: 0,
                lang: 'ar',
                theme: 'dark',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_profiles', JSON.stringify(initialProfiles));
    }

    if (!localStorage.getItem('athar_mock_db_initiatives')) {
        const initialInitiatives = [
            {
                id: 'init_1',
                title_ar: 'ورشة الذكاء الاصطناعي والروبوتيك للشباب',
                title_fr: 'Atelier IA et Robotique pour les Jeunes',
                title_en: 'AI and Robotics Workshop for Youth',
                description_ar: 'دورة تكوينية تطبيقية لتعلم أساسيات البرمجة وصناعة الروبوتات ببيت الشباب.',
                description_fr: 'Formation pratique pour apprendre le codage et la robotique au foyer de jeunes.',
                description_en: 'Hands-on workshop to learn coding and robotics at the youth hostel.',
                category: 'robotics',
                wilaya: '16', // Alger
                neighborhood: 'Didouche Mourad',
                status: 'active',
                health_score: 95,
                current_step: 3,
                created_by: 'admin_user_id',
                is_approved: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'init_2',
                title_ar: 'حملة التوعية بمخاطر إدمان الشاشات والألعاب الرقمية',
                title_fr: 'Campagne de Sensibilisation sur l\'Addiction aux Écrans',
                title_en: 'Awareness Campaign on Screen Addiction',
                description_ar: 'لقاءات توعوية تفاعلية مع أخصائيين نفسيين لفائدة المتمدرسين ببيوت الشباب.',
                description_fr: 'Rencontres interactives avec des psychologues pour lutter contre l\'addiction aux écrans.',
                description_en: 'Interactive sessions with psychologists to address screen addiction among youth.',
                category: 'other',
                wilaya: '31', // Oran
                neighborhood: 'Akid Lotfi',
                status: 'planning',
                health_score: 80,
                current_step: 1,
                created_by: 'member_user_1',
                is_approved: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'init_3',
                title_ar: 'نادي البرمجة وإنشاء المواقع الإلكترونية',
                title_fr: 'Club de Programmation et Création de Sites',
                title_en: 'Web Programming and Development Club',
                description_ar: 'تعليم الشباب لغات البرمجة HTML, CSS, JavaScript لتمكينهم رقميا.',
                description_fr: 'Apprendre aux jeunes le HTML, CSS et JavaScript pour le web.',
                description_en: 'Teaching youth HTML, CSS, and JavaScript for web development.',
                category: 'programming',
                wilaya: '25', // Constantine
                neighborhood: 'Sidi M\'Cid',
                status: 'completed',
                health_score: 100,
                current_step: 5,
                created_by: 'member_user_2',
                is_approved: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_initiatives', JSON.stringify(initialInitiatives));
    }

    if (!localStorage.getItem('athar_mock_db_clubs')) {
        const initialClubs = [
            {
                id: 'club_1',
                name_ar: 'نادي الروبوتيك التطبيقي',
                name_fr: 'Club de Robotique Appliquée',
                name_en: 'Applied Robotics Club',
                description_ar: 'تصميم وبرمجة الروبوتات للمسابقات الوطنية.',
                description_fr: 'Conception et programmation de robots pour les compétitions.',
                description_en: 'Designing and programming robots for national competitions.',
                category: 'robotics',
                wilaya: 'Alger',
                created_at: new Date().toISOString()
            },
            {
                id: 'club_2',
                name_ar: 'نادي مطوري الويب والبرمجة',
                name_fr: 'Club des Développeurs Web & Codage',
                name_en: 'Web Developers & Coding Club',
                description_ar: 'تعلم تطوير المواقع والتطبيقات الرقمية الحديثة.',
                description_fr: 'Apprentissage du développement web et applications.',
                description_en: 'Learning modern web and mobile application development.',
                category: 'programming',
                wilaya: 'Oran',
                created_at: new Date().toISOString()
            },
            {
                id: 'club_3',
                name_ar: 'نادي المسرح والفنون الشبابي',
                name_fr: 'Club de Théâtre et d\'Arts',
                name_en: 'Youth Theatre & Art Club',
                description_ar: 'تنمية المهارات الإبداعية والتعبيرية من خلال المسرح.',
                description_fr: 'Développement de la créativité et expression théâtrale.',
                description_en: 'Fostering creativity and expression through youth theatre.',
                category: 'theater',
                wilaya: 'Constantine',
                created_at: new Date().toISOString()
            },
            {
                id: 'club_4',
                name_ar: 'نادي أصدقاء الكتاب والمطالعة',
                name_fr: 'Club des Amis du Livre & Lecture',
                name_en: 'Book Friends & Reading Club',
                description_ar: 'مناقشة الكتب الأدبية والعلمية وتلخيصها.',
                description_fr: 'Débats littéraires et synthèses de livres scientifiques.',
                description_en: 'Discussion and summarization of literary and scientific books.',
                category: 'reading',
                wilaya: 'Tlemcen',
                created_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_clubs', JSON.stringify(initialClubs));
    }

    if (!localStorage.getItem('athar_mock_db_club_members')) {
        const initialMembers = [
            { id: 'cm_1', club_id: 'club_1', user_id: 'member_user_1', joined_at: new Date().toISOString() },
            { id: 'cm_2', club_id: 'club_1', user_id: 'member_user_2', joined_at: new Date().toISOString() },
            { id: 'cm_3', club_id: 'club_2', user_id: 'member_user_2', joined_at: new Date().toISOString() },
            { id: 'cm_4', club_id: 'club_3', user_id: 'member_user_3', joined_at: new Date().toISOString() }
        ];
        localStorage.setItem('athar_mock_db_club_members', JSON.stringify(initialMembers));
    }

    if (!localStorage.getItem('athar_mock_db_initiative_members')) {
        const initialInitiativeMembers = [
            { id: 'im_1', initiative_id: 'init_1', user_id: 'member_user_1', role: 'member', joined_at: new Date().toISOString() },
            { id: 'im_2', initiative_id: 'init_1', user_id: 'member_user_2', role: 'leader', joined_at: new Date().toISOString() },
            { id: 'im_3', initiative_id: 'init_3', user_id: 'member_user_3', role: 'member', joined_at: new Date().toISOString() }
        ];
        localStorage.setItem('athar_mock_db_initiative_members', JSON.stringify(initialInitiativeMembers));
    }

    if (!localStorage.getItem('athar_mock_db_training_courses')) {
        const initialCourses = [
            {
                id: 'course_1',
                title_ar: 'القيادة والمواطنة الفعالة للشباب',
                title_fr: 'Leadership & Citoyenneté Active',
                title_en: 'Youth Leadership & Active Citizenship',
                description_ar: 'دورة في مهارات القيادة، التخطيط، والتأثير الإيجابي.',
                description_fr: 'Compétences de leadership, planification et impact positif.',
                description_en: 'Skills for positive leadership, planning, and youth advocacy.',
                instructor: 'Prof. Meriem Bensalah',
                duration: '12 Hours',
                created_at: new Date().toISOString()
            },
            {
                id: 'course_2',
                title_ar: 'أساسيات تصميم وتطوير المواقع',
                title_fr: 'Bases de la Conception et Développement Web',
                title_en: 'Introduction to Web Development',
                description_ar: 'تعلم لغات الويب الأساسية HTML, CSS, JavaScript من الصفر.',
                description_fr: 'Apprendre HTML, CSS et JavaScript en partant de zéro.',
                description_en: 'Learn core web languages HTML, CSS, and JavaScript from scratch.',
                instructor: 'Eng. Karim Kasmi',
                duration: '20 Hours',
                created_at: new Date().toISOString()
            },
            {
                id: 'course_3',
                title_ar: 'الوقاية والتوجيه ضد ضغوط الأقران والإدمان',
                title_fr: 'Prévention & Gestion de la Pression des Pairs',
                title_en: 'Drug Prevention & Peer Pressure Coping',
                description_ar: 'آليات عملية لحماية النفس والوقاية ومساعدة الأقران.',
                description_fr: 'Mécanismes pratiques de protection et d\'accompagnement des pairs.',
                description_en: 'Practical skills for drug prevention, self-protection, and peer support.',
                instructor: 'Dr. Yacine Rahmani',
                duration: '8 Hours',
                created_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_training_courses', JSON.stringify(initialCourses));
    }

    if (!localStorage.getItem('athar_mock_db_training_enrollments')) {
        const initialEnrollments = [
            { id: 'te_1', course_id: 'course_1', user_id: 'member_user_1', status: 'completed', enrolled_at: new Date().toISOString(), completed_at: new Date().toISOString(), certificate_url: 'data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27800%27%20height=%27600%27%3E%3Crect%20width=%27800%27%20height=%27600%27%20fill=%27%230f1118%27/%3E%3Crect%20x=%2720%27%20y=%2720%27%20width=%27760%27%20height=%27560%27%20fill=%27none%27%20stroke=%27%23ff2a6d%27%20stroke-width=%272%27/%3E%3Ctext%20x=%27400%27%20y=%27120%27%20text-anchor=%27middle%27%20fill=%27%23f4f4f4%27%20font-size=%2736%27%20font-family=%27sans-serif%27%3EAthar%20Certificate%3C/text%3E%3Ctext%20x=%27400%27%20y=%27180%27%20text-anchor=%27middle%27%20fill=%27%23c4c4c4%27%20font-size=%2720%27%20font-family=%27sans-serif%27%3Eof%20Completion%3C/text%3E%3Ctext%20x=%27400%27%20y=%27300%27%20text-anchor=%27middle%27%20fill=%27%235d5e7a%27%20font-size=%2716%27%20font-family=%27sans-serif%27%3EIssued%20digitally%20by%20the%20Athar%20youth%20platform%3C/text%3E%3C/svg%3E' },
            { id: 'te_2', course_id: 'course_3', user_id: 'member_user_1', status: 'enrolled', enrolled_at: new Date().toISOString() },
            { id: 'te_3', course_id: 'course_2', user_id: 'member_user_2', status: 'completed', enrolled_at: new Date().toISOString(), completed_at: new Date().toISOString(), certificate_url: 'data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27800%27%20height=%27600%27%3E%3Crect%20width=%27800%27%20height=%27600%27%20fill=%27%230f1118%27/%3E%3Crect%20x=%2720%27%20y=%2720%27%20width=%27760%27%20height=%27560%27%20fill=%27none%27%20stroke=%27%23ff2a6d%27%20stroke-width=%272%27/%3E%3Ctext%20x=%27400%27%20y=%27120%27%20text-anchor=%27middle%27%20fill=%27%23f4f4f4%27%20font-size=%2736%27%20font-family=%27sans-serif%27%3EAthar%20Certificate%3C/text%3E%3Ctext%20x=%27400%27%20y=%27180%27%20text-anchor=%27middle%27%20fill=%27%23c4c4c4%27%20font-size=%2720%27%20font-family=%27sans-serif%27%3Eof%20Completion%3C/text%3E%3Ctext%20x=%27400%27%20y=%27300%27%20text-anchor=%27middle%27%20fill=%27%235d5e7a%27%20font-size=%2716%27%20font-family=%27sans-serif%27%3EIssued%20digitally%20by%20the%20Athar%20youth%20platform%3C/text%3E%3C/svg%3E' },
            { id: 'te_4', course_id: 'course_1', user_id: 'member_user_2', status: 'enrolled', enrolled_at: new Date().toISOString() },
            { id: 'te_5', course_id: 'course_3', user_id: 'member_user_3', status: 'enrolled', enrolled_at: new Date().toISOString() }
        ];
        localStorage.setItem('athar_mock_db_training_enrollments', JSON.stringify(initialEnrollments));
    }

    if (!localStorage.getItem('athar_mock_db_consultations')) {
        const initialConsultations = [
            {
                id: 'consult_1',
                user_id: 'member_user_1',
                is_anonymous: false,
                is_public: false,
                subject: 'Peer Pressure & Academic Stress',
                message: 'I feel extremely overwhelmed because of academic pressure and the expectations of peers. I need advice on how to build confidence.',
                status: 'answered',
                answer: 'Dear Yasmine, thank you for writing. Building strong boundaries and dedicating time to youth hostel activities like robotics can act as a great positive escape. Practice saying no politely but firmly.',
                created_at: new Date().toISOString(),
                answered_at: new Date().toISOString()
            },
            {
                id: 'consult_2',
                user_id: 'member_user_3',
                is_anonymous: true,
                is_public: true,
                subject: 'Overcoming Screen & Gaming Habits',
                message: 'Is there a systematic way to reduce gaming time and engage more in physical/scientific activities at our youth hostels?',
                status: 'pending',
                created_at: new Date().toISOString()
            },
            {
                id: 'consult_3',
                user_id: null,
                is_anonymous: true,
                is_public: true,
                subject: 'Comment gérer le stress avant les examens ?',
                message: 'J\'ai du mal à gérer mon stress avant les examens, avez-vous des conseils ?',
                status: 'answered',
                answer: 'Merci pour votre confiance. Organisez votre temps, pratiquez la respiration profonde, dormez suffisamment et rappelez-vous : la réussite est un marathon, pas un sprint. Le psy de votre foyer de jeunes reste à votre écoute.',
                created_at: new Date().toISOString(),
                answered_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_consultations', JSON.stringify(initialConsultations));
    }

    if (!localStorage.getItem('athar_mock_db_tasks')) {
        const initialTasks = [
            { id: 'task_1', initiative_id: 'init_1', step_number: 1, title_ar: 'حضور ورشة التكوين الأولى في الروبوتيك', title_fr: 'Assister à l\'atelier de robotique n°1', title_en: 'Attend first robotics workshop', is_completed: true, created_at: new Date().toISOString() },
            { id: 'task_2', initiative_id: 'init_1', step_number: 2, title_ar: 'إنجاز مشروع روبوت صغير مع الفريق', title_fr: 'Réaliser un mini robot en équipe', title_en: 'Build a mini robot with the team', is_completed: false, created_at: new Date().toISOString() },
            { id: 'task_3', initiative_id: 'init_3', step_number: 1, title_ar: 'إنشاء أول صفحة ويب شخصية', title_fr: 'Créer une première page web', title_en: 'Create a first personal web page', is_completed: false, created_at: new Date().toISOString() }
        ];
        localStorage.setItem('athar_mock_db_tasks', JSON.stringify(initialTasks));
    }

    if (!localStorage.getItem('athar_mock_db_awareness_content')) {
        const initialAwareness = [
            {
                id: 'aw_1',
                title_ar: 'إدمان الشاشات والألعاب الرقمية: كيف تحمي نفسك؟',
                title_fr: 'Addiction aux Écrans : Comment se Protéger ?',
                title_en: 'Screen & Gaming Addiction: How to Protect Yourself?',
                description_ar: 'مواد توعوية بأضرار الاستعمال المفرط للشاشات مع خطوات عملية للتخلص التدريجي من الإدمان.',
                description_fr: 'Sensibilisation sur les dangers des écrans et étapes concrètes pour réduire l\'usage.',
                description_en: 'Awareness content on the harms of excessive screens with practical steps to cut usage.',
                content_type: 'article',
                media_url: '',
                created_at: new Date().toISOString()
            },
            {
                id: 'aw_2',
                title_ar: 'قصة نجاح: من الإدمان إلى التميز',
                title_fr: 'Histoire de Réussite : de l\'Addiction à l\'Excellence',
                title_en: 'Success Story: From Addiction to Excellence',
                description_ar: 'شاهد كيف حول شاب طاقته من الألعاب الرقمية إلى نادي الروبوتيك وحقق المركز الأول وطنيا.',
                description_fr: 'Comment un jeune a transformé son énergie du jeu vidéo vers la robotique.',
                description_en: 'How a young man redirected his energy from gaming to robotics and won nationally.',
                content_type: 'video',
                media_url: '',
                created_at: new Date().toISOString()
            },
            {
                id: 'aw_3',
                title_ar: 'مخاطر التدخين الإلكتروني وسوء استعمال المواد',
                title_fr: 'Dangers du Vapotage et Usage de Substances',
                title_en: 'Vaping and Substance Abuse Risks',
                description_ar: 'خرافات شائعة حول السجائر الإلكترونية وحقائق علمية، مع آلية رفض واضحة.',
                description_fr: 'Mythes courants sur la cigarette électronique et mécanismes de refus.',
                description_en: 'Common vaping myths, scientific facts, and clear refusal techniques.',
                content_type: 'article',
                media_url: '',
                created_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_awareness_content', JSON.stringify(initialAwareness));
    }

    if (!localStorage.getItem('athar_mock_db_school_visits')) {
        const initialVisits = [
            {
                id: 'sv_1',
                school_name: 'متوسطة محمد بوضياف',
                school_type: 'middle',
                wilaya: 'Alger',
                visit_date: new Date().toISOString(),
                activity_type: 'workshop',
                status: 'confirmed',
                user_id: 'admin_user_id',
                created_at: new Date().toISOString()
            },
            {
                id: 'sv_2',
                school_name: 'ثانوية الأمير عبد القادر',
                school_type: 'high',
                wilaya: 'Oran',
                visit_date: new Date().toISOString(),
                activity_type: 'tour',
                status: 'pending',
                user_id: 'member_user_1',
                created_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_school_visits', JSON.stringify(initialVisits));
    }

    if (!localStorage.getItem('athar_mock_db_invites')) {
        const initialInvites = [
            {
                id: 'inv_1',
                initiative_id: 'init_1',
                invited_by: 'admin_user_id',
                invited_email: 'newstudent@athar.dz',
                phone: '',
                role: 'member',
                token: 'invite-demo-token-123',
                is_accepted: false,
                created_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_invites', JSON.stringify(initialInvites));
    }

    if (!localStorage.getItem('athar_mock_db_volunteer_sessions')) {
        const now = Date.now();
        const initialSessions = [
            {
                id: 'vs_demo',
                initiative_id: 'init_1',
                title_ar: 'حملة توزيع الدعم الغذائي بالحي',
                title_fr: 'Campagne de Distribution Alimentaire',
                title_en: 'Neighborhood Food Drive',
                description_ar: 'مساعدة العائلات في توزيع المساعدات الغذائية وتنظيم السلال خلال شهر رمضان.',
                description_fr: 'Aider les familles à distribuer des aides alimentaires pendant le Ramadan.',
                description_en: 'Help families distribute food aid packages during Ramadan.',
                location: 'Didouche Mourad, Alger',
                start_at: new Date(now + 172800000).toISOString(),
                end_at: new Date(now + 172800000 + 6 * 3600000).toISOString(),
                capacity: 6,
                status: 'approved',
                created_by: 'admin_user_id',
                reviewed_by: 'admin_user_id',
                reviewed_at: new Date().toISOString(),
                reject_reason: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'vs_pending',
                initiative_id: 'init_2',
                title_ar: 'أكاديمية التوعية ضد إدمان الشاشات',
                title_fr: 'Académie de Sensibilisation aux Écrans',
                title_en: 'Screen Awareness Academy',
                description_ar: 'ورشة تفاعلية بمواد تعليمية للوقاية من إدمان الألعاب الرقمية.',
                description_fr: 'Atelier interactif pour prévenir l\'addiction aux jeux numériques.',
                description_en: 'Interactive prevention workshop on digital gaming addiction.',
                location: 'Akid Lotfi, Oran',
                start_at: new Date(now + 345600000).toISOString(),
                end_at: new Date(now + 345600000 + 4 * 3600000).toISOString(),
                capacity: 12,
                status: 'pending',
                created_by: 'member_user_1',
                reviewed_by: null,
                reviewed_at: null,
                reject_reason: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];
        localStorage.setItem('athar_mock_db_volunteer_sessions', JSON.stringify(initialSessions));
    }

    if (!localStorage.getItem('athar_mock_db_volunteer_signups')) {
        const initialSignups = [
            { id: 'vsg_demo', session_id: 'vs_demo', volunteer_id: 'member_user_2', status: 'registered', attended_at: null, hours: null, points_awarded: 0, created_at: new Date().toISOString() }
        ];
        localStorage.setItem('athar_mock_db_volunteer_signups', JSON.stringify(initialSignups));
    }

    if (!localStorage.getItem('athar_mock_db_ledger')) {
        localStorage.setItem('athar_mock_db_ledger', JSON.stringify([]));
    }

    if (!localStorage.getItem('athar_mock_db_quiz_attempts')) {
        localStorage.setItem('athar_mock_db_quiz_attempts', JSON.stringify([]));
    }
}

class NeonClient {
    constructor(baseURL) {
        this.baseURL = baseURL;
        this.token = null;
    }

    setToken(token) {
        this.token = token;
    }

    async request(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
        headers['apikey'] = NEON_ANON_KEY;

        const response = await fetch(`${this.baseURL}${path}`, { ...options, headers });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'API Error' }));
            return { data: null, error };
        }
        const data = await response.json();
        return { data, error: null };
    }

    async requestGateway(body) {
        let response;
        try {
            response = await fetch('/api/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
        } catch (e) {
            return { data: null, error: { code: 'network', message: e.message } };
        }
        let json = null;
        try { json = await response.json(); } catch (e) {}
        if (!response.ok || (json && json.error)) {
            const err = (json && json.error) ? json.error : { code: 'unknown', message: 'API Error' };
            return { data: null, error: err };
        }
        return { data: (json && json.data !== undefined) ? json.data : json, error: null };
    }

    async rpc(fn, payload) {
        if (localStorage.getItem('athar_mock_mode') === 'true') {
            seedMockDB();
            return mockRpcDispatch(fn, payload || {});
        }
        return this.requestGateway({ token: this.token, action: 'rpc', fn, payload: payload || {} });
    }

    from(table) {
        if (localStorage.getItem('athar_mock_mode') === 'true') {
            seedMockDB();
            return {
                select: (query = '*') => {
                    const buildUrl = () => '';
                    return {
                        id: async (id) => {
                            const data = getMockTable(table);
                            const item = data.find(x => x.id === id);
                            return { data: item ? [item] : [], error: null };
                        },
                        eq: async (col, val) => {
                            const data = getMockTable(table);
                            const items = data.filter(x => String(x[col]) === String(val));
                            return { data: items, error: null };
                        },
                        then: (cb) => {
                            const data = getMockTable(table);
                            const res = { data, error: null };
                            return cb ? cb(res) : Promise.resolve(res);
                        }
                    };
                },
                insert: async (payload) => {
                    if (table === 'profiles') return mockBlockedProfilesWrite();
                    const data = getMockTable(table);
                    const newRow = {
                        id: payload.id || 'uid-' + Math.random().toString(36).substring(2, 15),
                        ...payload,
                        created_at: new Date().toISOString()
                    };
                    data.push(newRow);
                    saveMockTable(table, data);
                    if (table === 'club_members') mockLogPoints(newRow.user_id, 100, 'club_join', 'club_members', newRow.club_id);
                    return { data: [newRow], error: null };
                },
                update: async (payload, id) => {
                    if (table === 'profiles') return mockBlockedProfilesWrite();
                    const data = getMockTable(table);
                    let updatedRow = null;
                    let oldRow = null;
                    const nextData = data.map(x => {
                        if (x.id === id) {
                            oldRow = x;
                            updatedRow = { ...x, ...payload, updated_at: new Date().toISOString() };
                            return updatedRow;
                        }
                        return x;
                    });
                    saveMockTable(table, nextData);
                    if (updatedRow && table === 'training_enrollments' && updatedRow.status === 'completed' && oldRow.status !== 'completed') {
                        mockLogPoints(updatedRow.user_id, 200, 'training_complete', 'training_enrollments', updatedRow.id);
                    }
                    if (updatedRow && table === 'school_visits' && ['confirmed', 'completed'].includes(updatedRow.status) && oldRow.status !== updatedRow.status && updatedRow.user_id) {
                        mockLogPoints(updatedRow.user_id, 120, 'school_visit', 'school_visits', updatedRow.id);
                    }
                    return { data: updatedRow ? [updatedRow] : [], error: null };
                },
                delete: async (id) => {
                    if (table === 'profiles') return mockBlockedProfilesWrite();
                    const data = getMockTable(table);
                    const nextData = data.filter(x => x.id !== id);
                    saveMockTable(table, nextData);
                    return { data: [], error: null };
                }
            };
        }

        return {
            select: (query = '*') => {
                const selectParam = query !== '*' ? `select=${encodeURIComponent(query)}` : '';
                const buildUrl = (extra = '') => {
                    const params = [selectParam, extra].filter(Boolean).join('&');
                    return `/${table}${params ? `?${params}` : ''}`;
                };
                return {
                    id: async (id) => this.request(buildUrl(`id=eq.${id}`)),
                    eq: async (col, val) => this.request(buildUrl(`${col}=eq.${val}`)),
                    then: (cb) => this.request(buildUrl()).then(cb)
                };
            },
            insert: async (payload) => this.requestGateway({ token: this.token, action: 'insert', table, payload }),
            update: async (payload, id) => this.requestGateway({ token: this.token, action: 'update', table, id, payload }),
            delete: async (id) => this.requestGateway({ token: this.token, action: 'delete', table, id })
        };
    }
}

export const neon = new NeonClient(NEON_API_URL);
