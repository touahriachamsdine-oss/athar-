import { requireAuth } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { injectLayout } from '../js/layout.js';

const DICT = {
    ar: { pending: 'لا توجد دعوات قيد الانتظار', accept: 'قبول الدعوة', accepted: 'تم القبول', ok_msg: 'تم قبول الدعوة بنجاح', err_msg: 'حدث خطأ أثناء قبول الدعوة' },
    fr: { pending: 'Aucune invitation en attente', accept: 'Accepter', accepted: 'Accepté', ok_msg: 'Invitation acceptée !', err_msg: 'Erreur lors de l\'acceptation' },
    en: { pending: 'No pending invitations', accept: 'Accept Invite', accepted: 'Accepted', ok_msg: 'Invitation accepted!', err_msg: 'Error accepting invitation' }
};

async function init() {
    const auth = await requireAuth();
    if (!auth) return;
    injectLayout();

    const d = DICT[localStorage.getItem('athar_lang') || 'ar'] || DICT.ar;

    const [invitesRes, initRes] = await Promise.all([
        neon.from('invites').select().eq('invited_email', auth.user.email),
        neon.from('initiatives').select()
    ]);
    const invites = (invitesRes.data || []).filter(inv => !inv.is_accepted);
    const initiativesMap = new Map((initRes.data || []).map(i => [i.id, i]));

    const list = document.getElementById('invite-list');
    if (!invites.length) {
        list.innerHTML = `<div class="glass" style="padding:40px; border-radius:30px; text-align:center; opacity:0.78;">${d.pending}</div>`;
        return;
    }

    list.innerHTML = invites.map(inv => {
        const initiative = initiativesMap.get(inv.initiative_id);
        const title = initiative ? (initiative.title_ar || initiative.title_fr || '') : 'مبادرة';
        return `
        <div class="glass" style="padding:30px; border-radius:30px;">
            <div class="badge mb-20" style="background:var(--neon-gold); color:black;">دعوة جديدة</div>
            <h3 class="syne">${title}</h3>
            <p style="opacity:0.78; margin-top:10px;">تمت دعوتك للانضمام كـ ${inv.role || 'عضو'}</p>
            <button class="btn btn-primary mt-40" data-id="${inv.id}" data-initiative="${inv.initiative_id}">${d.accept}</button>
        </div>`;
    }).join('');

    list.querySelectorAll('button[data-id]').forEach(btn => {
        btn.onclick = async () => {
            btn.disabled = true;
            btn.textContent = '…';
            const { error } = await neon.from('invites').update({ is_accepted: true }, btn.dataset.id);
            if (error) {
                alert(d.err_msg);
                btn.disabled = false;
                btn.textContent = d.accept;
                return;
            }
            await neon.from('initiative_members').insert({
                initiative_id: btn.dataset.initiative,
                user_id: auth.user.id,
                role: 'member'
            });
            alert(d.ok_msg);
            btn.textContent = d.accepted;
            btn.style.opacity = '0.5';
        };
    });
}
init();