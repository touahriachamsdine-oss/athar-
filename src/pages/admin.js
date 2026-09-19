import { requireAdmin } from '../js/auth.js';
import { neon } from '../js/neon.js';
import { injectLayout } from '../js/layout.js';
import { renderWilayaMap } from '../js/map.js';
import { getCurrentLang, setLanguage, TRANSLATIONS } from '../js/i18n.js';
import { showToast } from '../js/notifications.js';
import { esc } from '../js/utils.js';

let usersCache = [];
let initiativesCache = [];
let clubsCache = [];
let clubMembersCache = [];
let initiativeMembersCache = [];
let currentLang = 'ar';
let dictionary = {};

async function init() {
    const auth = await requireAdmin();
    if (!auth) return;
    injectLayout();

    currentLang = getCurrentLang();
    setLanguage(currentLang);
    dictionary = TRANSLATIONS[currentLang] || TRANSLATIONS.ar;

    // Apply direction and dynamic translation for non-data-i18n attributes
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';

    const searchInput = document.getElementById('user-search');
    if (searchInput) {
        searchInput.placeholder = dictionary.admin_search_placeholder || 'Search...';
        searchInput.addEventListener('input', filterUsers);
    }

    const clubSelect = document.getElementById('filter-club');
    if (clubSelect) {
        clubSelect.addEventListener('change', filterUsers);
    }

    const initSelect = document.getElementById('filter-initiative');
    if (initSelect) {
        initSelect.addEventListener('change', filterUsers);
    }

    setupTabs();
    await loadData();
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(content => {
                if (content.id === `tab-content-${targetTab}`) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
        });
    });
}

async function loadData() {
    // Fetch users & profiles
    const { data: profiles } = await neon.from('profiles').select();
    usersCache = profiles || [];

    // Fetch initiatives
    const { data: initiatives } = await neon.from('initiatives').select();
    initiativesCache = initiatives || [];

    // Fetch clubs
    const { data: clubs } = await neon.from('clubs').select();
    clubsCache = clubs || [];

    // Fetch club memberships
    const { data: clubMembers } = await neon.from('club_members').select();
    clubMembersCache = clubMembers || [];

    // Fetch initiative memberships
    const { data: initiativeMembers } = await neon.from('initiative_members').select();
    initiativeMembersCache = initiativeMembers || [];

    // Calculate Statistics
    const totalUsers = usersCache.length;
    const totalInitiatives = initiativesCache.length;
    const totalPoints = usersCache.reduce((sum, u) => sum + (u.impact_points || 0), 0);
    const pendingInitiatives = initiativesCache.filter(i => !i.is_approved);
    const totalPending = pendingInitiatives.length;

    // Update DOM counters
    document.getElementById('stat-total-users').innerText = totalUsers;
    document.getElementById('stat-total-initiatives').innerText = totalInitiatives;
    document.getElementById('stat-total-points').innerText = totalPoints;
    document.getElementById('stat-total-pending').innerText = totalPending;

    // Engagement & Analytics ratios
    const activeUsersRatio = totalUsers > 0 ? Math.round((usersCache.filter(u => u.impact_points > 0).length / totalUsers) * 100) : 0;
    const approvalRatio = totalInitiatives > 0 ? Math.round((initiativesCache.filter(i => i.is_approved).length / totalInitiatives) * 100) : 0;

    document.getElementById('val-user-ratio').innerText = `${activeUsersRatio}%`;
    document.getElementById('bar-user-ratio').style.width = `${activeUsersRatio}%`;

    document.getElementById('val-approval-ratio').innerText = `${approvalRatio}%`;
    document.getElementById('bar-approval-ratio').style.width = `${approvalRatio}%`;

    // Render Wilaya Map Density
    const stats = {};
    initiativesCache.forEach(i => {
        if (i.wilaya) {
            const wilayaNum = parseInt(i.wilaya);
            if (!isNaN(wilayaNum)) {
                stats[wilayaNum] = (stats[wilayaNum] || 0) + 1;
            }
        }
    });
    renderWilayaMap('wilaya-map', stats);

    // Populate Tables & Lists
    renderApprovalsQueue(pendingInitiatives);
    populateFilters();
    filterUsers();
    renderInitiativesTable(initiativesCache);
}

function populateFilters() {
    const clubSelect = document.getElementById('filter-club');
    const initSelect = document.getElementById('filter-initiative');
    
    const selectedClub = clubSelect ? clubSelect.value : '';
    const selectedInit = initSelect ? initSelect.value : '';

    if (clubSelect) {
        clubSelect.innerHTML = `<option value="" data-i18n="admin_filter_club">${dictionary.admin_filter_club || 'Filter by Club'}</option>`;
        clubsCache.forEach(c => {
            const name = c[`name_${currentLang}`] || c.name_ar;
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = name;
            if (c.id === selectedClub) opt.selected = true;
            clubSelect.appendChild(opt);
        });
    }

    if (initSelect) {
        initSelect.innerHTML = `<option value="" data-i18n="admin_filter_initiative">${dictionary.admin_filter_initiative || 'Filter by Initiative'}</option>`;
        initiativesCache.forEach(i => {
            const title = i[`title_${currentLang}`] || i.title_ar;
            const opt = document.createElement('option');
            opt.value = i.id;
            opt.textContent = title;
            if (i.id === selectedInit) opt.selected = true;
            initSelect.appendChild(opt);
        });
    }
}

