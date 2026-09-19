// Athar policies page — privacy / terms / cookies, trilingual, public.
import { getCurrentLang } from '../js/i18n.js';
import { injectLayout } from '../js/layout.js';
import { esc } from '../js/utils.js';

const CONTENT = {
    ar: {
        privacy: {
            title: 'سياسة الخصوصية',
            updated: 'آخر تحديث: سبتمبر 2026',
            intro: 'نلتزم في منصة أثر بحماية خصوصية مستخدمينا وبياناتهم الشخصية.',
            sections: [
                { h: 'البيانات التي نجمعها', p: 'عند التسجيل نجمع الاسم الكامل، رقم الهاتف، الولاية، الحي، ولاحقاً تفضيلات اللغة والواجهة. عند مشاركة لقطات الأثر أو الأنشطة التطوعية نجمع المكان والوقت بشكل أطهر لتمكين الأثر المجتمعي.' },
                { h: 'كيف نستخدم بياناتك', p: 'تُستخدم البيانات لإنشاء الحساب، عرض الأنشطة المناسبة، منح نقاط الأثر، وحماية المنصة. لا نبيع بياناتك لأي طرف ثالث أبداً.' },
                { h: 'التخزين والحماية', p: 'تُخزن البيانات في قواعد بيانات محمية أمام الوصول، مع تشفير أثناء النقل. الصلاحيات داخل المنصة محددة بحسب الدور (عضو / مشرف).' },
                { h: 'حقوقك', p: 'يمكنك طلب تصحيح أو حذف بياناتك في أي وقت من صفحة الملف الشخصي أو بالتواصل مع مشرف المنصة. تكون اللقطات التطوعية عابرة وتختفي تلقائياً بعد 24 ساعة.' }
            ]
        },
        terms: {
            title: 'شروط الاستخدام',
            updated: 'آخر تحديث: سبتمبر 2026',
            intro: 'باستخدامك منصة أثر فإنك توافق على الشروط التالية.',
            sections: [
                { h: 'حسن الاستخدام', p: 'يُستخدم المحتوى لأغراض مشروعة فقط. يُمنع نشر محتوى مسيء أو مضلل، ويحتفظ المشرفون بحق الإزالة.' },
                { h: 'الأنشطة والتطوع', p: 'معلومات الأنشطة إرشادية وتخضع لموافقة الإدارة. الالتزام بالمواعيد واجب على المشاركين، ويُسند نقاط الأثر وفق القواعد المعلنة.' },
                { h: 'الملكية الفكرية', p: 'محتوى المنصة وملكيتها الفكرية تعود لمنصة أثر. يمكن مشاركة المحتوى لأغراض تعليمية مع ذكر المصدر.' },
                { h: 'تعديل الشروط', p: 'قد تعدل المنصة هذه الشروط من حين لآخر، ويُحسب استمرارك في الاستخدام موافقة على التعديلات.' }
            ]
        },
        cookies: {
            title: 'سياسة ملفات الارتباط',
            updated: 'آخر تحديث: سبتمبر 2026',
            intro: 'نستخدم ملفات الارتباط من أجل عمل المنصة وتحسين تجربتك.',
            sections: [
                { h: 'الأساسية (ضرورية)', p: 'تُخزن الجلسة، تفضيل اللغة، المظهر، وموافقتك على ملفات الارتباط نفسها. بدونها لا تعمل المنصة.' },
                { h: 'التحليل والتحسين', p: 'ملفات اختيارية تساعدنا على فهم أقسام المنصة الأكثر استخداماً لتحسينها. يمكنك رفضها دون أي تأثير على وظائف المنصة.' },
                { h: 'إدارة اختيارك', p: 'يظهر لك شريط الموافقة عند أول زيارة. يمكنك تغيير اختيارك في أي وقت عبر إزالة بيانات التصفح أو الاتصال بنا.' }
            ]
        }
    },
    fr: {
        privacy: {
            title: 'Politique de Confidentialité',
            updated: 'Dernière mise à jour : septembre 2026',
            intro: 'La plateforme Athar s\'engage à protéger la vie privée et les données personnelles de ses utilisateurs.',
            sections: [
                { h: 'Données collectées', p: 'Lors de l\'inscription nous collectons le nom complet, le téléphone, la wilaya et le quartier, puis les préférences de langue et d\'interface. Lors des stories d\'impact ou du bénévolat, le lieu et l\'heure permettent l\'impact communautaire.' },
                { h: 'Utilisation des données', p: 'Les données servent à créer le compte, proposer des activités adaptées, attribuer des points d\'impact et sécuriser la plateforme. Nous ne vendons jamais vos données.' },
                { h: 'Stockage et sécurité', p: 'Les données sont stockées dans des bases protégées avec chiffrement des transferts. Les permissions suivent le rôle (membre / administrateur).' },
                { h: 'Vos droits', p: 'Vous pouvez corriger ou supprimer vos données depuis le profil ou en contactant l\'administrateur. Les stories sont éphémères et disparaissent après 24 h.' }
            ]
        },
        terms: {
            title: 'Conditions d\'Utilisation',
            updated: 'Dernière mise à jour : septembre 2026',
            intro: 'En utilisant Athar, vous acceptez les conditions suivantes.',
            sections: [
                { h: 'Bon usage', p: 'Le contenu doit servir à des fins légitimes. Tout contenu abusif ou trompeur est interdit et peut être supprimé par les modérateurs.' },
                { h: 'Activités & bénévolat', p: 'Les informations des activités sont indicatives et soumises à approbation. Le respect des horaires engage les participants ; les points d\'impact suivent les règles publiées.' },
                { h: 'Propriété intellectuelle', p: 'Le contenu et la propriété intellectuelle appartiennent à Athar. Le partage éducatif est permis avec mention de la source.' },
                { h: 'Modification des conditions', p: 'Les conditions peuvent évoluer ; continuer à utiliser la plateforme vaut acceptation.' }
            ]
        },
        cookies: {
            title: 'Politique des Cookies',
            updated: 'Dernière mise à jour : septembre 2026',
            intro: 'Nous utilisons des cookies pour faire fonctionner la plateforme et améliorer votre expérience.',
            sections: [
                { h: 'Essentiels (requis)', p: 'Ils gardent la session, la langue, le thème et votre consentement. Sans eux la plateforme ne fonctionne pas.' },
                { h: 'Analyse & amélioration', p: 'Cookies optionnels pour comprendre les sections les plus utilisées et améliorer le service. Vous pouvez les refuser sans conséquence.' },
                { h: 'Gérer votre choix', p: 'La bannière de consentement apparaît à la première visite. Vous pouvez changer d\'avis à tout moment.' }
            ]
        }
    },
    en: {
        privacy: {
            title: 'Privacy Policy',
            updated: 'Last updated: September 2026',
            intro: 'The Athar platform is committed to protecting the privacy and personal data of its users.',
            sections: [
                { h: 'Data we collect', p: 'On signup we collect full name, phone, wilaya and neighborhood, plus language and theme preferences. Impact stories and volunteering include place and time to enable community impact.' },
                { h: 'How we use your data', p: 'Data is used to create your account, surface relevant activities, award impact points and secure the platform. We never sell your data.' },
                { h: 'Storage & security', p: 'Data is stored in protected databases with encrypted transfers. Permissions are role-based (member / admin).' },
                { h: 'Your rights', p: 'You may correct or delete your data anytime from your profile or by contacting the admin. Impact stories are ephemeral and vanish after 24h.' }
            ]
        },
        terms: {
            title: 'Terms of Service',
            updated: 'Last updated: September 2026',
            intro: 'By using Athar you agree to the following terms.',
            sections: [
                { h: 'Fair use', p: 'Content must serve legitimate purposes. Abusive or misleading content is prohibited and may be removed by moderators.' },
                { h: 'Activities & volunteering', p: 'Activity details are indicative and subject to approval. Punctuality binds participants; impact points follow the published rules.' },
                { h: 'Intellectual property', p: 'Platform content and its intellectual property belong to Athar. Educational sharing is allowed with attribution.' },
                { h: 'Changes to these terms', p: 'Terms may be updated; continued use constitutes acceptance.' }
            ]
        }
    }
};

