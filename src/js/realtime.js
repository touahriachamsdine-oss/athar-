// Real-time Subscriptions (Robust Neon Polling)
import { neon } from './neon.js';
import { showToast } from './notifications.js';

export function subscribeToInitiative(initiativeId, callbacks) {
    let lastTasks = [];
    let lastMembers = [];
    let isSubscribed = true;

    async function poll() {
        if (!isSubscribed) return;
        try {
            // Poll tasks
            const { data: tasks } = await neon.from('tasks').select().eq('initiative_id', initiativeId);
            if (tasks && JSON.stringify(tasks) !== JSON.stringify(lastTasks)) {
                if (lastTasks.length > 0 && callbacks.onTaskUpdate) {
                    callbacks.onTaskUpdate({ new: tasks });
                }
                lastTasks = tasks;
            }

            // Poll members
            const { data: members } = await neon.from('initiative_members').select().eq('initiative_id', initiativeId);
            if (members && JSON.stringify(members) !== JSON.stringify(lastMembers)) {
                if (lastMembers.length > 0 && callbacks.onMemberJoin) {
                    callbacks.onMemberJoin({ new: members });
                }
                lastMembers = members;
            }
        } catch (e) {
            console.error('Polling error:', e);
        }
        if (isSubscribed) {
            setTimeout(poll, 5000);
        }
    }

    poll();

    return {
        unsubscribe: () => {
            isSubscribed = false;
        }
    };
}

export function subscribeToNotifications(userId, onNew) {
    let lastNotifs = [];
    let isSubscribed = true;

    async function poll() {
        if (!isSubscribed) return;
        try {
            const { data: notifs } = await neon.from('notifications').select().eq('user_id', userId);
            if (notifs) {
                const sorted = notifs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                if (lastNotifs.length > 0) {
                    const existingIds = new Set(lastNotifs.map(n => n.id));
                    const newNotifs = sorted.filter(n => !existingIds.has(n.id));
                    newNotifs.forEach(n => {
                        onNew(n);
                        showToast(n);
                    });
                }
                lastNotifs = sorted;
            }
        } catch (e) {
            console.error('Notif polling error:', e);
        }
        if (isSubscribed) {
            setTimeout(poll, 5000);
        }
    }

    poll();

    return {
        unsubscribe: () => {
            isSubscribed = false;
        }
    };
}

export function unsubscribeAll() {
    // Graceful no-op
}
