// Athar App Configuration (Neon Native)
export const NEON_AUTH_URL = 'YOUR_NEON_AUTH_URL';
export const NEON_API_URL = 'YOUR_NEON_API_URL';
export const NEON_ANON_KEY = 'YOUR_NEON_ANON_KEY';

// build.js turns this ON (true) when no real anon key was injected, so the
// deployed site always shows mockups. Stays false in source so the Node test
// suite exercises the real-fetch paths.
export const DEMO_FALLBACK = false;

export const VOLUNTEER_POINTS_PER_HOUR = 10;
export const VOLUNTEER_MAX_SESSION_POINTS = 50;

export const APP_CONFIG = {
    name: { ar: 'أثر', fr: 'Athar', en: 'Athar' },
    version: '1.0.0',
    defaultLang: 'ar',
    defaultTheme: 'dark',
    toastDuration: 3200,
    wilayas: [
        'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra',
        'Béchar', 'Blida', 'Bouira', 'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret',
        'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda', 'Skikda',
        'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem',
        'M\'Sila', 'Mascara', 'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arréridj',
        'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt', 'El Oued', 'Khenchela',
        'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent',
        'Ghardaïa', 'Relizane', 'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal',
        'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet',
        'El M\'Ghair', 'El Meniaa'
    ],
    wilayaCoords: [
        [27.868, -0.294], [36.165, 1.333], [33.798, 2.873], [35.878, 7.114], [35.552, 6.175],
        [36.751, 5.064], [34.85, 5.728], [31.611, -2.223], [36.47, 2.827], [36.374, 3.9],
        [22.784, 5.523], [35.404, 8.124], [34.882, -1.317], [35.37, 1.323], [36.716, 4.053],
        [36.753, 3.056], [34.668, 3.254], [36.822, 5.768], [36.189, 5.411], [34.83, 0.152],
        [36.876, 6.907], [35.197, -0.637], [36.903, 7.762], [36.462, 7.433], [36.365, 6.615],
        [36.264, 2.754], [35.936, 0.088], [35.705, 4.542], [35.403, 0.14], [31.948, 5.324],
        [35.699, -0.632], [33.678, 1.02], [26.506, 8.484], [36.073, 4.767], [36.767, 3.477],
        [36.767, 8.313], [27.668, -8.132], [35.607, 1.811], [33.362, 6.859], [35.438, 7.145],
        [36.287, 7.951], [36.591, 2.448], [36.451, 6.263], [36.264, 1.968], [33.268, -0.312],
        [35.299, -1.14], [32.49, 3.674], [35.739, 0.556], [29.263, 0.232], [21.326, 0.953],
        [34.418, 5.069], [30.132, -2.161], [27.193, 2.484], [19.567, 5.766], [33.101, 6.062],
        [24.553, 9.486], [33.95, 5.923], [30.581, 2.882]
    ],
    categories: [
{ id: 'robotics', icon: 'robot', ar: 'الروبوتيك الذكي', fr: 'Robotique', en: 'Robotics' },
    { id: 'programming', icon: 'code', ar: 'البرمجة والتطوير', fr: 'Programmation', en: 'Programming' },
    { id: 'theater', icon: 'theater', ar: 'المسرح والفنون', fr: 'Théâtre', en: 'Theater' },
    { id: 'music', icon: 'music', ar: 'الموسيقى والأنشطة', fr: 'Musique', en: 'Music' },
    { id: 'reading', icon: 'book', ar: 'المطالعة والنقاش', fr: 'Lecture', en: 'Reading' },
    { id: 'other', icon: 'sparkle', ar: 'أخرى', fr: 'Autre', en: 'Other' }
    ],
    steps: [
        { n: 1, ar: 'التسجيل في النادي', fr: 'Inscription au Club', en: 'Club Registration' },
        { n: 2, ar: 'حضور الورشات والتكوين', fr: 'Formation & Ateliers', en: 'Training & Workshops' },
        { n: 3, ar: 'المشاركة المجتمعية', fr: 'Participation Communautaire', en: 'Community Action' },
        { n: 4, ar: 'التقييم والتأهيل', fr: 'Évaluation & Certification', en: 'Evaluation & Certification' },
        { n: 5, ar: 'الأثر المستدام', fr: 'Impact Durable', en: 'Sustainable Impact' }
    ]
};
