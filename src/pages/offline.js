// Offline fallback page — trilingual, CSP-safe, no network calls, no heavy imports.

const DICT = {
    ar: { title: 'أنت غير متصل', sub: 'تعرض هذه الصفحة البيانات المحفوظة محلياً فقط.', retry: 'إعادة المحاولة' },
    fr: { title: 'Vous êtes hors ligne', sub: 'Cette page n\'affiche que les données enregistrées localement.', retry: 'Réessayer' },
    en: { title: 'You are offline', sub: 'This page shows only locally saved data.', retry: 'Retry' }
};

const stored = localStorage.getItem('athar_lang') || 'ar';
const lang = ['ar', 'fr', 'en'].includes(stored) ? stored : 'ar';
const d = DICT[lang];

document.getElementById('off-title').textContent = d.title;
document.getElementById('off-sub').textContent = d.sub;
document.getElementById('retry-btn').textContent = d.retry;
document.getElementById('retry-btn').onclick = () => location.reload();