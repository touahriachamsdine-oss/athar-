// Shared Helpers for Athar
export function sanitizeHTML(str) {
    const p = new DOMParser().parseFromString(str, 'text/html');
    return p.body.textContent || '';
}

export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function validateForm(fields) {
    const errors = {};
    let valid = true;

    if (fields.full_name && (fields.full_name.length < 2 || fields.full_name.length > 60)) {
        errors.full_name = '2-60 chars required';
        valid = false;
    }
    if (fields.phone && !/^(05|06|07)[0-9]{8}$/.test(fields.phone)) {
        errors.phone = 'Invalid Algerian format (05/06/07 + 8 digits)';
        valid = false;
    }
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
        errors.email = 'Invalid email address';
        valid = false;
    }
    if (fields.password && (fields.password.length < 8 || !/\d/.test(fields.password))) {
        errors.password = 'Min 8 chars, 1 number';
        valid = false;
    }

    return { valid, errors };
}

export function formatDate(date, lang = 'ar') {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : (lang === 'fr' ? 'fr-FR' : 'en-US'), {
        dateStyle: 'medium'
    }).format(new Date(date));
}

export function timeAgo(date, lang = 'ar') {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);

    const translations = {
        ar: { s: 'منذ ثوان', m: 'منذ دقيقة', h: 'منذ ساعة', d: 'منذ يوم' },
        fr: { s: 'il y a quelques secondes', m: 'il y a 1 min', h: 'il y a 1h', d: 'il y a 1 jour' },
        en: { s: 'seconds ago', m: '1 min ago', h: '1 hour ago', d: '1 day ago' }
    };

    if (diff < 60) return translations[lang].s;
    if (diff < 3600) return translations[lang].m;
    if (diff < 86400) return translations[lang].h;
    return translations[lang].d;
}
