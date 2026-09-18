import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';

const DICT = {
    ar: {
        title: 'التوعية والوقاية من السموم',
        subtitle: 'شاهد المحاضرات والدروس التفاعلية وشارك في اختبارات الوعي لربح نقاط الأثر',
        quiz_badge: 'اختبار سريع +50 نقطة',
        result_title: 'عمل رائع!',
        result_desc: 'لقد أكملت اختبار الوعي وحصلت على 50 نقطة أثر بنجاح.',
        restart: 'إعادة المحاولة',
        search_placeholder: 'ابحث عن مقالات أو مقاطع فيديو...',
        btn_search: 'بحث',
        articles_title: 'المحتوى التوعوي والوقائي',
        sec_tip_title: '💡 نصيحة اليوم للوقاية',
        sec_tip_desc: '"الاستثمار في نوادي بيوت الشباب العلمية والرياضية هو الدرع الأقوى لحماية العقل من الملهيات والوقوع في شرك الإدمان. بادر بالانضمام والمشاركة!"'
    },
    fr: {
        title: 'Sensibilisation & Prévention',
        subtitle: 'Visionnez des conférences, cours interactifs et quiz pour gagner des points',
        quiz_badge: 'Quiz Rapide +50 Pts',
        result_title: 'Excellent travail !',
        result_desc: 'Vous avez terminé le quiz de prévention et gagné 50 points d\'impact.',
        restart: 'Recommencer',
        search_placeholder: 'Rechercher des articles, vidéos...',
        btn_search: 'Chercher',
        articles_title: 'Ressources de Prévention',
        sec_tip_title: '💡 Conseil de prévention',
        sec_tip_desc: '"S\'engager dans les clubs scientifiques et sportifs est le bouclier le plus fort pour protéger l\'esprit de l\'addiction. Rejoignez-nous !"'
    },
    en: {
        title: 'Awareness & Poison Prevention',
        subtitle: 'Watch interactive lectures and complete quizzes to earn impact points',
        quiz_badge: 'Quick Quiz +50 Pts',
        result_title: 'Great Job!',
        result_desc: 'You have completed the awareness quiz and gained 50 impact points.',
        restart: 'Try Again',
        search_placeholder: 'Search articles, videos...',
        btn_search: 'Search',
        articles_title: 'Awareness Materials',
        sec_tip_title: '💡 Today\'s Prevention Tip',
        sec_tip_desc: '"Investing time in youth hostels\' scientific and sports clubs is the strongest shield against distractions and addiction. Take the lead!"'
    }
};

const QUIZ_QUESTIONS = [
    {
        q_ar: 'ما هي أهم خطوة للوقاية من الضغط النفسي المؤدي للإدمان؟',
        q_fr: 'Quelle est l\'étape clé pour prévenir la pression menant à l\'addiction ?',
        q_en: 'What is the key step to prevent pressure leading to addiction?',
        options: [
            { ar: 'الانخراط في الأنشطة الرياضية والعلمية ببيت الشباب', fr: 'S\'engager dans des activités sportives et scientifiques', en: 'Engaging in sports and scientific activities' },
            { ar: 'العزلة والابتعاد عن العائلة', fr: 'S\'isoler et fuir sa famille', en: 'Isolation and running away from family' },
            { ar: 'متابعة وسائل التواصل الاجتماعي بكثرة', fr: 'Passer trop de temps sur les réseaux sociaux', en: 'Overusing social media' }
        ],
        correct: 0
    },
    {
        q_ar: 'ما هو الدور الرئيسي لمنصة أثر في الحد من انتشار المخدرات؟',
        q_fr: 'Quel est le rôle principal d\'Athar contre la drogue ?',
        q_en: 'What is the primary role of Athar against drugs?',
        options: [
            { ar: 'تمكين الشباب وتنمية مهاراتهم الإبداعية والمهنية', fr: 'Empowerment des jeunes et développement des compétences', en: 'Youth empowerment and skill development' },
            { ar: 'تقديم فحوصات طبية فقط', fr: 'Fournir uniquement des tests médicaux', en: 'Providing medical tests only' },
            { ar: 'إلغاء النشاطات الترفيهية', fr: 'Annuler les activités récréatives', en: 'Canceling recreational activities' }
        ],
        correct: 0
    }
];

let quizIndex = 0;
let authSession = null;
let lang = 'ar';
let articles = [];

