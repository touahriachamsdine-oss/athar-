// Neon Auth & Demo Mode Implementation
import { NEON_AUTH_URL } from './config.js';
import { neon, seedMockDB } from './neon.js';

export async function signUp(email, password, fullName, phone, wilaya, neighborhood) {
    if (localStorage.getItem('athar_mock_mode') === 'true' || email.endsWith('@athar.dz')) {
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
        neon.setToken(mockSession.token);

        window.location.href = '/pages/dashboard.html';
        return { session: mockSession };
    }

    try {
        const res = await fetch(`${NEON_AUTH_URL}/signUp`, {
            method: 'POST',
            body: JSON.stringify({ email, password, name: fullName, metadata: { phone, wilaya, neighborhood } })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        localStorage.removeItem('athar_mock_mode');
        localStorage.setItem('neon_session', JSON.stringify(data.session));
        neon.setToken(data.session.token);
        window.location.href = '/pages/dashboard.html';
    } catch (e) {
        return { error: e.message };
    }
}

export async function signIn(email, password) {
    if (localStorage.getItem('athar_mock_mode') === 'true' || email.endsWith('@athar.dz')) {
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
        neon.setToken(mockSession.token);

        if (profile.role === 'admin' || profile.role === 'superadmin') {
            window.location.href = '/pages/admin.html';
        } else {
            window.location.href = '/pages/dashboard.html';
        }
        return { session: mockSession };
    }

    try {
        const res = await fetch(`${NEON_AUTH_URL}/signIn`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        localStorage.removeItem('athar_mock_mode');
        localStorage.setItem('neon_session', JSON.stringify(data.session));
        neon.setToken(data.session.token);

        // Fetch role from remote database
        const { data: profile } = await neon.from('profiles').select().id(data.session.user.id);
        const role = profile && profile[0] ? profile[0].role : 'member';
        
        if (role === 'admin' || role === 'superadmin') {
            window.location.href = '/pages/admin.html';
        } else {
            window.location.href = '/pages/dashboard.html';
        }
        return { session: data.session };
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
    neon.setToken(mockSession.token);
    
    if (role === 'admin' || role === 'superadmin') {
        window.location.href = '/pages/admin.html';
    } else {
        window.location.href = '/pages/dashboard.html';
    }
}

export async function signOut() {
    localStorage.removeItem('neon_session');
    localStorage.removeItem('athar_mock_mode');
    window.location.href = '/pages/auth.html';
}

export async function getSession() {
    const sessionStr = localStorage.getItem('neon_session');
    if (!sessionStr) return null;
    const session = JSON.parse(sessionStr);
    neon.setToken(session.token);
    return session;
}

export async function requireAuth() {
    const session = await getSession();
    if (!session) {
        window.location.href = '/pages/auth.html';
        return null;
    }

    const { data: profile } = await neon.from('profiles').select().id(session.user.id);
    return { user: session.user, profile: profile ? profile[0] : null };
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