function renderApprovalsQueue(pendingList) {
    const container = document.getElementById('pending-list');
    if (pendingList.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; opacity:0.78;" data-i18n="admin_no_pending">
                ${dictionary.admin_no_pending}
            </div>
        `;
        return;
    }

    container.innerHTML = pendingList.map(i => {
        const title = i[`title_${currentLang}`] || i.title_ar;
        const desc = i[`description_${currentLang}`] || i.description_ar || '';
        return `
            <div class="glass flex-center" style="padding:24px; justify-content:space-between; border-radius:20px; flex-wrap:wrap; gap:20px;">
                <div>
                    <div style="font-weight:700; font-size:18px; margin-bottom:4px;">${esc(title)}</div>
                    <div style="font-size:13px; opacity:0.78; margin-bottom:10px;">${esc(desc)}</div>
                    <div style="display:flex; gap:10px; font-size:11px;">
                        <span class="badge" style="background:rgba(255, 42, 109, 0.08); color:var(--accent-pink);">${esc(i.category)}</span>
                        <span class="badge" style="background:rgba(5, 217, 232, 0.08); color:var(--accent-cyan);">Wilaya ${esc(i.wilaya)}</span>
                    </div>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="btn btn-outline" style="padding:10px 20px; font-size:13px; border-radius:10px;" onclick="rejectInitiative('${i.id}')">${dictionary.admin_btn_reject || 'Reject'}</button>
                    <button class="btn btn-primary" style="padding:10px 20px; font-size:13px; border-radius:10px;" onclick="approveInitiative('${i.id}')">${dictionary.admin_btn_approve || 'Approve'}</button>
                </div>
            </div>
        `;
    }).join('');
}

function renderUsersTable(users) {
    const tbody = document.getElementById('user-table-body');
    tbody.innerHTML = users.map(u => {
        const isUserAdmin = u.role === 'admin' || u.role === 'superadmin';
        const promoteBtn = isUserAdmin 
            ? `<button class="btn btn-outline" style="padding:6px 12px; font-size:12px; border-radius:8px;" onclick="updateRole('${u.id}', 'member')">${dictionary.admin_demote || 'Demote'}</button>`
            : `<button class="btn btn-primary" style="padding:6px 12px; font-size:12px; border-radius:8px;" onclick="updateRole('${u.id}', 'admin')">${dictionary.admin_promote || 'Promote'}</button>`;

        // Get User Clubs
        const userClubs = clubMembersCache.filter(cm => cm.user_id === u.id).map(cm => {
            return clubsCache.find(c => c.id === cm.club_id);
        }).filter(Boolean);
        let clubsHtml = '';
        if (userClubs.length > 0) {
            clubsHtml = userClubs.map(c => {
                const name = c[`name_${currentLang}`] || c.name_ar;
                return `<span class="badge" style="background:rgba(5, 217, 232, 0.08); color:var(--accent-cyan); font-size:11px; padding:4px 8px; border-radius:6px; margin:2px; display:inline-block;">${esc(name)}</span>`;
            }).join('');
        } else {
            clubsHtml = `<span style="opacity:0.7; font-size:12px;">${dictionary.admin_no_club || '—'}</span>`;
        }

        // Get User Initiatives
        const userInits = initiativeMembersCache.filter(im => im.user_id === u.id).map(im => {
            return initiativesCache.find(i => i.id === im.initiative_id);
        }).filter(Boolean);
        let initsHtml = '';
        if (userInits.length > 0) {
            initsHtml = userInits.map(i => {
                const title = i[`title_${currentLang}`] || i.title_ar;
                return `<span class="badge" style="background:rgba(163, 0, 255, 0.08); color:var(--accent-purple); font-size:11px; padding:4px 8px; border-radius:6px; margin:2px; display:inline-block;">${esc(title)}</span>`;
            }).join('');
        } else {
            initsHtml = `<span style="opacity:0.7; font-size:12px;">${dictionary.admin_no_initiative || '—'}</span>`;
        }

        return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                <td style="padding:15px; font-weight:700;">${esc(u.full_name)}</td>
                <td style="padding:15px;" class="mono">${esc(u.phone || '—')}</td>
                <td style="padding:15px;">${esc(u.wilaya || '—')}</td>
                <td style="padding:15px;">${clubsHtml}</td>
                <td style="padding:15px;">${initsHtml}</td>
                <td style="padding:15px;">
                    <span class="badge" style="${isUserAdmin ? 'background:rgba(255, 42, 109, 0.08); color:var(--accent-pink);' : 'background:rgba(255,255,255,0.05); color:var(--text-dim);'}">
                        ${esc(u.role)}
                    </span>
                </td>
                <td style="padding:15px; font-weight:800; color:var(--accent-amber);" class="syne">${u.impact_points || 0}</td>
                <td style="padding:15px; display:flex; justify-content:center; align-items:center; gap:10px;">
                    ${promoteBtn}
                    <div style="display:inline-flex; align-items:center; gap:5px;">
                        <input type="number" id="pts-input-${u.id}" value="10" style="width:55px; padding:6px; border-radius:8px; border:none; background:rgba(255,255,255,0.08); color:var(--text-primary); text-align:center; outline:none; font-weight:bold;">
                        <button class="btn btn-primary" style="padding:6px 10px; font-size:12px; border-radius:8px;" onclick="addPoints('${u.id}')">+</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderInitiativesTable(initiatives) {
    const tbody = document.getElementById('initiative-table-body');
    tbody.innerHTML = initiatives.map(i => {
        const title = i[`title_${currentLang}`] || i.title_ar;
        return `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                <td style="padding:15px; font-weight:700;">${esc(title)}</td>
                <td style="padding:15px;">
                    <span class="badge" style="background:rgba(5, 217, 232, 0.08); color:var(--accent-cyan);">${esc(i.category)}</span>
                </td>
                <td style="padding:15px;">${esc(i.wilaya)}</td>
                <td style="padding:15px;" class="mono">${i.current_step} / 5</td>
                <td style="padding:15px;">
                    <span class="badge" style="background:rgba(255, 190, 11, 0.08); color:var(--accent-amber);">${esc(i.status)}</span>
                </td>
                <td style="padding:15px;">
                    <span class="badge" style="${i.is_approved ? 'background:rgba(0, 255, 178, 0.08); color:var(--neon-teal);' : 'background:rgba(255, 42, 109, 0.08); color:var(--accent-pink);'}">
                        ${i.is_approved ? 'Approved' : 'Pending'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function filterUsers() {
    const searchInput = document.getElementById('user-search');
    const clubSelect = document.getElementById('filter-club');
    const initSelect = document.getElementById('filter-initiative');
    
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedClubId = clubSelect ? clubSelect.value : '';
    const selectedInitId = initSelect ? initSelect.value : '';
    
    const filtered = usersCache.filter(u => {
        // 1. Text Query Filter (matches name or wilaya)
        const matchesText = !query || 
            (u.full_name && u.full_name.toLowerCase().includes(query)) ||
            (u.wilaya && u.wilaya.toLowerCase().includes(query));
        
        // 2. Club Filter
        let matchesClub = true;
        if (selectedClubId) {
            const joinedClubs = clubMembersCache.filter(cm => cm.user_id === u.id);
            matchesClub = joinedClubs.some(cm => cm.club_id === selectedClubId);
        }
        
        // 3. Initiative Filter
        let matchesInit = true;
        if (selectedInitId) {
            const joinedInits = initiativeMembersCache.filter(im => im.user_id === u.id);
            matchesInit = joinedInits.some(im => im.initiative_id === selectedInitId);
        }
        
        return matchesText && matchesClub && matchesInit;
    });
    
    renderUsersTable(filtered);
}

function triggerNotification(titleKey, bodyKey) {
    const notif = {
        type: 'step',
        title_ar: TRANSLATIONS.ar[titleKey] || titleKey,
        title_fr: TRANSLATIONS.fr[titleKey] || titleKey,
        title_en: TRANSLATIONS.en[titleKey] || titleKey,
        body_ar: TRANSLATIONS.ar[bodyKey] || '',
        body_fr: TRANSLATIONS.fr[bodyKey] || '',
        body_en: TRANSLATIONS.en[bodyKey] || '',
    };
    showToast(notif);
}

window.approveInitiative = async (id) => {
    await neon.from('initiatives').update({ is_approved: true }, id);
    triggerNotification('admin_toast_initiative_action', 'msg_success');
    await loadData();
};

window.rejectInitiative = async (id) => {
    await neon.from('initiatives').delete(id);
    triggerNotification('admin_toast_initiative_action', 'msg_success');
    await loadData();
};

window.updateRole = async (id, role) => {
    await neon.from('profiles').update({ role }, id);
    triggerNotification('admin_toast_role_updated', 'msg_success');
    await loadData();
};

window.addPoints = async (id) => {
    const input = document.getElementById(`pts-input-${id}`);
    const amount = parseInt(input.value) || 0;
    const res = await neon.rpc('award_points_admin', { p_user_id: id, p_amount: amount, p_reason: 'admin_adjustment' });
    if (!res.error) {
        triggerNotification('admin_toast_points_added', 'msg_success');
        await loadData();
    }
};

window.init = init;
init();