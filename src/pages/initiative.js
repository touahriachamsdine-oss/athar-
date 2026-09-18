import { neon } from '../js/neon.js';
import { requireAuth } from '../js/auth.js';
import { injectLayout } from '../js/layout.js';

async function init() {
    await requireAuth({ guests: true });
    injectLayout();

    const id = new URLSearchParams(window.location.search).get('id');
    const { data: results } = await neon.from('initiatives').select().id(id);
    const initia = results ? results[0] : null;

    if (initia) {
        document.getElementById('initiative-info').innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:40px;">
                <div style="flex:1; min-width:300px;">
                    <div class="badge mb-20" style="background:var(--neon-teal); color:black;">${initia.category.toUpperCase()}</div>
                    <h1 class="gradient-text reveal active" style="font-size:clamp(32px, 5vw, 64px);">${initia.title_ar}</h1>
                    <p class="mt-40 mono" style="font-size:18px; opacity:0.7;">📍 ${initia.wilaya} — ${initia.neighborhood}</p>
                    <p class="mt-40" style="font-size:20px; line-height:1.6; opacity:0.9;">${initia.description_ar}</p>
                    <div class="mt-40" style="display:flex; gap:20px;">
                        <button class="btn btn-primary" id="join-init-btn">انضم الآن</button>
                        <button class="btn btn-outline" onclick="history.back()">العودة</button>
                    </div>
                </div>
                <div class="text-center">
                    <svg width="200" height="200" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8"/>
                        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--neon-green)" stroke-width="8" 
                            stroke-dasharray="${initia.health_score * 2.82} 282.6" transform="rotate(-90 50 50)" style="filter:drop-shadow(0 0 5px var(--neon-green))"/>
                        <text x="50" y="55" text-anchor="middle" fill="white" style="font-size:20px; font-family:'Syne';" font-weight="800">${initia.health_score}%</text>
                    </svg>
                    <div class="mono mt-20" style="font-size:12px; color:var(--neon-green);">INITIATIVE HEALTH</div>
                </div>
            </div>

            <div style="margin-top:80px; display:grid; grid-template-columns: 1fr 350px; gap:40px;">
                 <div class="glass" style="padding:40px; border-radius:30px;">
                    <h3 class="syne mb-20">PROPOSED MILESTONES</h3>
                    <div style="padding-left:20px; border-left:1px solid var(--glass-border);">
                        <p style="opacity:0.6;">No milestones updated yet by the organizer.</p>
                    </div>
                 </div>
                  
                 <div class="glass" style="padding:40px; border-radius:30px;">
                    <h3 class="syne mb-20">PARTICIPANTS</h3>
                    <div class="flex-center" style="justify-content:start; gap:10px;">
                        <div style="width:40px; height:40px; border-radius:50%; background:var(--neon-teal);"></div>
                        <div style="width:40px; height:40px; border-radius:50%; background:var(--neon-gold);"></div>
                        <div style="width:40px; height:40px; border-radius:50%; background:var(--glass-bg); border:1px solid var(--glass-border); display:flex; align-items:center; justify-content:center;">+12</div>
                    </div>
                 </div>
            </div>
        `;
    }
}
init();