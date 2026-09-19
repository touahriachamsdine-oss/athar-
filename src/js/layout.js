// Shared Layout Injection Logic (Fully Localized + High Fidelity + Mobile Nav)
import { signOut } from './auth.js';
import { getCurrentLang, setLanguage, TRANSLATIONS } from './i18n.js';
import { toggleTheme, initTheme } from './theme.js';
import { ParticleField } from './particles.js';
import { ic } from './icons.js';
import { toggleChatWidget } from './chatwidget.js';

export function injectLayout() {
    initTheme();
    const lang = getCurrentLang();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    const userRole = localStorage.getItem('athar_user_role');
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';
    const isGuest = !localStorage.getItem('neon_session');

    const moreSubmenu = `
        <button class="more-btn nav-item" style="border:none; background:none; cursor:pointer; text-align:start; width:100%; align-items:center; gap:8px; font-size:inherit; color:var(--text-primary);">
            <span>${ic('zap', 16)}</span> ${t.nav_more}
            <span style="margin-left:auto;">${ic('chevronDown', 14)}</span>
        </button>
        <div class="more-sub" style="display:none; flex-direction:column; gap:2px; margin:2px 0 2px 14px; padding:4px 4px 4px 10px; border-left:1px solid rgba(255,255,255,0.08);">
            <a href="notifications.html" class="nav-item ${isActive('notifications')}"><span>${ic('bell', 15)}</span> ${t.nav_notifications}</a>
            <a href="invites.html" class="nav-item ${isActive('invites')}"><span>${ic('send', 15)}</span> ${t.nav_invites}</a>
            <a href="tasks.html" class="nav-item ${isActive('tasks')}"><span>${ic('check', 15)}</span> ${t.nav_tasks}</a>
            <a href="create.html" class="nav-item ${isActive('create')}"><span>${ic('plus', 15)}</span> ${t.nav_create}</a>
        </div>
    `;

    const navLinks = `
        <a href="dashboard.html" class="nav-item ${isActive('dashboard')}"><span>${ic('home')}</span> ${t.nav_dashboard}</a>
        <button type="button" class="nav-item ai-nav-btn" style="border:none; background:none; cursor:pointer; color:var(--text-primary); font-family:inherit; font-size:inherit; text-align:start; width:100%;"><span>${ic('chat')}</span> ${t.nav_chat}</button>
        <a href="clubs.html" class="nav-item ${isActive('clubs')}"><span>${ic('robot')}</span> ${t.nav_clubs}</a>
        <a href="schools.html" class="nav-item ${isActive('schools')}"><span>${ic('school')}</span> ${t.nav_schools}</a>
        <a href="explore.html" class="nav-item ${isActive('explore')}"><span>${ic('explore')}</span> ${t.nav_explore || 'استكشف'}</a>
        <a href="awareness.html" class="nav-item ${isActive('awareness')}"><span>${ic('shield')}</span> ${t.nav_awareness}</a>
        <a href="training.html" class="nav-item ${isActive('training')}"><span>${ic('grad')}</span> ${t.nav_training}</a>
        <a href="support.html" class="nav-item ${isActive('support')}"><span>${ic('heart')}</span> ${t.nav_support}</a>
        <a href="volunteers.html" class="nav-item ${isActive('volunteers')}"><span>${ic('hands')}</span> ${t.nav_volunteers}</a>
        ${isGuest ? '' : moreSubmenu}
        <hr style="border:none; border-top:1px solid rgba(255,255,255,0.06); margin:5px 0;">
        ${isAdmin ? `<a href="admin.html" class="nav-item ${isActive('admin')}"><span>${ic('key')}</span> ${t.nav_admin}</a>` : ''}
        ${isGuest ? '' : `<a href="profile.html" class="nav-item ${isActive('profile')}"><span>${ic('user')}</span> ${t.nav_profile}</a>`}
    `;

    const footerLinks = `
        <div style="margin-top:6px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05); display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
            <a href="policies.html?p=privacy" class="nav-item" style="font-size:11px; padding:4px 8px; opacity:0.75;">${t.f_policy || 'Privacy'}</a>
            <span style="opacity:0.3;">·</span>
            <a href="policies.html?p=terms" class="nav-item" style="font-size:11px; padding:4px 8px; opacity:0.75;">${t.f_terms || 'Terms'}</a>
            <span style="opacity:0.3;">·</span>
            <a href="policies.html?p=cookies" class="nav-item" style="font-size:11px; padding:4px 8px; opacity:0.75;">${t.f_cookies || 'Cookies'}</a>
        </div>`;

    const bottomControls = `
        <div class="glass" style="padding:15px; border-radius:20px; display:flex; justify-content:space-around; align-items:center;">
            <button id="theme-toggle" class="icon-btn" title="Toggle Theme">${ic('sun', 18)}</button>
            <div style="width:1px; height:20px; background:rgba(255,255,255,0.08);"></div>
            <select id="lang-select" style="background:none; border:none; color:inherit; font-size:12px; cursor:pointer; outline:none; font-weight:bold;">
                <option value="ar" ${lang === 'ar' ? 'selected' : ''}>عربية</option>
                <option value="fr" ${lang === 'fr' ? 'selected' : ''}>FR</option>
                <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
            </select>
        </div>
        ${isGuest
            ? `<a class="nav-item" href="../pages/auth.html" style="color:var(--accent-cyan); border:1px solid rgba(5,217,232,0.2);">
                    <span>${ic('userCheck', 18)}</span> ${t.nav_login}
                </a>`
            : `<button id="logout-btn" class="nav-item" style="color:var(--accent-pink); border:1px solid rgba(255,42,109,0.15);">
                    <span>${ic('logout', 18)}</span> ${t.nav_logout}
                </button>`}
        ${footerLinks}
    `;

    // 1. Inject Desktop Sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <div style="padding:40px 20px; display:flex; flex-direction:column; height:100%; gap:10px;">
                <div class="logo-container" style="display:flex; align-items:center; justify-content:center; margin-bottom:40px; height:64px; width:64px; margin-inline:auto; overflow:visible;">
                    <img src="../public/logo.png" alt="Athar Logo" style="width:448px; height:448px; max-width:none; margin: -192px 0; filter:drop-shadow(0 0 16px var(--neon-green)); object-fit:contain;">
                </div>
                <nav style="display:flex; flex-direction:column; gap:8px;">${navLinks}</nav>
                <div style="margin-top:auto; display:flex; flex-direction:column; gap:15px;">${bottomControls}</div>
            </div>
        `;

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.onclick = signOut;
        document.getElementById('theme-toggle').onclick = toggleTheme;
        document.getElementById('lang-select').onchange = (e) => { setLanguage(e.target.value); window.location.reload(); };
    }

    // 2. Inject Mobile Top Bar (visible only on small screens)
    if (!document.getElementById('mobile-topbar')) {
        const topbar = document.createElement('div');
        topbar.id = 'mobile-topbar';
        topbar.style.cssText = `
            display:none; position:fixed; top:0; left:0; right:0; z-index:500;
            background:rgba(7,6,20,0.85); backdrop-filter:blur(20px);
            -webkit-backdrop-filter:blur(20px);
            padding:14px 20px; align-items:center; justify-content:space-between;
            border-bottom:1px solid rgba(255,255,255,0.05);
        `;
        topbar.innerHTML = `
            <div style="display:flex; align-items:center; height:40px; width:40px; overflow:visible;">
                <img src="../public/logo.png" alt="Athar Logo" style="width:280px; height:280px; max-width:none; margin:-120px 0; filter:drop-shadow(0 0 8px var(--neon-green)); object-fit:contain;">
            </div>
            <button id="mobile-menu-btn" aria-label="Menu" style="background:rgba(255,255,255,0.05); border:none; outline:none; width:40px; height:40px; border-radius:12px; cursor:pointer; color:var(--text-primary); display:flex; align-items:center; justify-content:center;">${ic('menu', 20)}</button>
        `;
        document.body.appendChild(topbar);

        // Mobile Drawer
        const drawer = document.createElement('div');
        drawer.id = 'mobile-drawer';
        drawer.style.cssText = `
            position:fixed; inset:0; z-index:600; display:none;
        `;
        drawer.innerHTML = `
            <div id="drawer-backdrop" style="position:absolute; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px);"></div>
            <div id="drawer-panel" style="
                position:absolute; top:0; right:0; bottom:0; width:min(320px, 85vw);
                background:var(--bg-primary); border-left:1px solid rgba(255,255,255,0.05);
                padding:30px 20px; display:flex; flex-direction:column; gap:10px;
                overflow-y:auto; transform:translateX(100%); transition:transform 0.3s cubic-bezier(0.4,0,0.2,1);
            ">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; height:44px; overflow:visible;">
                    <div style="display:flex; align-items:center; height:44px; width:44px; overflow:visible;">
                        <img src="../public/logo.png" alt="Athar Logo" style="width:308px; height:308px; max-width:none; margin:-132px 0; filter:drop-shadow(0 0 8px var(--neon-green)); object-fit:contain;">
                    </div>
                    <button id="drawer-close" aria-label="Close" style="background:rgba(255,255,255,0.05); border:none; outline:none; width:38px; height:38px; border-radius:10px; cursor:pointer; color:var(--text-primary); display:flex; align-items:center; justify-content:center;">${ic('x', 18)}</button>
                </div>
                <nav style="display:flex; flex-direction:column; gap:6px; flex:1;">${navLinks}</nav>
                <div style="display:flex; flex-direction:column; gap:12px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.05);">${bottomControls}</div>
            </div>
        `;
        document.body.appendChild(drawer);

        // Responsive display
        const mq = window.matchMedia('(max-width:992px)');
        const applyMobile = (matches) => {
            topbar.style.display = matches ? 'flex' : 'none';
            // Add padding to main when topbar shows
            const main = document.querySelector('main');
            if (main) main.style.paddingTop = matches ? '80px' : '';
        };
        applyMobile(mq.matches);
        mq.addEventListener('change', e => applyMobile(e.matches));

        // Open drawer
        document.getElementById('mobile-menu-btn').onclick = () => {
            drawer.style.display = 'block';
            requestAnimationFrame(() => {
                document.getElementById('drawer-panel').style.transform = 'translateX(0)';
            });
        };

        const closeDrawer = () => {
            document.getElementById('drawer-panel').style.transform = 'translateX(100%)';
            setTimeout(() => { drawer.style.display = 'none'; }, 300);
        };
        document.getElementById('drawer-close').onclick = closeDrawer;
        document.getElementById('drawer-backdrop').onclick = closeDrawer;

        // Wire up controls inside drawer
        setTimeout(() => {
            const logoutBtns = document.querySelectorAll('#logout-btn');
            logoutBtns.forEach(b => b.onclick = signOut);
            const themeBtns = document.querySelectorAll('#theme-toggle');
            themeBtns.forEach(b => b.onclick = toggleTheme);
            const langSelects = document.querySelectorAll('#lang-select');
            langSelects.forEach(s => s.onchange = (e) => { setLanguage(e.target.value); window.location.reload(); });
        }, 50);
    }

    // 3. Inject Animated Background
    if (!document.getElementById('living-canvas')) {
        const bg = document.createElement('div');
        bg.id = 'living-canvas';
        bg.style.cssText = 'position:fixed; inset:0; z-index:-1; pointer-events:none;';
        document.body.prepend(bg);
        new ParticleField('living-canvas');
    }

    // 4. Wire "More" dropdown toggles (sidebar + mobile drawer)
    const closeSubs = () => document.querySelectorAll('.more-sub').forEach(s => { s.style.display = 'none'; });
    document.querySelectorAll('.more-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const sub = btn.nextElementSibling;
            if (!sub) return;
            const visible = sub.style.display === 'flex';
            closeSubs();
            sub.style.display = visible ? 'none' : 'flex';
        };
    });
document.addEventListener('click', closeSubs);

    // Ai chat nav buttons (sidebar + mobile drawer) open the corner widget
    document.querySelectorAll('.ai-nav-btn').forEach(btn => {
        btn.onclick = () => toggleChatWidget();
    });

    // 5. Floating AI assistant button (hidden on chat/auth pages) — opens the corner widget
    const onChatLike = window.location.pathname.toLowerCase().includes('chat') || window.location.pathname.toLowerCase().includes('auth');
    if (!onChatLike && !document.getElementById('floating-ai-btn')) {
        const fab = document.createElement('button');
        fab.id = 'floating-ai-btn';
        fab.setAttribute('aria-label', t.nav_chat || 'AI Assistant');
        fab.style.cssText = 'position:fixed; bottom:22px; right:22px; z-index:400; width:58px; height:58px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg, rgba(255,42,109,0.9), rgba(5,217,232,0.85)); color:#fff; box-shadow:0 8px 24px rgba(19,206,220,0.35); border:none; cursor:pointer; text-decoration:none; transition:transform 0.2s ease;';
        fab.innerHTML = ic('chat', 26);
        fab.onmouseenter = () => { fab.style.transform = 'scale(1.08)'; };
        fab.onmouseleave = () => { fab.style.transform = 'scale(1)'; };
        fab.onclick = () => toggleChatWidget();
        document.body.appendChild(fab);
    }
}

function isActive(page) {
    return window.location.pathname.includes(page) ? 'active' : '';
}
