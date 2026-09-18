import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { GlassCard } from '../components/GlassCard';

export default function DashboardScreen() {
    const [initiatives, setInitiatives] = useState([]);

    useEffect(() => {
        fetchInitiatives();
    }, []);

    async function fetchInitiatives() {
        const { data } = await supabase.from('initiatives').select('*');
        setInitiatives(data || []);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>My Initiatives</Text>
            <FlatList
                data={initiatives}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <GlassCard style={styles.card}>
                        <Text style={styles.title}>{item.title_en}</Text>
                        <Text style={styles.status}>{item.status.toUpperCase()}</Text>
                        <View style={styles.scoreBar}>
                            <View style={[styles.scoreInner, { width: `${item.health_score}%` }]} />
                        </View>
                    </GlassCard>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#04060F', padding: 20 },
    header: { color: 'white', fontSize: 24, marginBottom: 20, marginTop: 40 },
    card: { marginBottom: 15 },
    title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    status: { color: '#00D4FF', fontSize: 12, marginTop: 5 },
    scoreBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 15, borderRadius: 2 },
    scoreInner: { height: '100%', backgroundColor: '#00FFB2' }
});
