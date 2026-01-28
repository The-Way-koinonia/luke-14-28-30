import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAdminSession } from '../hooks/useAdminSession';
import { Ionicons } from '@expo/vector-icons';

export const AdminSessionTimer = () => {
    const { session, loading, requestAccess } = useAdminSession();

    if (loading) {
        return <ActivityIndicator size="small" color="#666" />;
    }

    if (session?.isActive) {
        return (
            <View style={[styles.container, styles.activeContainer]}>
                <Ionicons name="shield-checkmark" size={16} color="#fff" />
                <Text style={styles.activeText}>Admin Active</Text>
                <View style={styles.timerBadge}>
                    <Text style={styles.timerText}>{session.timeLeft}</Text>
                </View>
            </View>
        );
    }

    return (
        <TouchableOpacity style={styles.container} onPress={requestAccess}>
            <Ionicons name="shield-half-outline" size={16} color="#666" />
            <Text style={styles.inactiveText}>Request Admin Access</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        gap: 8,
        alignSelf: 'flex-start',
    },
    activeContainer: {
        backgroundColor: '#4CAF50', // Green for active
    },
    activeText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
    inactiveText: {
        color: '#666',
        fontSize: 12,
        fontWeight: '500',
    },
    timerBadge: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    timerText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    }
});
