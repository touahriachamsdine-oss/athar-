import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';

function isConfigured(url, key) {
    return !url.startsWith('YOUR_') && !key.startsWith('YOUR_');
}

let supabase;

if (isConfigured(supabaseUrl, supabaseAnonKey)) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
        },
    });
} else {
    // Graceful stub so the app boots before credentials are configured.
    supabase = {
        auth: {
            signInWithPassword: async () => ({ error: { message: 'Configure YOUR_SUPABASE_URL / YOUR_SUPABASE_ANON_KEY in mobile/supabase.js' } }),
            signOut: async () => ({ error: null }),
        },
        from: () => ({
            select: () => ({ data: [], error: { message: 'Backend not configured' } }),
            insert: async () => ({ data: null, error: { message: 'Backend not configured' } }),
            update: async () => ({ data: null, error: { message: 'Backend not configured' } }),
        }),
    };
}

export { supabase };