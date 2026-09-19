// Neon Auth & Demo Mode Implementation
import { NEON_AUTH_URL, NEON_ANON_KEY } from './config.js';
import { neon, seedMockDB, mockEnabled } from './neon.js';

function withAuthHeaders() {
    return { apikey: NEON_ANON_KEY, 'Content-Type': 'application/json' };
}

// GoTrue session shape -> app session shape (+ legacy `token` alias so older
// page code keeps working) 
function normalizeSession(data) {
    const accessToken = data.access_token || data.token || '';
    const user = data.user || (data.session ? data.session.user : null) || null;
    return {
        access_token: accessToken,
        refresh_token: data.refresh_token || '',
        expires_at: data.expires_at || (data.expires_in ? Date.now() + data.expires_in * 1000 : null),
        token_type: data.token_type || 'bearer',
        token: accessToken,
        user: user ? { id: user.id, email: user.email, name: (user.user_metadata && user.user_metadata.full_name) || user.name || user.email, ...user } : null
    };
}

function persistSession(session) {
    localStorage.removeItem('athar_mock_mode');
    localStorage.setItem('neon_session', JSON.stringify(session));
    neon.setToken(session.token || session.access_token);
}

export async function signUp(email, password, fullName, phone, wilaya, neighborhood) {
    if (mockEnabled() || email.endsWith('@athar.dz')) {
        localStorage.setItem('athar_mock_mode', 'true');
        seedMockDB();
        
        const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
        if (profiles.find(p => p.email === email || p.phone === phone)) {
            return { error: 'البريد الإلكتروني أو الهاتف مسجل بالفعل' };
        }

        const newProfile = {
            id: 'mock_user_' + Math.random().toString(36).substring(2, 11),
            full_name: fullName,
            phone: phone,
            wilaya: wilaya,
            neighborhood: neighborhood,
            avatar_url: '',
            role: 'member',
            impact_points: 0,
            lang: 'ar',
            theme: 'dark',
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        profiles.push(newProfile);
        localStorage.setItem('athar_mock_db_profiles', JSON.stringify(profiles));

        const mockSession = {
            token: 'mock-session-jwt-token-12345',
            user: {
                id: newProfile.id,
                email: email,
                name: fullName
            }
        };

        localStorage.setItem('neon_session', JSON.stringify(mockSession));
        localStorage.setItem('athar_user_role', newProfile.role);
        neon.setToken(mockSession.token);

        redirectAfterAuth();
        return { session: mockSession };
    }

    try {
        const res = await fetch(`${NEON_AUTH_URL}/v1/signup`, {
            method: 'POST',
            headers: withAuthHeaders(),
            body: JSON.stringify({
                email,
                password,
                data: { full_name: fullName, phone, wilaya, neighborhood }
            })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            const msg = (data && (data.msg || data.error_description || data.message)) || 'failed to create account';
            throw new Error(msg);
        }

        const session = normalizeSession(data);
        persistSession(session);
        localStorage.setItem('athar_user_role', 'member');
        redirectAfterAuth();
    } catch (e) {
        return { error: e.message };
    }
}

export async function signIn(email, password) {
    if (mockEnabled() || email.endsWith('@athar.dz')) {
        localStorage.setItem('athar_mock_mode', 'true');
        seedMockDB();
        
        const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
        let profile = null;
        
        if (email === 'admin@athar.dz' || email === 'superadmin@athar.dz') {
            profile = profiles.find(p => p.id === 'admin_user_id');
        } else if (email === 'yasmine@athar.dz') {
            profile = profiles.find(p => p.id === 'member_user_1');
        } else if (email === 'karim@athar.dz') {
            profile = profiles.find(p => p.id === 'member_user_2');
        } else if (email === 'fatima@athar.dz') {
            profile = profiles.find(p => p.id === 'member_user_3');
        } else {
            profile = profiles.find(p => p.email === email);
        }

        if (!profile) {
            return { error: 'اسم المستخدم غير مسجل' };
        }

        const isProfileAdmin = profile.role === 'admin' || profile.role === 'superadmin';
        const correctPassword = isProfileAdmin ? 'adminpassword123' : 'memberpassword123';
        if (password !== correctPassword) {
            return { error: 'كلمة المرور غير صحيحة' };
        }

        const mockSession = {
            token: 'mock-session-jwt-token-12345',
            user: {
                id: profile.id,
                email: email,
                name: profile.full_name
            }
        };

        localStorage.setItem('neon_session', JSON.stringify(mockSession));
        localStorage.setItem('athar_user_role', profile.role);
        neon.setToken(mockSession.token);

        redirectAfterAuth();
        return { session: mockSession };
    }

    try {
        const res = await fetch(`${NEON_AUTH_URL}/v1/token?grant_type=password`, {
            method: 'POST',
            headers: withAuthHeaders(),
            body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) {
            const msg = (data && (data.msg || data.error_description || data.message)) || 'invalid credentials';
            throw new Error(msg);
        }

        const session = normalizeSession(data);
        persistSession(session);

        // Fetch role from remote database
        const { data: profile } = await neon.from('profiles').select().id(session.user ? session.user.id : null);
        const role = profile && profile[0] ? profile[0].role : 'member';
        localStorage.setItem('athar_user_role', role);
        
        redirectAfterAuth();
        return { session };
    } catch (e) {
        return { error: e.message };
    }
}

export async function signInDemo(role = 'superadmin') {
    localStorage.setItem('athar_mock_mode', 'true');
    seedMockDB();
    
    // Find matching profile in mock DB
    const profiles = JSON.parse(localStorage.getItem('athar_mock_db_profiles') || '[]');
    const profile = profiles.find(p => p.role === role) || profiles[0];
    
    const mockSession = {
        token: 'mock-session-jwt-token-12345',
        user: {
            id: profile.id,
            email: role === 'superadmin' ? 'admin@athar.dz' : 'yasmine@athar.dz',
            name: profile.full_name
        }
    };
    
    localStorage.setItem('neon_session', JSON.stringify(mockSession));
    localStorage.setItem('athar_user_role', profile.role);
    neon.setToken(mockSession.token);
    
    redirectAfterAuth();
}

function redirectAfterAuth() {
    const next = new URLSearchParams(window.location.search).get('next');
    if (next && next.startsWith('/') && !next.startsWith('//')) {
        window.location.href = next;
        return;
    }
    const role = localStorage.getItem('athar_user_role');
    window.location.href = (role === 'admin' || role === 'superadmin') ? '/pages/admin.html' : '/pages/dashboard.html';
}

export async function signOut() {
    localStorage.removeItem('neon_session');
    localStorage.removeItem('athar_mock_mode');
    localStorage.removeItem('athar_user_role');
    try {
        if (!localStorage.getItem('athar_mock_mode')) {
            const session = JSON.parse(localStorage.getItem('neon_session') || 'null');
            if (session && session.refresh_token) {
                await fetch(`${NEON_AUTH_URL}/v1/logout`, {
                    method: 'POST',
                    headers: withAuthHeaders(),
                    body: JSON.stringify({ refresh_token: session.refresh_token })
                });
            }
        }
    } catch (e) { /* signout must never throw */ }
    window.location.href = '/pages/auth.html';
}

export async function refreshSession(refreshToken) {
    try {
        const res = await fetch(`${NEON_AUTH_URL}/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: withAuthHeaders(),
            body: JSON.stringify({ refresh_token: refreshToken })
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data || data.error) {
            const msg = (data && (data.msg || data.error_description)) || 'session expired';
            return { error: msg };
        }
        const session = normalizeSession(data);
        persistSession(session);
        return { session };
    } catch (e) {
        return { error: e.message };
    }
}

export async function getSession() {
    const sessionStr = localStorage.getItem('neon_session');
    if (!sessionStr) return null;
    const session = JSON.parse(sessionStr);
    neon.setToken(session.token || session.access_token);

    const isRealSession = localStorage.getItem('athar_mock_mode') !== 'true' && !!session.access_token;
    if (isRealSession && session.expires_at && Date.now() >= session.expires_at - 30000 && session.refresh_token) {
        const refreshed = await refreshSession(session.refresh_token);
        if (refreshed.session) return refreshed.session;
        localStorage.removeItem('neon_session');
        localStorage.removeItem('athar_user_role');
        return null;
    }
    return session;
}

export async function requireAuth(opts = {}) {
    const session = await getSession();
    if (!session) {
        if (opts.guests) {
            return { guest: true, user: null, profile: null };
        }
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/pages/auth.html?next=${next}`;
        return null;
    }

    const { data: profile } = await neon.from('profiles').select().id(session.user.id);
    const profileRow = profile ? profile[0] : null;
    if (profileRow) {
        localStorage.setItem('athar_user_role', profileRow.role || 'member');
    }
    return { user: session.user, profile: profileRow };
}

export function requireUser(auth) {
    if (auth && auth.guest) {
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/pages/auth.html?next=${next}`;
        return false;
    }
    return !!auth;
}

export async function requireAdmin() {
    const auth = await requireAuth();
    if (!auth) return null;

    if (auth.profile.role !== 'admin' && auth.profile.role !== 'superadmin') {
        window.location.href = '/pages/dashboard.html';
        return null;
    }
    return auth;
}
