import { injectLayout } from '../js/layout.js';
import { setLanguage, getCurrentLang } from '../js/i18n.js';
import { initTheme, toggleTheme } from '../js/theme.js';
import { initScrollReveals } from '../js/animations.js';
import { initPWA } from '../js/pwa.js';

window.onload = () => {
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
    initScrollReveals();
    initPWA();
};