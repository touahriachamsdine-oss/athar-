import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';
import { ic } from '../js/icons.js';
import { mountSkeleton, SKEL_GRID } from '../js/skeletons.js';

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
        start_quiz: 'ابدأ الاختبار',
        sec_tip_title: 'نصيحة اليوم للوقاية',
        sec_tip_desc: '"الاستثمار في نوادي بيوت الشباب العلمية والرياضية هو الدرع الأقوى لحماية العقل من الملهيات والوقوع في شرك الإدمان. بادر بالانضمام والمشاركة!"',
        empty: 'لا يوجد محتوى متوفر حالياً.',
        btn_open: 'تصفح المحتوى'
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
        start_quiz: 'Démarrer le quiz',
        sec_tip_title: 'Conseil de prévention',
        sec_tip_desc: '"S\'engager dans les clubs scientifiques et sportifs est le bouclier le plus fort pour protéger l\'esprit de l\'addiction. Rejoignez-nous !"',
        empty: 'Aucun contenu disponible pour le moment.',
        btn_open: 'Ouvrir'
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
        start_quiz: 'Start quiz',
        sec_tip_title: 'Today\'s Prevention Tip',
        sec_tip_desc: '"Investing time in youth hostels\' scientific and sports clubs is the strongest shield against distractions and addiction. Take the lead!"',
        empty: 'No content available yet.',
        btn_open: 'Open'
    }
};

