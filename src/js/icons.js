// Athar icon set — inline SVG, CSP-safe, currentColor-fillable.
const PATHS = {
    home: '<path d="M3 11.2 12 3l9 8.2v8.3a1.5 1.5 0 0 1-1.5 1.5h-5v-5.5h-5v5.5h-5A1.5 1.5 0 0 1 3 19.5Z"/>',
    robot: '<rect x="4" y="4" width="16" height="14" rx="3"/><circle cx="9" cy="10" r="1.4"/><circle cx="15" cy="10" r="1.4"/><path d="M9 14.2c1 .9 5 .9 6 0"/><path d="M12 2v2"/><path d="M8 18l-1.5 3M16 18l1.5 3"/>',
    explore: '<circle cx="11" cy="11" r="7.5"/><path d="m15.5 15.5 4.5 4.5"/><path d="M13.4 8.6 11 14l-2.4 1 2.4-5.4Z"/>',
    shield: '<path d="M12 3 5 5.6v5.3c0 4.4 3 7.8 7 9.1 4-1.3 7-4.7 7-9.1V5.6Z"/><path d="M9.2 11.4l2 2 3.7-3.9"/>',
    grad: '<path d="M12 4 2 8l10 4 10-4Z"/><path d="M6 10.2V15c0 1.4 2.7 2.6 6 2.6s6-1.2 6-2.6v-4.8"/><path d="M22 8v5"/>',
    heart: '<path d="M12 20.5S3 15 3 9.4A4.8 4.8 0 0 1 12 7a4.8 4.8 0 0 1 9 2.4C21 15 12 20.5 12 20.5Z"/>',
    hands: '<path d="M7 11.5 4.5 9a2 2 0 0 1 3-2.6M7 11.5 5 8.2M7 11.5C9 14 11 15 13 15s4-1.5 4-3.5L15.5 8M17 11.5l2.5-2.5a2 2 0 0 0-3-2.6M17 11.5 19 8.2"/><path d="M13 15v-4"/><path d="M9 5.5V4.5a1.5 1.5 0 0 1 3 0v1M13 11.5V4a1.5 1.5 0 0 1 3 0v1.2"/>',
    key: '<circle cx="8" cy="15" r="4.5"/><path d="m11.3 11.7 8.2-8.2M16 6l3 3"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-3.4 4.4-5 8-5s6.5 1.6 8 5"/>',
    door: '<path d="M4 21V4l8-2v18M12 2l8 2v17H4"/><path d="M9 12h.01"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    pin: '<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
    chair: '<path d="M6 3h12v13H6ZM8 16v5M16 16v5"/>',
    camera: '<path d="M4 7h3l2-2h6l2 2h3v13H4Z"/><circle cx="12" cy="13" r="3.5"/>',
    send: '<path d="M3 11 21 3l-6 18-4-7Z"/><path d="M11 14 21 3"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 19a2 2 0 0 0 4 0"/>',
    zap: '<path d="M13 2 4 14h6l-1 8 9-12h-6Z"/>',
    trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0Z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8 21h8M10 21v-2h4v2"/>',
    doc: '<path d="M6 3h9l4 4v14H6Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>',
    thumbsup: '<path d="M7 10v10H4V10ZM7 11h4l1.5-5a2.1 2.1 0 0 1 2.2 2.4L14 12h4.5a1.6 1.6 0 0 1 1.6 1.9l-1.1 6a2 2 0 0 1-2 1.6H7"/>',
    check: '<path d="m4 12 5.5 5.5L20 6.5"/>',
    logout: '<path d="M14 4H5v16h9"/><path d="m9 12 12 0M17.5 8.5 21 12l-3.5 3.5"/>',
    cookie: '<circle cx="12" cy="12" r="9"/><path d="M8.5 9h.01M15 8h.01M12 12.5h.01M9 15.5h.01M14.5 14h.01"/><circle cx="12" cy="12" r="9" fill="none"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
    userCheck: '<circle cx="9" cy="8" r="3.5"/><path d="M3.5 19c.8-2.6 2.9-4 5.5-4M15 15l2.4 2.4L21.5 13"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 10h17M8 2.8V6M16 2.8V6"/>',
    users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3.5 19.5c.8-3 3-4.7 5.5-4.7s4.7 1.7 5.5 4.7M16 5.2a3.2 3.2 0 0 1 0 6.3M16.8 15c2 0.6 3.2 2 3.7 4.5"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-2.9-5.4 2.9 1.1-6L3.2 9.4l6.1-.8Z"/>',
    hourglass: '<path d="M6 3h12v4l-4 5 4 5v4H6v-4l4-5-4-5Z"/><path d="M6 6h12"/>',
    crown: '<path d="m3 8 4.5 4L12 5.5 16.5 12 21 8v10H3Z"/>',
    chevronDown: '<path d="m6 9 6 6 6-6"/>',
    sparkle: '<path d="M12 3c.6 4.5 2.5 6.4 7 7-4.5.6-6.4 2.5-7 7-.6-4.5-2.5-6.4-7-7 4.5-.6 6.4-2.5 7-7Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.8.6 1.5 1.4 1.5 2.4v.7h4V16.3c0-1 .7-1.8 1.5-2.4A6 6 0 0 0 12 3Z"/>',
    question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.6 2.6 0 1 1 3.6 2.4c-.8.4-1.1 1-1.1 1.9M12 17h.01"/>',
    alert: '<path d="M12 3 2.5 20h19Z"/><path d="M12 9v5M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    checkRound: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    print: '<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7" rx="1"/>',
    save: '<path d="M5 3h12l3 3v15H4V3h1Z"/><path d="M8 3v6h7V3M8 21v-8h9v8"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    signal: '<path d="M20 12a8 8 0 0 0-16 0M16 12a4 4 0 0 0-8 0"/><circle cx="12" cy="15.5" r="2.3"/>',
    code: '<path d="m8 6-6 6 6 6M16 6l6 6-6 6"/>',
    theater: '<circle cx="12" cy="6" r="3"/><path d="M5 21l3-11M19 21l-3-11M8 10l4 2 4-2M6 12.5 5 21M18 12.5 19 21M7 21h10"/>',
    music: '<path d="M9 18V5l9-2v12.5"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="15.5" cy="15.5" r="2.5"/>',
    book: '<path d="M12 6c-1-1.5-3-2-5-2H3v15h5c2 0 4 .5 4 2 0-1.5 2-2 4-2h5V4h-4c-2 0-4 .5-5 2Z"/>',
    sprout: '<path d="M12 21v-8M12 13c-1-4-4-6-9-6 0 5 3 7 9 7ZM12 11c1-3 4-4.5 8-4.5 0 4-2.5 6-8 6"/>',
    school: '<path d="M3 10 12 4l9 6M5 10v9h14v-9M10 19v-6h4v6"/>',
    health: '<path d="m3 12 3-2 4.5 4.5L17 7l4 3.5"/>',
    drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
    wave: '<path d="M3 9c2.7-2.4 5.9-2.4 8.5-.6 2.6 1.8 5.4 1.8 8 .3M3 14c2.7-2.4 5.9-2.4 8.5-.6 2.6 1.8 5.4 1.8 8 .3"/>',
    palette: '<path d="M12 21a9 9 0 1 1 9-9c0 2-1.5 3-3 3h-2.3c-1 0-1.7.8-1.7 1.7 0 .5.2.9.5 1.3.4.5.5 1 .5 1.5A2.5 2.5 0 0 1 12 21Z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="9" r="1"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4Z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
    cross: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14c.9 1.4 2 2 3.5 2s2.6-.6 3.5-2M9 9.5h.01M15 9.5h.01"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 13.8-5.6M20 12a8 8 0 0 1-13.8 5.6"/><path d="M17 2.5V8h-5.5M7 21.5V16h5.5"/>',
    heartFill: '<path fill="currentColor" stroke="none" d="M12 20.5S4.5 15 4.5 9.4A4.4 4.4 0 0 1 12 6a4.4 4.4 0 0 1 7.5 3.4c0 5.6-7.5 11.1-7.5 11.1Z"/>',
    play: '<path d="M7 4.5v15l12-7.5Z"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m10 9 5 3-5 3Z"/>',
    award: '<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13-1.5 8 5-2.5 5 2.5-1.5-8"/>',
    chat: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4.5A2.5 2.5 0 0 1 4 13.5Z"/><path d="M8 8.5h8M8 12h5"/>',
};

export function ic(name, size = 20, opts = {}) {
    const d = PATHS[name] || PATHS['check'];
    const fill = opts.fill || 'none';
    const stroke = opts.stroke !== undefined ? opts.stroke : 'currentColor';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}" stroke="${stroke}" stroke-width="${opts.strokeWidth || 1.8}" stroke-linecap="round" stroke-linejoin="round" class="athar-ic">${d}</svg>`;
}

export const ICONS = Object.keys(PATHS);

function hydrate() {
    document.querySelectorAll('[data-icon]').forEach(el => {
        const name = el.getAttribute('data-icon');
        const size = parseInt(el.getAttribute('data-size') || '20', 10) || 20;
        if (!PATHS[name]) { el.style.display = 'none'; return; }
        el.innerHTML = ic(name, size);
        if (!el.hasAttribute('style')) el.style.display = 'inline-block';
    });
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', hydrate, { once: true });
    if (document.readyState === 'interactive' || document.readyState === 'complete') hydrate();
}