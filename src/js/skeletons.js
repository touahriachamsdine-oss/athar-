// Loading skeleton placeholders — shimmer blocks shown while data loads.

function cardBlock(height) {
    return `<div class="skel-block skel-card" style="height:${height}px;"></div>`;
}

export const SKEL_GRID = (n = 6, height = 180) =>
    `<div class="skel-grid">${Array(n).fill(cardBlock(height)).join('')}</div>`;

export const SKEL_ROWS = (n = 4) =>
    `<div class="skel-rows">${Array(n).fill('<div class="skel-block skel-row"></div>').join('')}</div>`;

export const SKEL_MAP =
    `<div class="skel-block skel-map"></div>`;

export const SKEL_LINE = (width = '100%', height = 14) =>
    `<span class="skel-block" style="display:inline-block; width:${width}; height:${height}px;"></span>`;

// Seed a container with skeleton markup (keeps height so layouts don't jump).
// Replace later by re-rendering the container (innerHTML swap).
export function mountSkeleton(el, html) {
    if (!el) return;
    if (el.dataset.skelLoaded === '1') return;
    el.innerHTML = html;
}

// Finish sooner than the first real render (e.g., empty states).
export function clearSkeleton(el) {
    if (!el) return;
    el.innerHTML = '';
}