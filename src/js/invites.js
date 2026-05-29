// Token-based Invitation Logic
import { neon } from './neon.js';

export async function createInvite(initiativeId, invitedBy, phone = null) {
    const { data, error } = await neon
        .from('invites')
        .insert({ initiative_id: initiativeId, invited_by: invitedBy, phone });

    const invite = data ? data[0] : null;
    return { data: invite, shareUrl: `${window.location.origin}/pages/join.html?token=${invite?.token}` };
}

export async function acceptInvite(token, userId) {
    try {
        const { data, error: vErr } = await neon
            .from('invites')
            .select()
            .eq('token', token);

        const invite = data ? data[0] : null;
        if (vErr || !invite) throw new Error('Invalid or expired token');

        // Add member
        await neon.from('initiative_members').insert({
            initiative_id: invite.initiative_id,
            user_id: userId,
            is_confirmed: true
        });

        // Mark accepted
        await neon.from('invites').update({ is_accepted: true }, invite.id);

        return { success: true, initiativeId: invite.initiative_id };
    } catch (e) {
        return { error: e.message };
    }
}