async function init() {
    authSession = await requireAuth({ guests: true });
    if (!authSession) return;

    lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;

    setLanguage(lang);
    injectLayout();

    // Localize Static UI
    document.getElementById('page-title').innerText = d.title;
    document.getElementById('page-subtitle').innerText = d.subtitle;
    document.getElementById('quiz-badge').innerText = d.quiz_badge;
    document.getElementById('btn-restart-quiz').innerText = d.restart;
    document.getElementById('search-input').placeholder = d.search_placeholder;
    document.getElementById('btn-search').innerText = d.btn_search;
    document.getElementById('articles-title').innerText = d.articles_title;
    document.getElementById('sec-tip-title').innerText = d.sec_tip_title;
    document.getElementById('sec-tip-desc').innerText = d.sec_tip_desc;

    // Fetch dynamic articles/materials from Neon
    const res = await neon.from('awareness_content').select();
    articles = res.data || [];

    renderArticles();
    loadQuizQuestion();

    // Events
    document.getElementById('btn-search').onclick = renderArticles;
    document.getElementById('search-input').oninput = renderArticles;
    document.getElementById('btn-restart-quiz').onclick = restartQuiz;
}

function loadQuizQuestion() {
    if (quizIndex >= QUIZ_QUESTIONS.length) {
        showQuizResult();
        return;
    }

    document.getElementById('quiz-step').innerText = `${quizIndex + 1} / ${QUIZ_QUESTIONS.length}`;
    const q = QUIZ_QUESTIONS[quizIndex];
    const qText = lang === 'ar' ? q.q_ar : (lang === 'fr' ? q.q_fr : q.q_en);
    
    document.getElementById('quiz-question').innerText = qText;
    const container = document.getElementById('quiz-options');
    container.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const optText = lang === 'ar' ? opt.ar : (lang === 'fr' ? opt.fr : opt.en);
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = optText;
        btn.onclick = () => selectOption(idx);
        container.appendChild(btn);
    });
}

async function selectOption(idx) {
    const q = QUIZ_QUESTIONS[quizIndex];
    if (idx === q.correct) {
        quizIndex++;
        loadQuizQuestion();
    } else {
        alert(lang === 'ar' ? 'إجابة غير صحيحة، حاول مجدداً!' : 'Réponse incorrecte, réessayez !');
    }
}

async function showQuizResult() {
    document.getElementById('quiz-step').style.display = 'none';
    document.getElementById('quiz-question').style.display = 'none';
    document.getElementById('quiz-options').style.display = 'none';
    
    const resultDiv = document.getElementById('quiz-result');
    resultDiv.style.display = 'block';

    // Localize result text
    const d = DICT[lang] || DICT.ar;
    document.getElementById('result-title').innerText = d.result_title;
    document.getElementById('result-desc').innerText = d.result_desc;

    // Award 50 impact points (members only)
    if (authSession && authSession.user && authSession.profile) {
        const currentPoints = authSession.profile.impact_points || 0;
        await neon.from('profiles').update({ impact_points: currentPoints + 50 }, authSession.user.id);
    }
}

function restartQuiz() {
    quizIndex = 0;
    document.getElementById('quiz-step').style.display = 'inline-block';
    document.getElementById('quiz-question').style.display = 'block';
    document.getElementById('quiz-options').style.display = 'block';
    document.getElementById('quiz-result').style.display = 'none';
    loadQuizQuestion();
}

function renderArticles() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const grid = document.getElementById('articles-grid');

    let filtered = articles;
    if (search) {
        filtered = filtered.filter(a => {
            const title = (lang === 'ar' ? a.title_ar : (lang === 'fr' ? a.title_fr : a.title_en)) || '';
            return title.toLowerCase().includes(search);
        });
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; opacity:0.5; padding:40px;">لا يوجد محتوى متوفر حالياً.</div>`;
        return;
    }

    grid.innerHTML = filtered.map(a => {
        const title = lang === 'ar' ? a.title_ar : (lang === 'fr' ? a.title_fr : a.title_en);
        const desc = lang === 'ar' ? a.description_ar : (lang === 'fr' ? a.description_fr : a.description_en);
        const tag = a.content_type === 'video' ? '📺 VIDEO' : '📄 ARTICLE';
        const tagColor = a.content_type === 'video' ? 'var(--neon-green)' : '#ffb300';

        return `
            <div class="article-card">
                <div>
                    <span class="badge" style="background:rgba(255,255,255,0.03); color:${tagColor}; font-size:10px; margin-bottom:15px; display:inline-block;">${tag}</span>
                    <h3 style="font-size:18px; font-weight:700; margin-bottom:12px; line-height:1.4;">${title}</h3>
                    <p style="font-size:14px; opacity:0.65; line-height:1.6; margin-bottom:20px;">${desc || ''}</p>
                </div>
                <a href="${a.media_url || '#'}" target="_blank" class="btn btn-secondary" style="width:fit-content; font-size:12px;">
                    ${lang === 'ar' ? 'تصفح المحتوى' : 'Ouvrir'}
                </a>
            </div>
        `;
    }).join('');
}

init();