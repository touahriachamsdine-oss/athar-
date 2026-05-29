// Shared Layout Injection Logic (Fully Localized + High Fidelity)
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

    // 1. Inject Sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <div style="padding: 40px 20px; display: flex; flex-direction: column; height: 100%; gap: 10px;">
                <div class="logo-container" style="display:flex; align-items:center; justify-content:center; gap:12px; margin-bottom:40px;">
                    <img src="../public/logo.svg" alt="Logo" style="width:45px; height:45px; filter: drop-shadow(0 0 10px var(--neon-green));">
                    <div class="logo syne gradient-text" style="font-size: 22px; font-weight:800; letter-spacing:-1px;">ATHAR — أثر</div>
                </div>
                
                <nav style="display: flex; flex-direction: column; gap: 8px;">
                    <a href="dashboard.html" class="nav-item ${isActive('dashboard')}"><span>🏠</span> ${t.nav_dashboard}</a>
                    <a href="clubs.html" class="nav-item ${isActive('clubs')}"><span>🤖</span> ${t.nav_clubs}</a>
                    <a href="awareness.html" class="nav-item ${isActive('awareness')}"><span>🛡️</span> ${t.nav_awareness}</a>
                    <a href="schools.html" class="nav-item ${isActive('schools')}"><span>🏫</span> ${t.nav_schools}</a>
                    <a href="training.html" class="nav-item ${isActive('training')}"><span>🎓</span> ${t.nav_training}</a>
                    <a href="support.html" class="nav-item ${isActive('support')}"><span>🩺</span> ${t.nav_support}</a>
                    <hr style="border:none; border-top:1px solid var(--glass-border); margin:5px 0;">
                    ${isAdmin ? `<a href="admin.html" class="nav-item ${isActive('admin')}"><span>🔑</span> ${t.nav_admin}</a>` : ''}
                    <a href="profile.html" class="nav-item ${isActive('profile')}"><span>👤</span> ${t.nav_profile}</a>
                </nav>

                <div style="margin-top: auto; display: flex; flex-direction: column; gap: 15px;">
                    <div class="glass" style="padding: 15px; border-radius: 20px; display: flex; justify-content: space-around; align-items: center;">
                        <button id="theme-toggle" class="icon-btn" title="Toggle Theme">🌓</button>
                        <div style="width: 1px; height: 20px; background: var(--glass-border);"></div>
                        <select id="lang-select" style="background:none; border:none; color:inherit; font-size:12px; cursor:pointer; outline:none; font-weight:bold;">
                            <option value="ar" ${lang === 'ar' ? 'selected' : ''}>العربية</option>
                            <option value="fr" ${lang === 'fr' ? 'selected' : ''}>FR</option>
                            <option value="en" ${lang === 'en' ? 'selected' : ''}>EN</option>
                        </select>
                    </div>

                    <button id="logout-btn" class="nav-item" style="color: var(--neon-red); border: 1px solid rgba(255,0,0,0.1);">
                        <span>🚪</span> ${t.nav_logout}
                    </button>
                </div>
            </div>
        `;

        document.getElementById('logout-btn').onclick = signOut;
        document.getElementById('theme-toggle').onclick = toggleTheme;
        document.getElementById('lang-select').onchange = (e) => {
            setLanguage(e.target.value);
            window.location.reload();
        };
    }

    // 2. Inject Background
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
