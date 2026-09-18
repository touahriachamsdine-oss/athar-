import { requireAuth } from '../js/auth.js';
import { createInitiative } from '../js/db.js';
import { APP_CONFIG } from '../js/config.js';
import { injectLayout } from '../js/layout.js';

async function init() {
    await requireAuth();
    injectLayout();

    const select = document.getElementById('wilaya');
    APP_CONFIG.wilayas.forEach(w => {
        const opt = document.createElement('option');
        opt.value = w;
        opt.textContent = w;
        select.appendChild(opt);
    });

    const catSelect = document.getElementById('category');
    APP_CONFIG.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.ar;
        catSelect.appendChild(opt);
    });
}

document.getElementById('create-form').onsubmit = async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    btn.innerText = 'جاري النشر...';

    const { user } = await requireAuth();
    const res = await createInitiative({
        title_ar: document.getElementById('title').value,
        description_ar: document.getElementById('description').value,
        wilaya: document.getElementById('wilaya').value,
        category: document.getElementById('category').value,
        neighborhood: 'حي افتراضي' // Manual for now
    }, user.id);

    if (res.data) {
        alert('تم إرسال المبادرة للمراجعة');
        location.href = 'dashboard.html';
    } else {
        alert(res.error);
    }
    btn.disabled = false;
};

init();