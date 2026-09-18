// Database Access Layer (Neon Native)
import { neon } from './neon.js';

export async function getProfile(userId) {
    const { data } = await neon.from('profiles').select().id(userId);
    return { data: data ? data[0] : null };
}

export async function updateProfile(userId, data) {
    return neon.from('profiles').update(data, userId);
}

export async function getMyInitiatives(userId) {
    // Note: Joins are more complex via Data API without a query builder.
    // For now, we fetch memberships and initiatives separately or use views.
    return neon.from('initiative_members').select();
}

export async function createInitiative(data, userId) {
    try {
        const { data: initiative, error: iErr } = await neon.from('initiatives').insert({
            ...data,
            created_by: userId,
            status: 'planning'
        });
        if (iErr) throw iErr;

        await neon.from('initiative_members').insert({
            initiative_id: initiative[0].id,
            user_id: userId,
            role: 'founder'
        });

        return { data: initiative[0] };
    } catch (e) {
        return { data: null, error: e.message };
    }
}
