import { signIn, signUp, signInDemo } from '../js/auth.js';
import { injectLayout } from '../js/layout.js';
import { APP_CONFIG } from '../js/config.js';
import { neon } from '../js/neon.js';
import { getCurrentLang } from '../js/i18n.js';

const AUTH = {
    ar: {
        login_mode: 'دخول إلى حسابك',
        signup_mode: 'أنشئ حسابك للمشاركة',
        login_btn: 'دخول',
        signup_btn: 'إنشاء حساب جديد',
        toggle_to_signup: 'ليس لديك حساب؟ إنشاء حساب جديد',
        toggle_to_login: 'لديك حساب بالفعل؟ سجل دخولك',
        demo_btn: 'دخول سريع (نسخة تجريبية)',
        ph_name: 'الاسم الكامل',
        ph_phone: 'رقم الهاتف',
        ph_wilaya: 'اختر الولاية',
        ph_neighborhood: 'الحي',
        ph_email: 'البريد الإلكتروني',
        ph_password: 'كلمة المرور'
    },
    fr: {
        login_mode: 'Connexion à votre compte',
        signup_mode: 'Créez votre compte pour participer',
        login_btn: 'Se connecter',
        signup_btn: 'Créer un compte',
        toggle_to_signup: 'Pas de compte ? Créer un compte',
        toggle_to_login: 'Déjà un compte ? Se connecter',
        demo_btn: 'Accès rapide (démo)',
        ph_name: 'Nom complet',
        ph_phone: 'Téléphone',
        ph_wilaya: 'Choisir la wilaya',
        ph_neighborhood: 'Quartier',
        ph_email: 'Adresse email',
        ph_password: 'Mot de passe'
    },
    en: {
        login_mode: 'Sign in to your account',
        signup_mode: 'Create your account to join',
        login_btn: 'Sign In',
        signup_btn: 'Create Account',
        toggle_to_signup: 'No account yet? Create one',
        toggle_to_login: 'Already have an account? Sign in',
        demo_btn: 'Quick Access (demo)',
        ph_name: 'Full Name',
        ph_phone: 'Phone Number',
        ph_wilaya: 'Choose wilaya',
        ph_neighborhood: 'Neighborhood',
        ph_email: 'Email Address',
        ph_password: 'Password'
    }
};

const FORGOT = {
    ar: { link: 'نسيت كلمة المرور؟', title: 'استعادة كلمة المرور', sub: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين', placeholder: 'البريد الإلكتروني', btn: 'إرسال رابط الاستعادة', sent: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني', err: 'تعذر إرسال رابط الاستعادة، حاول مجدداً', close: 'إغلاق' },
    fr: { link: 'Mot de passe oublié ?', title: 'Récupération du mot de passe', sub: 'Entrez votre adresse email pour recevoir un lien de réinitialisation', placeholder: 'Adresse email', btn: 'Envoyer le lien', sent: 'Lien de réinitialisation envoyé à votre adresse email', err: 'Échec de l\'envoi, veuillez réessayer', close: 'Fermer' },
    en: { link: 'Forgot password?', title: 'Password Recovery', sub: 'Enter your email and we will send you a reset link', placeholder: 'Email address', btn: 'Send Reset Link', sent: 'Reset link sent to your email address', err: 'Failed to send the reset link, please try again', close: 'Close' }
};

let isLogin = true;
injectLayout();

const lang = getCurrentLang() && ['ar', 'fr', 'en'].includes(getCurrentLang()) ? getCurrentLang() : 'ar';
const a = AUTH[lang];
const f = FORGOT[lang];

