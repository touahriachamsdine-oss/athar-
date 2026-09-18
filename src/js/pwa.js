// PWA Support & Service Worker Registration
import { showToast } from './notifications.js';

export function initPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/src/sw/service-worker.js')
            .then(reg => console.log('SW Registered', reg))
            .catch(err => console.error('SW Failed', err));
    }

    // Install prompt logic
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // Show banner if not dismissed recently
        const lastPrompt = localStorage.getItem('last_pwa_prompt');
        if (!lastPrompt || Date.now() - parseInt(lastPrompt) > 604800000) {
            showInstallBanner(() => {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then(() => {
                    deferredPrompt = null;
                });
            });
        }
    });

    window.addEventListener('online', () => showToast({ type: 'info', title_ar: 'عدت للاتصال', title_fr: 'De retour en ligne', title_en: 'Back online', body_ar: '', body_fr: '', body_en: '' }));
    window.addEventListener('offline', () => showToast({ type: 'risk', title_ar: 'أنت غير متصل', title_fr: 'Hors ligne', title_en: 'Offline', body_ar: '', body_fr: '', body_en: '' }));
}

function showInstallBanner(onInstall) {
    const banner = document.createElement('div');
    banner.className = 'glass pwa-banner reveal active';
    banner.innerHTML = `
        <div style="display:flex; align-items:center; gap:20px; padding:15px;">
            <div style="font-size:24px;">📱</div>
            <div style="flex:1;">ثبّت التطبيق على هاتفك</div>
            <button class="btn btn-primary" id="pwa-install-btn">تثبيت</button>
            <button style="background:none; border:none; color:white; cursor:pointer;" id="pwa-close">×</button>
        </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn').onclick = () => {
        onInstall();
        banner.remove();
    };

    document.getElementById('pwa-close').onclick = () => {
        localStorage.setItem('last_pwa_prompt', Date.now().toString());
        banner.remove();
    };
}
