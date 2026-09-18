import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GlassCard } from '../components/GlassCard';

export default function ProfileScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Profil</Text>
            <GlassCard>
                <Text style={styles.avatar}>👤</Text>
                <Text style={styles.name}>Jeune Athar</Text>
                <Text style={styles.stats}>📍 Alger</Text>
                <Text style={styles.stats}>⚡ 0 points d'impact</Text>
            </GlassCard>
            <GlassCard style={styles.meta}>
                <Text style={styles.metaText}>Synchronisez votre compte pour voir vos clubs, formations et invitations.</Text>
            </GlassCard>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#04060F', padding: 20 },
    header: { color: 'white', fontSize: 24, marginBottom: 20, marginTop: 40 },
    avatar: { fontSize: 48, textAlign: 'center', marginBottom: 10 },
    name: { color: 'white', fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
    stats: { color: '#8E95B3', fontSize: 14, textAlign: 'center', marginTop: 8 },
    meta: { marginTop: 15 },
    metaText: { color: '#8E95B3', fontSize: 13, lineHeight: 20 }
});