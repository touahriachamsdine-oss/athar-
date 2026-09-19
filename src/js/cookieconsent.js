// Athar cookie consent banner — self-installing, CSP-safe, no inline scripts.
// Consent stored in localStorage under 'athar_cookie_consent'.

const CC_KEY = 'athar_cookie_consent';

const CC_TEXTS = {
    ar: {
        title: 'نحن نستخدم ملفات الارتباط',
        body: 'ملفات الارتباط الأساسية ضرورية لعمل المنصة. نستخدم غيرها لتحليل الاستخدام وتحسين تجربتك. يمكنك قبول الكل أو رفض غير الضروري منها، وتغيير اختيارك لاحقاً من صفحة السياسات.',
        accept: 'قبول الكل',
        reject: 'رفض غير الضروري',
        policies: 'سياسة الخصوصية والكوكيز'
    },
    fr: {
        title: 'Nous utilisons des cookies',
        body: 'Les cookies essentiels sont requis pour le fonctionnement de la plateforme. Les autres servent à analyser l\'audience et améliorer votre expérience. Vous pouvez tout accepter ou rejeter les cookies non essentiels, et modifier votre choix à tout moment.',
        accept: 'Tout accepter',
        reject: 'Refuser les non-essentiels',
        policies: 'Confidentialité & Cookies'
    },
    en: {
        title: 'We use cookies',
        body: 'Essential cookies are required for the platform to work. Others help us analyze usage and improve your experience. You can accept all or reject non-essential cookies, and change your choice anytime.',
        accept: 'Accept all',
        reject: 'Reject non-essential',
        policies: 'Privacy & Cookies'
    }
};

function currentLang() {
    return localStorage.getItem('athar_lang') || 'ar';
}

function getConsent() {
    try {
        const raw = localStorage.getItem(CC_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function setConsent(analytics, marketing) {
    localStorage.setItem(CC_KEY, JSON.stringify({
        necessary: true,
        analytics: !!analytics,
        marketing: !!marketing,
        ts: new Date().toISOString()
    }));
}

function inject() {
    const lang = CC_TEXTS[currentLang()] || CC_TEXTS.ar;
    const dom = document.createElement('div');
    dom.id = 'cookie-consent-banner';
    dom.setAttribute('role', 'dialog');
    dom.setAttribute('aria-live', 'polite');
    dom.innerHTML = `
        <div class="cc-card">
            <div class="cc-head">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8.5 9h.01M15 8h.01M12 12.5h.01M9 15.5h.01M14.5 14h.01"/></svg>
                <strong>${lang.title}</strong>
            </div>
            <p>${lang.body}</p>
            <div class="cc-actions">
                <a href="policies.html?p=cookies">${lang.policies}</a>
                <button type="button" data-cc="reject">${lang.reject}</button>
                <button type="button" data-cc="accept" class="cc-primary">${lang.accept}</button>
            </div>
        </div>`;
    document.body.appendChild(dom);

    dom.querySelector('[data-cc="accept"]').onclick = () => { setConsent(true, true); window.location.reload(); };
    dom.querySelector('[data-cc="reject"]').onclick = () => { setConsent(false, false); window.location.reload(); };
    dom.querySelector('a').onclick = () => {};
}

const style = document.createElement('style');
style.textContent = `
    #cookie-consent-banner {
        position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 900;
        display: flex; justify-content: center; pointer-events: none;
    }
    #cookie-consent-banner .cc-card {
        pointer-events: auto; max-width: 560px; width: 100%;
        background: rgba(13, 12, 30, 0.96); backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 18px; padding: 18px 20px;
        color: #fff; box-shadow: 0 18px 50px -12px rgba(0,0,0,0.6);
        font-family: 'Cairo', 'Outfit', sans-serif;
    }
    #cookie-consent-banner .cc-card p {
        font-size: 13px; line-height: 1.65; opacity: 0.85; margin: 10px 0 14px;
    }
    #cookie-consent-banner .cc-head {
        display: flex; align-items: center; gap: 10px; font-size: 15px; color: #fff;
    }
    #cookie-consent-banner .cc-head svg { color: var(--accent-amber, #FFBE0B); }
    #cookie-consent-banner .cc-actions {
        display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    }
    #cookie-consent-banner .cc-actions a {
        color: var(--accent-cyan, #05D9E8); font-size: 12px; font-weight: 700;
        text-decoration: none; margin-right: auto;
    }
    #cookie-consent-banner .cc-actions a:hover { text-decoration: underline; }
    #cookie-consent-banner .cc-actions button {
        border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.05);
        color: #fff; padding: 8px 16px; border-radius: 12px; cursor: pointer;
        font-family: inherit; font-size: 13px; font-weight: 700;
    }
    #cookie-consent-banner .cc-actions button.cc-primary {
        background: var(--accent-pink, #FF2A6D); border-color: var(--accent-pink, #FF2A6D);
    }
    @media (max-width: 560px) {
        #cookie-consent-banner .cc-actions a { width: 100%; margin-bottom: 4px; }
    }
`;
document.head.appendChild(style);

if (!getConsent()) {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
    if (document.readyState === 'interactive' || document.readyState === 'complete') inject();
}