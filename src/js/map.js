// Real Map Visualization for Admin — OpenStreetMap via Leaflet
import { APP_CONFIG } from './config.js';

const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

const DARK_CSS = `
    .athar-osm .leaflet-container { background: #0d101d; font-family: inherit; }
    .athar-osm .leaflet-tile { filter: brightness(0.62) invert(1) contrast(3.1) hue-rotate(200deg) saturate(0.35) brightness(0.72); }
    .athar-osm .leaflet-control-zoom a { background: rgba(20,22,42,0.92); color: #d8d9ef; border-color: rgba(255,255,255,0.1); }
    .athar-osm .leaflet-control-zoom a:hover { background: #05070f; color: #05d9e8; }
    .athar-osm .leaflet-control-attribution { background: rgba(20,22,42,0.72); color: #8b8fa8; }
    .athar-osm .leaflet-control-attribution a { color: #05d9e8; }
    .athar-osm .leaflet-popup-content-wrapper, .athar-osm .leaflet-popup-tip { background: #141630; color: #d8d9ef; }
    .athar-osm .leaflet-popup-content-wrapper { border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; }
    .athar-osm .leaflet-popup-content { margin: 10px 14px; line-height: 1.5; }
    .athar-osm .leaflet-popup-close-button { color: #d8d9ef !important; }
`;

let leafletPromise = null;

function loadLeaflet() {
    if (window.L) return Promise.resolve(true);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise((resolve) => {
        if (!document.querySelector('link[data-athar-leaflet]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = LEAFLET_CSS;
            link.setAttribute('data-athar-leaflet', '');
            document.head.appendChild(link);
        }
        const script = document.createElement('script');
        script.src = LEAFLET_JS;
        script.onload = () => resolve(true);
        script.onerror = () => { leafletPromise = null; resolve(false); };
        document.head.appendChild(script);
    });
    return leafletPromise;
}

function injectStyle(css) {
    let style = document.getElementById('athar-osm-style');
    if (!style) {
        style = document.createElement('style');
        style.id = 'athar-osm-style';
        document.head.appendChild(style);
    }
    style.textContent = css;
}

// Normalize a wilaya string so "Béjaïa"/"Bejaia", "M'Sila"/"msila" all match.
function norm(s) {
    return String(s).trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/['’\s-]/g, '');
}

const COLORS = {
    none: '#2a2d45',
    low: '#05d9e8',
    mid: '#ffbe0b',
    high: '#ff2a6d'
};

function labelFor(count, lang) {
    if (lang === 'fr') return count === 1 ? 'initiative' : 'initiatives';
    if (lang === 'en') return count === 1 ? 'initiative' : 'initiatives';
    return count === 1 ? 'مبادرة' : 'مبادرة';
}

export async function renderWilayaMap(containerId, stats = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const ok = await loadLeaflet();
    if (!ok || !window.L) {
        const lang = document.documentElement.lang || 'ar';
        container.innerHTML = `<div style="height:100%; display:flex; align-items:center; justify-content:center; text-align:center; opacity:0.7; padding:20px; font-size:14px;">${
            lang === 'ar' ? 'خريطة الفريق غير متاحة حالياً — تحقق من اتصال الإنترنت' :
            lang === 'fr' ? 'Carte hors ligne pour le moment — vérifiez votre connexion' :
            'Map unavailable right now — check your connection'}</div>`;
        return;
    }

    const L = window.L;
    if (container._atharMap) container._atharMap.remove();
    container.innerHTML = '';
    injectStyle(DARK_CSS);
    container.classList.add('athar-osm');

    // Aggregate stats per wilaya index (name keys override numeric for safety).
    const counts = new Array(APP_CONFIG.wilayas.length).fill(0);
    Object.entries(stats || {}).forEach(([key, value]) => {
        const n = parseInt(key, 10);
        if (!isNaN(n) && n >= 1 && n <= counts.length) {
            counts[n - 1] += value;
        } else {
            const wanted = norm(key);
            APP_CONFIG.wilayas.forEach((w, i) => {
                if (wanted && norm(w) === wanted) counts[i] += value;
            });
        }
    });

    const lang = document.documentElement.lang || 'ar';
    const map = L.map(container, {
        center: [27.5, 2.2],
        zoom: 5,
        minZoom: 4,
        maxBounds: [[15, -16], [40, 16]],
        zoomControl: true,
        attributionControl: true
    });
    container._atharMap = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const maxCount = Math.max(1, ...counts);
    counts.forEach((count, i) => {
        const [lat, lng] = APP_CONFIG.wilayaCoords[i] || [0, 0];
        const name = APP_CONFIG.wilayas[i];
        const color = count <= 0 ? COLORS.none : count >= maxCount * 0.6 ? COLORS.high : count >= maxCount * 0.25 ? COLORS.mid : COLORS.low;
        const radius = count <= 0 ? 4 : 7 + Math.round((count / maxCount) * 16);

        const marker = L.circleMarker([lat, lng], {
            radius,
            color: color,
            weight: 1,
            fillColor: color,
            fillOpacity: count > 0 ? 0.85 : 0.25
        }).addTo(map);

        marker.bindPopup(`<b>${name}</b><br>${count} ${labelFor(count, lang)}`);
        marker.bindTooltip(name, { sticky: true });
    });

    // Small legend
    const legend = L.control({ position: 'bottomleft' });
    legend.onAdd = () => {
        const div = L.DomUtil.create('div', '');
        div.style.cssText = 'background:rgba(14,16,31,0.9); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px 12px; font-size:12px; color:#d8d9ef; line-height:1.7;';
        const row = (color, txt) => `<div style="display:flex; align-items:center; gap:8px;"><span style="width:10px; height:10px; border-radius:50%; background:${color}; display:inline-block;"></span>${txt}</div>`;
        div.innerHTML = row(COLORS.high, lang === 'ar' ? 'نشاط عالٍ' : lang === 'fr' ? 'Activité forte' : 'High activity') +
            row(COLORS.mid, lang === 'ar' ? 'نشاط متوسط' : lang === 'fr' ? 'Activité moyenne' : 'Medium activity') +
            row(COLORS.low, lang === 'ar' ? 'نشاط منخفض' : lang === 'fr' ? 'Activité faible' : 'Low activity');
        return div;
    };
    legend.addTo(map);

    // Container may have had zero height during render — correct on next frame.
    setTimeout(() => map.invalidateSize(), 50);
}