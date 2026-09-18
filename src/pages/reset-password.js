import { neon } from '../js/neon.js';
import { getCurrentLang, setLanguage } from '../js/i18n.js';

const DICT = {
    ar: {
        title: 'إعادة تعيين كلمة المرور',
        subtitle: 'أدخل كلمة المرور الجديدة لحسابك',
        label: 'كلمة المرور الجديدة',
        btn: 'تحديث كلمة المرور',
        success: 'تم تحديث كلمة المرور بنجاح! جاري تحويلك...',
        missing_token: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية.',
        error: 'حدث خطأ أثناء تحديث كلمة المرور.'
    },
    fr: {
        title: 'Réinitialisation du mot de passe',
        subtitle: 'Entrez votre nouveau mot de passe',
        label: 'Nouveau mot de passe',
        btn: 'Mettre à jour',
        success: 'Mot de passe mis à jour ! Redirection...',
        missing_token: 'Jeton de réinitialisation invalide ou expiré.',
        error: 'Erreur lors de la mise à jour.'
    },
    en: {
        title: 'Reset Password',
        subtitle: 'Enter your new account password',
        label: 'New Password',
        btn: 'Update Password',
        success: 'Password updated successfully! Redirecting...',
        missing_token: 'Invalid or expired reset token.',
        error: 'Error updating password.'
    }
};

async function init() {
    const lang = getCurrentLang();
    setLanguage(lang);
    const d = DICT[lang] || DICT.ar;

    document.getElementById('page-title').textContent = d.title;
    document.getElementById('page-subtitle').textContent = d.subtitle;
    document.getElementById('label-password').textContent = d.label;
    document.getElementById('submit-btn').textContent = d.btn;

    // GoTrue appends token in hash: #access_token=...&type=recovery
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');

    const msgEl = document.getElementById('message');

    if (!accessToken || type !== 'recovery') {
        msgEl.style.color = 'var(--accent-pink)';
        msgEl.textContent = d.missing_token;
        document.getElementById('reset-form').style.display = 'none';
        return;
    }

    document.getElementById('reset-form').onsubmit = async (e) => {
        e.preventDefault();
        const pwd = document.getElementById('password-input').value;
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.textContent = '...';

        const { data, error } = await neon.updatePassword(accessToken, pwd);
        if (error) {
            msgEl.style.color = 'var(--accent-pink)';
            msgEl.textContent = error.message || d.error;
            btn.disabled = false;
            btn.textContent = d.btn;
        } else {
            msgEl.style.color = 'var(--neon-teal)';
            msgEl.textContent = d.success;
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 2000);
        }
    };
}

init();
