// Social Sharing & Canvas Generation
export function updateOGTags(title, desc) {
    document.title = `${title} — أثر`;
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
}

export async function generateShareCard(text, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Gradient Background
    const grad = ctx.createLinearGradient(0, 0, 800, 400);
    grad.addColorStop(0, '#04060F');
    grad.addColorStop(1, '#0a1025');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 800, 400);

    // Neon Ring
    ctx.strokeStyle = '#05D9E8';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 760, 360);

    // Heading
    ctx.fillStyle = '#05D9E8';
    ctx.font = 'bold 40px Syne';
    ctx.textAlign = 'center';
    ctx.fillText('ATHAR — أثر', 400, 100);

    // Content
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px DM Sans';
    ctx.fillText(text, 400, 220);

    return canvas.toDataURL('image/png');
}