const QUIZ_BANK = {
    // Screen & Gaming Addiction (article aw_1)
    aw_1: [
        {
            q_ar: 'ما هي الخطوة الأهم للوقاية من إدمان الشاشات؟',
            q_fr: 'Quelle est l\'étape clé pour prévenir l\'addiction aux écrans ?',
            q_en: 'What is the key step to prevent screen addiction?',
            options: [
                { ar: 'الانخراط في الأنشطة الرياضية والعلمية ببيت الشباب', fr: 'S\'engager dans des activités sportives et scientifiques', en: 'Joining sports and scientific activities' },
                { ar: 'اللعب لساعات أطول يوميا', fr: 'Jouer encore plus longtemps chaque jour', en: 'Playing for even longer hours daily' },
                { ar: 'حجب الجهاز عند العائلة', fr: 'Cacher l\'écran à la famille', en: 'Hiding the screen from family' }
            ],
            correct: 0
        },
        {
            q_ar: 'ما الحل الأمثل لشاب يكتشف أنه مدمن ألعاب؟',
            q_fr: 'La meilleure démarche pour un jeune accro au jeu ?',
            q_en: 'The best approach for a young person addicted to gaming?',
            options: [
                { ar: 'الإقلاع فجأة وحيدا دون دعم', fr: 'Arrêter brutalement et seul, sans soutien', en: 'Quitting abruptly and alone, without support' },
                { ar: 'وضع حدود تدريجية والاستعانة بالدعم', fr: 'Fixer des limites progressives avec du soutien', en: 'Setting gradual limits with support' },
                { ar: 'مواصلة اللعب سرا', fr: 'Continuer à jouer en cachette', en: 'Continuing to play in secret' }
            ],
            correct: 1
        },
        {
            q_ar: 'أي سلوك يُعد جزءا من روتين رقمي صحي؟',
            q_fr: 'Quel comportement fait partie d\'une routine numérique saine ?',
            q_en: 'Which behavior is part of a healthy digital routine?',
            options: [
                { ar: 'اللعب حتى ساعات متأخرة من الليل', fr: 'Jouer tard dans la nuit', en: 'Gaming until late at night' },
                { ar: 'استعمال الهاتف أثناء الوجبات والدراسة', fr: 'Utiliser le téléphone pendant les repas et l\'étude', en: 'Using the phone during meals and study' },
                { ar: 'تخصيص أوقات دون أنترنت للعائلة والرياضة', fr: 'Réserver des moments hors-ligne pour la famille et le sport', en: 'Reserving offline time for family and sport' }
            ],
            correct: 2
        },
        {
            q_ar: 'كيف يساهم بيت الشباب في محاربة إدمان الشاشات؟',
            q_fr: 'Comment le foyer de jeunes lutte contre l\'addiction aux écrans ?',
            q_en: 'How does the youth hostel fight screen addiction?',
            options: [
                { ar: 'بتقديم فحوصات طبية فقط', fr: 'En fournissant uniquement des tests médicaux', en: 'By providing medical tests only' },
                { ar: 'بعرض أنشطة علمية وبدنية كبديل إيجابي', fr: 'En offrant des activités scientifiques et sportives', en: 'By offering scientific and physical activities as alternatives' },
                { ar: 'بتركيب ألعاب إلكترونية إضافية', fr: 'En installant plus de jeux électroniques', en: 'By installing more electronic games' }
            ],
            correct: 1
        },
        {
            q_ar: 'ما أفضل طريقة لتقليص وقت لعب الألعاب تدريجيا؟',
            q_fr: 'La meilleure façon de réduire le temps de jeu progressivement ?',
            q_en: 'The best way to gradually reduce gaming time?',
            options: [
                { ar: 'تعويض وقت اللعب بنشاط إبداعي تحبه', fr: 'Remplacer le jeu par une activité créative aimée', en: 'Replacing game time with a hobby you love' },
                { ar: 'حذف جميع التطبيقات مرة واحدة ثم إعادتها', fr: 'Tout supprimer puis tout réinstaller', en: 'Deleting all apps at once then restoring them' },
                { ar: 'زيادة الوقت خلال العطل مباشرة', fr: 'Augmenter le temps pendant les vacances', en: 'Increasing screen time during holidays' }
            ],
            correct: 0
        }
    ],
    // Success Story from Addiction to Excellence (article aw_2)
    aw_2: [
        {
            q_ar: 'إلى أين وجه الشاب طاقته في القصة؟',
            q_fr: 'Vers quoi le jeune a-t-il dirigé son énergie dans l\'histoire ?',
            q_en: 'Where did the young man redirect his energy in the story?',
            options: [
                { ar: 'من الألعاب الرقمية إلى نادي الروبوتيك', fr: 'Du jeu vidéo vers le club de robotique', en: 'From video games to the robotics club' },
                { ar: 'من الدراسة إلى الألعاب', fr: 'Des études vers le jeu', en: 'From studying toward gaming' },
                { ar: 'من النشاطات إلى العزلة', fr: 'Des activités vers l\'isolement', en: 'From activities toward isolation' }
            ],
            correct: 0
        },
        {
            q_ar: 'ما النادي الذي ساعده على التفوق؟',
            q_fr: 'Quel club l\'a aidé à exceller ?',
            q_en: 'Which club helped him excel?',
            options: [
                { ar: 'نادي الروبوتيك التطبيقي', fr: 'Le club de robotique appliquée', en: 'The applied robotics club' },
                { ar: 'نادي الألعاب الإلكترونية', fr: 'Le club des jeux électroniques', en: 'The electronic games club' },
                { ar: 'نادي العزلة الاجتماعية', fr: 'Le club de l\'isolement social', en: 'The social isolation club' }
            ],
            correct: 0
        },
        {
            q_ar: 'ما الذي ساعده أكثر على المواظبة؟',
            q_fr: 'Qu\'est-ce qui l\'a le plus aidé à persévérer ?',
            q_en: 'What helped him the most to stay consistent?',
            options: [
                { ar: 'دعم العائلة والمواظبة على أنشطة النادي', fr: 'Le soutien familial et la pratique régulière du club', en: 'Family support and regular club practice' },
                { ar: 'المكافآت داخل الألعاب', fr: 'Les récompenses dans les jeux', en: 'In-game rewards' },
                { ar: 'الحظ والمصادفة', fr: 'La chance et le hasard', en: 'Luck and chance' }
            ],
            correct: 0
        },
        {
            q_ar: 'ما الإنجاز الذي حققه في نهاية القصة؟',
            q_fr: 'Quel exploit a-t-il réalisé à la fin de l\'histoire ?',
            q_en: 'What achievement did he reach at the end of the story?',
            options: [
                { ar: 'فاز بالألعاب الوطنية', fr: 'Il a gagné la compétition nationale de jeux', en: 'He won the national gaming contest' },
                { ar: 'تحصل على المركز الأول في مسابقة وطنية للروبوتيك', fr: 'Il a décroché la première place nationale en robotique', en: 'He won first place in a national robotics contest' },
                { ar: 'توقف عن كل النشاطات', fr: 'Il a cessé toute activité', en: 'He stopped all activities' }
            ],
            correct: 1
        },
        {
            q_ar: 'ما الدرس الأساسي من هذه القصة؟',
            q_fr: 'Quelle est la leçon essentielle de cette histoire ?',
            q_en: 'What is the essential lesson of this story?',
            options: [
                { ar: 'الإدمان يختفي من تلقاء نفسه', fr: 'L\'addiction disparaît d\'elle-même', en: 'Addiction disappears on its own' },
                { ar: 'البدائل الإيجابية تُستبدل العادات الضارة خطوة بخطوة', fr: 'Les alternatives positives remplacent les mauvaises habitudes pas à pas', en: 'Positive alternatives replace harmful habits step by step' },
                { ar: 'الموهبة لا تحتاج إلى تدريب', fr: 'Le talent n\'a pas besoin de pratique', en: 'Talent needs no practice' }
            ],
            correct: 1
        }
    ],
    // Vaping & Substance Abuse Risks (article aw_3)
    aw_3: [
        {
            q_ar: 'هل السيجارة الإلكترونية أقل ضررا من العادية؟',
            q_fr: 'La cigarette électronique est-elle moins dangereuse que la classique ?',
            q_en: 'Is vaping less harmful than regular cigarettes?',
            options: [
                { ar: 'لا، كليهما يحتويان على مواد مضرة', fr: 'Non, les deux contiennent des substances nocives', en: 'No — both contain harmful substances' },
                { ar: 'نعم، آمنة تماما', fr: 'Oui, totalement sûr', en: 'Yes, it is completely safe' },
                { ar: 'فقط المستوردة آمنة', fr: 'Seule l\'importée est sûre', en: 'Only imported ones are safe' }
            ],
            correct: 0
        },
        {
            q_ar: 'النيكوتين في السجائر الإلكترونية يؤدي إلى...',
            q_fr: 'La nicotine des e-cigarettes entraîne...',
            q_en: 'Nicotine in e-cigarettes leads to...',
            options: [
                { ar: 'إدمان أسرع وأضرار على الدماغ النامي', fr: 'Une addiction plus rapide et des effets sur le cerveau', en: 'Faster addiction and harm to the developing brain' },
                { ar: 'تحسين التنفس والذاكرة', fr: 'Une meilleure respiration et mémoire', en: 'Better breathing and memory' },
                { ar: 'الاسترخاء التام دون أي خطر', fr: 'Une détente totale sans aucun risque', en: 'Full relaxation with no risk' }
            ],
            correct: 0
        },
        {
            q_ar: 'أفضل طريقة لرفض عرض التدخين هي...',
            q_fr: 'La meilleure façon de refuser une offre de vapotage est...',
            q_en: 'The best way to refuse a vaping offer is...',
            options: [
                { ar: 'رفض حازم بالقول لا ومغادرة المكان', fr: 'Un « non » ferme et quitter les lieux', en: 'A firm no and leaving the situation' },
                { ar: 'تجربة القليل ثم التوقف لاحقا', fr: 'Essayer un peu et arrêter plus tard', en: 'Trying a little and stopping later' },
                { ar: 'تسليم الأمر لصديق آخر', fr: 'Laisser un autre ami s\'en charger', en: 'Handing it to another friend' }
            ],
            correct: 0
        },
        {
            q_ar: 'أي من هذه العبارات تُعد خرافة؟',
            q_fr: 'Laquelle de ces affirmations est un mythe ?',
            q_en: 'Which of these statements is a myth?',
            options: [
                { ar: 'الفوبينج مجرد بخار مائي غير ضار', fr: 'Le vapotage n\'est que de la vapeur d\'eau inoffensive', en: 'Vaping is just harmless water vapor' },
                { ar: 'النيكوتين يمكن أن يسبب الإدمان', fr: 'La nicotine peut créer une dépendance', en: 'Nicotine can be addictive' },
                { ar: 'النيكوتين يؤثر على الدماغ', fr: 'La nicotine affecte le cerveau', en: 'Nicotine affects the brain' }
            ],
            correct: 0
        },
        {
            q_ar: 'أين يمكن للشاب الحصول على الدعم لمواجهة المخدرات؟',
            q_fr: 'Où un jeune peut-il trouver du soutien face aux substances ?',
            q_en: 'Where can a young person find support against substances?',
            options: [
                { ar: 'عند مرشد بيت الشباب، منصة أثر، والكبار الموثوقين', fr: 'Au psychologue du foyer, sur Athar et auprès des adultes de confiance', en: 'At the hostel psychologist, on Athar, and with trusted adults' },
                { ar: 'البقاء وحيدا لمعالجة الأمر', fr: 'Rester seul pour gérer le problème', en: 'Staying alone to deal with the problem' },
                { ar: 'إخفاء المشكلة بشكل دائم', fr: 'Cacher le problème pour toujours', en: 'Hiding the problem forever' }
            ],
            correct: 0
        }
    ]
};

