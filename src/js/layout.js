// Shared Layout Injection Logic (Fully Localized + High Fidelity + Mobile Nav)
import { signOut } from './auth.js';
import { getCurrentLang, setLanguage, TRANSLATIONS } from './i18n.js';
import { toggleTheme, initTheme } from './theme.js';
import { ParticleField } from './particles.js';

export function injectLayout() {
    initTheme();
    const lang = getCurrentLang();
    const t = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    const userRole = localStorage.getItem('athar_user_role');
    const isAdmin = userRole === 'admin' || userRole === 'superadmin';

    const navLinks = `
        <a href="dashboard.html" class="nav-item ${isActive('dashboard')}"><span>🏠</span> ${t.nav_dashboard}</a>
        <a href="clubs.html" class="nav-item ${isActive('clubs')}"><span>🤖</span> ${t.nav_clubs}</a>
        <a href="explore.html" class="nav-item ${isActive('explore')}"><span>🔭</span> ${t.nav_explore || 'استكشف'}</a>
        <a href="awareness.html" class="nav-item ${isActive('awareness')}"><span>🛡️</span> ${t.nav_awareness}</a>
        <a href="training.html" class="nav-item ${isActive('training')}"><span>🎓</span> ${t.nav_training}</a>
        <a href="support.html" class="nav-item ${isActive('support')}"><span>🩺</span> ${t.nav_support}</a>
        <hr style="border:none; border-top:1px solid var(--glass-border); margin:5px 0;">
        ${isAdmin ? `<a href="admin.html" class="nav-item ${isActive('admin')}"><span>🔑</span> ${t.nav_admin}</a>` : ''}
        <a href="profile.html" class="nav-item ${isActive('profile')}"><span>👤</span> ${t.nav_profile}</a>
    `;

    const bottomControls = `
        <div class="glass" style="padding:15px; border-radius:20px; display:flex; justify-content:space-around; align-items:center;">
            <button id="theme-toggle" class="icon-btn" title="Toggle Theme">🌓</button>
            <div style="width:1px; height:20px; background:var(--glass-border);"></div>
            <select id="lang-select" style="background:none; border:none; color:inherit; font-size:12px; cursor:pointer; outline:none; font-weight:bold;">
                <option value="ar" ${lang === 'ar' ? 'selected' : ''}>🇩🇿 عربية</option>
                <option value="fr" ${lang === 'fr' ? 'selected' : ''}>🇫🇷 FR</option>
                <option value="en" ${lang === 'en' ? 'selected' : ''}>🇬🇧 EN</option>
            </select>
        </div>
        <button id="logout-btn" class="nav-item" style="color:var(--accent-pink); border:1px solid rgba(255,42,109,0.15);">
            <span>🚪</span> ${t.nav_logout}
        </button>
    `;

    // 1. Inject Desktop Sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <div style="padding:40px 20px; display:flex; flex-direction:column; height:100%; gap:10px;">
                <div class="logo-container" style="display:flex; align-items:center; justify-content:center; margin-bottom:40px;">
                    <img src="../public/logo.png" alt="Athar Logo" style="width:64px; height:64px; filter:drop-shadow(0 0 12px var(--neon-green)); object-fit:contain;">
                </div>
                <nav style="display:flex; flex-direction:column; gap:8px;">${navLinks}</nav>
                <div style="margin-top:auto; display:flex; flex-direction:column; gap:15px;">${bottomControls}</div>
            </div>
        `;

        document.getElementById('logout-btn').onclick = signOut;
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
            <div style="display:flex; align-items:center;">
                <img src="../public/logo.png" alt="Athar Logo" style="width:40px; height:40px; filter:drop-shadow(0 0 8px var(--neon-green)); object-fit:contain;">
            </div>
            <button id="mobile-menu-btn" style="background:rgba(255,255,255,0.05); border:none; outline:none; width:40px; height:40px; border-radius:12px; font-size:20px; cursor:pointer; color:var(--text-primary); display:flex; align-items:center; justify-content:center;">☰</button>
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
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                    <img src="../public/logo.png" alt="Athar Logo" style="width:44px; height:44px; filter:drop-shadow(0 0 8px var(--neon-green)); object-fit:contain;">
                    <button id="drawer-close" style="background:rgba(255,255,255,0.05); border:none; outline:none; width:38px; height:38px; border-radius:10px; font-size:18px; cursor:pointer; color:var(--text-primary);">✕</button>
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
}

function isActive(page) {
    return window.location.pathname.includes(page) ? 'active' : '';
}