function current() {
    const lang = getCurrentLang();
    const dict = CONTENT[lang] || CONTENT.ar;
    return dict;
}

function init() {
    injectLayout();
    const lang = getCurrentLang();
    const type = new URLSearchParams(window.location.search).get('p') || 'privacy';
    const doc = (CONTENT[lang] || CONTENT.ar)[type] || (CONTENT.ar)[type];

    document.title = `أثر — ${doc.title}`;
    document.getElementById('p-title').innerText = doc.title;
    document.getElementById('p-lang').innerText = lang.toUpperCase();
    document.getElementById('p-updated').innerText = doc.updated;
    document.getElementById('p-intro').innerText = doc.intro;

    const nav = document.getElementById('p-nav');
    nav.innerHTML = [['privacy', (CONTENT[lang] || CONTENT.ar).privacy.title], ['terms', (CONTENT[lang] || CONTENT.ar).terms.title], ['cookies', (CONTENT[lang] || CONTENT.ar).cookies.title]]
        .map(([k, label]) => `<a href="policies.html?p=${k}" class="policy-tab ${k === type ? 'on' : ''}">${label}</a>`).join('');

    const body = document.getElementById('p-body');
    body.innerHTML = doc.sections.map(s => `
        <section class="policy-card">
            <h2>${esc(s.h)}</h2>
            <p>${esc(s.p)}</p>
        </section>`).join('');
}

init();