const FALLBACK_QUIZ = QUIZ_BANK.aw_1;

let quizIndex = 0;
let quizQuestions = [];
let authSession = null;
let lang = 'ar';
let articles = [];
let currentQuizArticleId = null;

async function init() {
    authSession = await requireAuth({ guests: true });
    if (!authSession) return;

    lang = getCurrentLang();
    const d = DICT[lang] || DICT.ar;

    setLanguage(lang);
    injectLayout();

    mountSkeleton(document.getElementById('articles-grid'), SKEL_GRID(6));

    // Localize Static UI
    document.getElementById('page-title').innerText = d.title;
    document.getElementById('page-subtitle').innerText = d.subtitle;
    document.getElementById('quiz-badge').innerText = d.quiz_badge;
    document.getElementById('btn-restart-quiz').innerText = d.restart;
    document.getElementById('search-input').placeholder = d.search_placeholder;
    document.getElementById('btn-search').innerText = d.btn_search;
    document.getElementById('articles-title').innerText = d.articles_title;
    document.getElementById('sec-tip-title').innerHTML = `${ic('bulb', 18)} ${d.sec_tip_title}`;
    document.getElementById('sec-tip-desc').innerText = d.sec_tip_desc;

    // Fetch dynamic articles/materials from Neon
    const res = await neon.from('awareness_content').select();
    articles = res.data || [];
    if (!currentQuizArticleId && articles.length) {
        currentQuizArticleId = articles[0].id;
    }
    quizQuestions = QUIZ_BANK[currentQuizArticleId] || FALLBACK_QUIZ;

    renderArticles();
    loadQuizQuestion();

    // Events
    document.getElementById('btn-search').onclick = renderArticles;
    document.getElementById('search-input').oninput = renderArticles;
    document.getElementById('btn-restart-quiz').onclick = restartQuiz;
}

