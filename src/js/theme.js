// Theme Persistence Logic (Neon Native)
import { neon } from './neon.js';
import { getSession } from './auth.js';

export function initTheme() {
    const currentTheme = localStorage.getItem('athar_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
}

export async function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('athar_theme', newTheme);

    const session = await getSession();
    if (session) {
        await neon.from('profiles').update({ theme: newTheme }, session.user.id);
    }
    return newTheme;
}
