import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../supabase';
import { GlassCard } from '../components/GlassCard';

export default function CreateScreen() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setSubmitting(true);
        const { error } = await supabase.from('initiatives').insert({
            title_ar: title,
            title_fr: title,
            title_en: title,
            description_ar: description,
            wilaya: 'Alger',
            neighborhood: '',
            status: 'planning',
        });
        setSubmitting(false);
        alert(error ? error.message : '✅ Initiative soumise !');
        if (!error) {
            setTitle('');
            setDescription('');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Create</Text>
            <GlassCard>
                <TextInput
                    placeholder="Titre de l'initiative" placeholderTextColor="#aaa"
                    style={styles.input} value={title} onChangeText={setTitle}
                />
                <TextInput
                    placeholder="Description" placeholderTextColor="#aaa"
                    multiline style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription}
                />
                <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
                    <Text style={styles.buttonText}>{submitting ? '...' : 'Publier'}</Text>
                </TouchableOpacity>
            </GlassCard>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#04060F', padding: 20 },
    header: { color: 'white', fontSize: 24, marginBottom: 20, marginTop: 40 },
    input: { borderBottomWidth: 1, borderBottomColor: '#05D9E833', color: 'white', padding: 15, marginBottom: 20 },
    textarea: { minHeight: 120, textAlignVertical: 'top' },
    button: { backgroundColor: '#FF2A6D', padding: 15, borderRadius: 10, alignItems: 'center' },
    buttonText: { color: 'white', fontWeight: 'bold' }
});