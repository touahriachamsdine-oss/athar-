// Map Visualization for Admin
export function renderWilayaMap(containerId, stats) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Simple Dot Visualization for 58 Wilayas (Algeria)
    // In a full production app, this would be an SVG <map> or <path> complex.
    // We will use a stylistic "North African UI" approach with glowing dots.

    container.innerHTML = `
        <div style="position:relative; width:100%; aspect-ratio:1; background:rgba(255,255,255,0.02); border-radius:50%; border:1px dashed var(--glass-border); display:flex; align-items:center; justify-content:center;">
            <div class="syne gradient-text" style="font-size:120px; opacity:0.1; letter-spacing:10px;">ALGERIA</div>
            <div id="map-dots" style="position:absolute; inset:0;"></div>
        </div>
    `;

    const dots = document.getElementById('map-dots');
    // Generating 58 random-ish but deterministic points for stylized map
    for (let i = 1; i <= 58; i++) {
        const x = 50 + (Math.sin(i * 1.5) * 40);
        const y = 50 + (Math.cos(i * 2) * 40);
        const count = stats[i] || 0;
        const color = count > 0 ? 'var(--neon-green)' : 'var(--glass-border)';
        const size = 5 + (count * 2);

        const dot = document.createElement('div');
        dot.style.cssText = `
            position:absolute; 
            left:${x}%; 
            top:${y}%; 
            width:${size}px; 
            height:${size}px; 
            background:${color}; 
            border-radius:50%; 
            box-shadow: 0 0 ${size}px ${color};
            cursor:pointer;
            transition: all 0.3s ease;
        `;
        dot.title = `Wilaya ${i}: ${count} Initiatives`;
        dots.appendChild(dot);
    }
}
