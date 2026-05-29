// Client-side Health Analytics
import { neon } from './neon.js';

export async function getHealthReport(initiativeId) {
    const { data } = await neon
        .from('initiatives')
        .select()
        .id(initiativeId);
    return data ? data[0] : null;
}

export function getHealthColor(score) {
    if (score >= 70) return '#00FFB2'; // Neon Green
    if (score >= 40) return '#FFD700'; // Gold
    return '#FF3E3E'; // Neon Red
}