function loadQuizQuestion() {
    if (quizIndex >= quizQuestions.length) {
        showQuizResult();
        return;
    }

    document.getElementById('quiz-step').innerText = `${quizIndex + 1} / ${quizQuestions.length}`;
    const q = quizQuestions[quizIndex];
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
    const q = quizQuestions[quizIndex];
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

    // Award 50 impact points via the server RPC (once per article)
    if (authSession && authSession.user && currentQuizArticleId) {
        await neon.rpc('record_quiz_attempt', { p_content_id: currentQuizArticleId, p_passed: true, p_score: quizQuestions.length });
    }
}

function restartQuiz() {
    quizQuestions = QUIZ_BANK[currentQuizArticleId] || FALLBACK_QUIZ;
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
        const d0 = DICT[lang] || DICT.ar;
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; opacity:0.78; padding:40px;">${d0.empty}</div>`;
        return;
    }

    const d = DICT[lang] || DICT.ar;
    grid.innerHTML = filtered.map(a => {
        const title = lang === 'ar' ? a.title_ar : (lang === 'fr' ? a.title_fr : a.title_en);
        const desc = lang === 'ar' ? a.description_ar : (lang === 'fr' ? a.description_fr : a.description_en);
        const tag = a.content_type === 'video' ? `${ic('video', 14)} VIDEO` : `${ic('doc', 14)} ARTICLE`;
        const tagColor = a.content_type === 'video' ? 'var(--neon-green)' : '#ffb300';

        return `
            <div class="article-card">
                <div>
                    <span class="badge" style="background:rgba(255,255,255,0.03); color:${tagColor}; font-size:10px; margin-bottom:15px; display:inline-block;">${tag}</span>
                    <h3 style="font-size:18px; font-weight:700; margin-bottom:12px; line-height:1.4;">${title}</h3>
                    <p style="font-size:14px; opacity:0.78; line-height:1.6; margin-bottom:20px;">${desc || ''}</p>
                </div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <a href="${a.media_url || '#'}" target="_blank" class="btn btn-secondary" style="width:100%; font-size:12px; justify-content:center;">
                        ${d.btn_open}
                    </a>
                    <button class="btn btn-primary quiz-start-btn" data-id="${a.id}" style="width:100%; font-size:12px; justify-content:center;">${d.start_quiz}</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.quiz-start-btn').forEach(btn => {
        btn.onclick = () => {
            currentQuizArticleId = btn.getAttribute('data-id');
            restartQuiz();
        };
    });
}

init();