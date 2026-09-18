import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export const GlassCard = ({ children, style }) => {
    if (Platform.OS === 'ios') {
        return (
            <BlurView intensity={24} tint="dark" style={[styles.card, style]}>
                {children}
            </BlurView>
        );
    }
    return (
        <View style={[styles.card, styles.androidFallback, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        padding: 20,
    },
    androidFallback: {
        backgroundColor: 'rgba(20, 25, 45, 0.8)',
    }
});
