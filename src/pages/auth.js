import { signIn, signUp, signInDemo } from '../js/auth.js';
import { injectLayout } from '../js/layout.js';
import { APP_CONFIG } from '../js/config.js';

let isLogin = true;
injectLayout();

// Populate Wilayas
const wilayaSelect = document.getElementById('wilaya');
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
    submitBtn.textContent = isLogin ? 'دخول' : 'إنشاء حساب جديد';
    modeText.textContent = isLogin ? 'دخول إلى حسابك' : 'أنشئ حسابك للمشاركة';
    toggleBtn.textContent = isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ سجل دخولك';
    demoBtn.style.display = isLogin ? 'flex' : 'none';
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