import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { GlassCard } from '../components/GlassCard';

const FALLBACK = [
    { id: '1', title_ar: 'Bienvenue sur la plateforme Athar !', type: 'info', created_at: new Date().toISOString() },
    { id: '2', title_ar: 'Découvrez les nouveaux clubs de robotique.', type: 'success', created_at: new Date().toISOString() }
];

export default function NotificationsScreen() {
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await supabase.from('notifications').select('*');
                setNotifs(data && data.length ? data : FALLBACK);
            } catch (_) {
                setNotifs(FALLBACK);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#05D9E8" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Alerts</Text>
            <FlatList
                data={notifs}
                keyExtractor={(item, i) => (item.id ? String(item.id) : String(i))}
                renderItem={({ item }) => (
                    <GlassCard style={styles.card}>
                        <Text style={styles.title}>{item.title_ar || item.title}</Text>
                        <Text style={styles.status}>{(item.created_at || '').slice(0, 10)}</Text>
                    </GlassCard>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#04060F', padding: 20 },
    center: { flex: 1, backgroundColor: '#04060F', justifyContent: 'center' },
    header: { color: 'white', fontSize: 24, marginBottom: 20, marginTop: 40 },
    card: { marginBottom: 12 },
    title: { color: 'white', fontSize: 15, fontWeight: 'bold' },
    status: { color: '#8E95B3', fontSize: 11, marginTop: 6 }
});