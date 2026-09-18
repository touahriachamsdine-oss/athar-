import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '../supabase';
import { GlassCard } from '../components/GlassCard';

export default function ExploreScreen() {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await supabase.from('clubs').select('*');
                setClubs(data || []);
            } catch (_) {
                setClubs([]);
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

    const localTitle = c => c.name_ar || c.name_en || '—';

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Explore</Text>
            <FlatList
                data={clubs}
                keyExtractor={item => (item.id ? String(item.id) : Math.random().toString())}
                renderItem={({ item }) => (
                    <GlassCard style={styles.card}>
                        <Text style={styles.title}>{localTitle(item)}</Text>
                        <Text style={styles.status}>{item.wilaya || 'Algérie'}</Text>
                    </GlassCard>
                )}
                ListEmptyComponent={<Text style={styles.empty}>Aucun club disponible pour le moment.</Text>}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#04060F', padding: 20 },
    center: { flex: 1, backgroundColor: '#04060F', justifyContent: 'center' },
    header: { color: 'white', fontSize: 24, marginBottom: 20, marginTop: 40 },
    card: { marginBottom: 15 },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    status: { color: '#00FFB2', fontSize: 12, marginTop: 5 },
    empty: { color: '#8E95B3', marginTop: 40, textAlign: 'center' }
});