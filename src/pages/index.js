import { injectLayout } from '../js/layout.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { initTheme, toggleTheme } from '../js/theme.js';
import { initScrollReveals } from '../js/animations.js';
import { initPWA } from '../js/pwa.js';
import { neon } from '../js/neon.js';

window.onload = async () => {
    // Theme setup
    initTheme();
    const themeToggleBtn = document.getElementById('theme-toggle-nav');
    const sunIcon = themeToggleBtn.querySelector('.sun-icon');
    const moonIcon = themeToggleBtn.querySelector('.moon-icon');

    const updateThemeUI = (theme) => {
        if (theme === 'dark') {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        } else {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    };

    const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    updateThemeUI(initialTheme);

    themeToggleBtn.addEventListener('click', async () => {
        const newTheme = await toggleTheme();
        updateThemeUI(newTheme);
    });

    // Language setup
    const updateLangUI = (lang) => {
        document.querySelectorAll('.lang-btn').forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    };

    const currentLang = getCurrentLang();
    setLanguage(currentLang);
    updateLangUI(currentLang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            setLanguage(lang);
            updateLangUI(lang);
        });
    });

    injectLayout();
    const stats = await neon.rpc('get_platform_stats');
    const s = stats && stats.data;
    if (s) {
        const nums = document.querySelectorAll('.hero-stat-num');
        if (nums.length === 4 && document.querySelector('[data-i18n="stat_volunteer_hours"]')) {
            nums[0].textContent = s.clubs ?? '0';
            nums[1].textContent = s.members ?? '0';
            nums[2].textContent = s.school_visits ?? '0';
            nums[3].textContent = s.volunteer_hours ?? '0';
        }
    }
    initScrollReveals();
    initPWA();
};