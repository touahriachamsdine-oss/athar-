// Highly Capable Neon Client (With High Fidelity Local Mock/Demo Fallback)
import { NEON_API_URL } from './config.js';

function getMockTable(table) {
    const data = localStorage.getItem(`athar_mock_db_${table}`);
    return data ? JSON.parse(data) : [];
}

function saveMockTable(table, data) {
    localStorage.setItem(`athar_mock_db_${table}`, JSON.stringify(data));
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
            { id: 'te_1', course_id: 'course_1', user_id: 'member_user_1', status: 'completed', enrolled_at: new Date().toISOString(), completed_at: new Date().toISOString() },
            { id: 'te_2', course_id: 'course_3', user_id: 'member_user_1', status: 'enrolled', enrolled_at: new Date().toISOString() },
            { id: 'te_3', course_id: 'course_2', user_id: 'member_user_2', status: 'completed', enrolled_at: new Date().toISOString(), completed_at: new Date().toISOString() },
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
            }
        ];
        localStorage.setItem('athar_mock_db_consultations', JSON.stringify(initialConsultations));
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

        const response = await fetch(`${this.baseURL}${path}`, { ...options, headers });
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'API Error' }));
            return { data: null, error };
        }
        const data = await response.json();
        return { data, error: null };
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
                    const data = getMockTable(table);
                    const newRow = {
                        id: payload.id || 'uid-' + Math.random().toString(36).substring(2, 15),
                        ...payload,
                        created_at: new Date().toISOString()
                    };
                    data.push(newRow);
                    saveMockTable(table, data);
                    return { data: [newRow], error: null };
                },
                update: async (payload, id) => {
                    const data = getMockTable(table);
                    let updatedRow = null;
                    const nextData = data.map(x => {
                        if (x.id === id) {
                            updatedRow = { ...x, ...payload, updated_at: new Date().toISOString() };
                            return updatedRow;
                        }
                        return x;
                    });
                    saveMockTable(table, nextData);
                    return { data: updatedRow ? [updatedRow] : [], error: null };
                },
                delete: async (id) => {
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
            insert: async (payload) => this.request(`/${table}`, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Prefer': 'return=representation' }
            }),
            update: async (payload, id) => this.request(`/${table}?id=eq.${id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
                headers: { 'Prefer': 'return=representation' }
            }),
            delete: async (id) => this.request(`/${table}?id=eq.${id}`, { method: 'DELETE' })
        };
    }
}

export const neon = new NeonClient(NEON_API_URL);
