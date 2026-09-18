import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { injectLayout } from '../js/layout.js';
import { getCurrentLang } from '../js/i18n.js';
import { showToast } from '../js/utils.js';

const DICT = {
    ar: { page: 'مهامي اليومية', subtitle: 'المهام والتحديات المسندة إليك', empty: 'لا توجد مهام مسندة إليك حالياً 🎉', completed: 'مكتمل', pending: 'قيد التنفيذ', mark_done: 'تحديد كمكتمل', done_msg: '✅ تم تحديد المهمة كمكتملة!' },
    fr: { page: 'Mes Tâches', subtitle: 'Tâches et défis qui vous sont assignés', empty: 'Aucune tâche assignée pour l\'instant 🎉', completed: 'Complété', pending: 'En cours', mark_done: 'Marquer terminé', done_msg: '✅ Tâche marquée comme terminée !' },
    en: { page: 'My Tasks', subtitle: 'Tasks and challenges assigned to you', empty: 'No tasks assigned to you right now 🎉', completed: 'Completed', pending: 'In Progress', mark_done: 'Mark Done', done_msg: '✅ Task marked as complete!' }
};

async function init() {
    const auth = await requireAuth();
    if (!auth) return;
    injectLayout();

    const lang = getCurrentLang();
    const t = DICT[lang] || DICT.ar;
    document.getElementById('page-title').textContent = t.page;
    document.getElementById('page-subtitle').textContent = t.subtitle;

    // Tasks belong to initiatives the user is a member of
    const [membersRes, tasksRes, initRes] = await Promise.all([
        neon.from('initiative_members').select().eq('user_id', auth.user.id),
        neon.from('tasks').select(),
        neon.from('initiatives').select()
    ]);
    const myIds = new Set((membersRes.data || []).map(m => m.initiative_id));
    const tasks = tasksRes.data || [];
    const initiativesMap = new Map((initRes.data || []).map(i => [i.id, i]));
    const myTasks = tasks.filter(task => myIds.has(task.initiative_id));
    const list = document.getElementById('task-list');

    if (!myTasks.length) {
        list.innerHTML = `<div class="empty-state"><div>✅</div><p>${t.empty}</p></div>`;
        document.getElementById('progress-label').textContent = '0 / 0';
        return;
    }

    const done = myTasks.filter(task => task.is_completed).length;
    document.getElementById('progress-label').textContent = `${done} / ${myTasks.length}`;
    document.getElementById('progress-bar').style.width = `${(done / myTasks.length) * 100}%`;

    const titleKey = lang === 'fr' ? 'title_fr' : (lang === 'en' ? 'title_en' : 'title_ar');

    list.innerHTML = myTasks.map(task => {
        const isDone = task.is_completed;
        const initiative = initiativesMap.get(task.initiative_id);
        const initTitle = initiative ? (initiative[titleKey] || initiative.title_ar || '') : '';
        return `
        <div class="task-card glass" id="task-${task.id}">
            <div style="display:flex; align-items:center; gap:16px; flex:1;">
                <div class="status-dot" style="background:${isDone ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)'};
                    box-shadow:${isDone ? '0 0 8px rgba(5,217,232,0.5)' : 'none'};"></div>
                <div>
                    ${initTitle ? `<div class="mono" style="font-size:10px; color:var(--accent-cyan); margin-bottom:4px;">${initTitle}</div>` : ''}
                    <div style="font-size:16px; font-weight:700; ${isDone ? 'opacity:0.4; text-decoration:line-through;' : ''}">${task.title_ar || task.title || '—'}</div>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:14px;">
                <div class="badge" style="background:${isDone ? 'rgba(5,217,232,0.1)' : 'rgba(255,255,255,0.05)'}; color:${isDone ? 'var(--accent-cyan)' : 'var(--text-dim)'};">
                    ${isDone ? t.completed : t.pending}
                </div>
                ${!isDone ? `<button class="btn btn-outline mark-done-btn" data-id="${task.id}" style="padding:8px 16px; font-size:12px; border-radius:10px;">${t.mark_done}</button>` : ''}
            </div>
        </div>`;
    }).join('');

    list.addEventListener('click', async e => {
        const btn = e.target.closest('.mark-done-btn');
        if (!btn) return;
        btn.disabled = true; btn.textContent = '⏳';
        await neon.from('tasks').update({ is_completed: true }, btn.dataset.id);
        showToast(t.done_msg, 'success');
        setTimeout(() => init(), 500);
    });
}
init();