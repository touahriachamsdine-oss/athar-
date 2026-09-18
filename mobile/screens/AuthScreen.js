import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { GlassCard } from '../components/GlassCard';

export default function AuthScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) alert(error.message);
    };

    return (
        <View style={styles.container}>
            <GlassCard>
                <Text style={styles.title}>Athar — أثر</Text>
                <TextInput
                    placeholder="Email" placeholderTextColor="#aaa"
                    style={styles.input} value={email} onChangeText={setEmail}
                />
                <TextInput
                    placeholder="Password" placeholderTextColor="#aaa"
                    secureTextEntry style={styles.input} value={password} onChangeText={setPassword}
                />
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Sign In</Text>
                </TouchableOpacity>
            </GlassCard>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#04060F', justifyContent: 'center', padding: 20 },
    title: { color: '#05D9E8', fontSize: 32, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
    input: { borderBottomWidth: 1, borderBottomColor: '#05D9E833', color: 'white', padding: 15, marginBottom: 20 },
    button: { backgroundColor: '#05D9E8', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: '#04060F', fontWeight: 'bold' }
});