// Localize static labels
document.getElementById('mode-text').textContent = a.login_mode;
document.getElementById('email').placeholder = a.ph_email;
document.getElementById('password').placeholder = a.ph_password;
document.getElementById('full_name').placeholder = a.ph_name;
document.getElementById('phone').placeholder = a.ph_phone;
document.getElementById('neighborhood').placeholder = a.ph_neighborhood;
document.getElementById('submit-btn').textContent = a.login_btn;
document.getElementById('toggle-mode').textContent = a.toggle_to_signup;
document.getElementById('demo-btn').textContent = a.demo_btn;
document.getElementById('forgot-btn').textContent = f.link;
document.getElementById('forgot-title').textContent = f.title;
document.getElementById('forgot-sub').textContent = f.sub;
document.getElementById('forgot-email').placeholder = f.placeholder;
document.getElementById('forgot-send').textContent = f.btn;
document.getElementById('forgot-cancel').textContent = f.close;

// Populate Wilayas
const wilayaSelect = document.getElementById('wilaya');
wilayaSelect.options[0].textContent = a.ph_wilaya;
APP_CONFIG.wilayas.forEach((w, i) => {
    const opt = document.createElement('option');
    opt.value = w;
    opt.textContent = `${i + 1}. ${w}`;
    wilayaSelect.appendChild(opt);
});

const toggleBtn = document.getElementById('toggle-mode');
const signupFields = document.getElementById('signup-fields');
const submitBtn = document.getElementById('submit-btn');
const demoBtn = document.getElementById('demo-btn');
const modeText = document.getElementById('mode-text');

toggleBtn.onclick = () => {
    isLogin = !isLogin;
    signupFields.style.display = isLogin ? 'none' : 'flex';
    submitBtn.textContent = isLogin ? a.login_btn : a.signup_btn;
    modeText.textContent = isLogin ? a.login_mode : a.signup_mode;
    toggleBtn.textContent = isLogin ? a.toggle_to_signup : a.toggle_to_login;
    demoBtn.style.display = isLogin ? 'flex' : 'none';
    document.getElementById('forgot-row').style.display = isLogin ? 'flex' : 'none';
};

document.getElementById('forgot-btn').onclick = openForgot;

const overlay = document.getElementById('forgot-overlay');
const forgotMsg = document.getElementById('forgot-msg');
const forgotEmail = document.getElementById('forgot-email');

function openForgot() {
    forgotMsg.textContent = '';
    forgotMsg.style.color = '';
    forgotEmail.value = '';
    overlay.style.display = 'flex';
    forgotEmail.focus();
}

function closeForgot() {
    overlay.style.display = 'none';
}

document.getElementById('forgot-cancel').onclick = closeForgot;
overlay.onclick = (e) => { if (e.target === overlay) closeForgot(); };

document.getElementById('forgot-form').onsubmit = async (e) => {
    e.preventDefault();
    const sendBtn = document.getElementById('forgot-send');
    sendBtn.disabled = true;
    sendBtn.style.opacity = 0.6;
    const { error } = await neon.recoverPassword(forgotEmail.value);
    sendBtn.disabled = false;
    sendBtn.style.opacity = 1;
    if (error) {
        forgotMsg.textContent = error.message || f.err;
        forgotMsg.style.color = 'var(--accent-pink)';
    } else {
        forgotMsg.textContent = f.sent;
        forgotMsg.style.color = 'var(--neon-teal)';
        setTimeout(closeForgot, 2600);
    }
};

demoBtn.onclick = async () => {
    demoBtn.disabled = true;
    demoBtn.style.opacity = 0.5;
    await signInDemo('superadmin');
};

document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.style.opacity = 0.5;

    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;

    if (isLogin) {
        const res = await signIn(email, pass);
        if (res?.error) alert(res.error);
    } else {
        const fullName = document.getElementById('full_name').value;
        const phone = document.getElementById('phone').value;
        const wilaya = document.getElementById('wilaya').value;
        const neighborhood = document.getElementById('neighborhood').value;

        const res = await signUp(email, pass, fullName, phone, wilaya, neighborhood);
        if (res?.error) alert(res.error);
    }
    submitBtn.disabled = false;
    submitBtn.style.opacity = 1;
};