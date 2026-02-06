import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StrongsDefinition } from '../types/database';
import { getStrongsDefinition } from '../utils/bibleDb';

interface MobileStrongsModalProps {
  strongsId: string | null;
  word: string | null;
  visible: boolean;
  onClose: () => void;
}

export default function MobileStrongsModal({ strongsId, word, visible, onClose }: MobileStrongsModalProps) {
  const [definition, setDefinition] = useState<StrongsDefinition | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && strongsId) {
      loadDefinition();
    } else {
      setDefinition(null);
    }
  }, [visible, strongsId]);

  const loadDefinition = async () => {
    if (!strongsId) return;
    setLoading(true);
    try {
      const data = await getStrongsDefinition(strongsId);
      setDefinition(data);
    } catch (e) {
      console.error("Failed to load definition", e);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{word}</Text>
              <Text style={styles.subtitle}>{strongsId}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5b21b6" />
            </View>
          ) : definition ? (
            <ScrollView style={styles.body}>
              {/* Definition */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Definition</Text>
                <Text style={styles.text}>
                  {definition.definition || "No definition available."}
                </Text>
              </View>

              {/* Original Word */}
              {definition.original_word && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Original Word</Text>
                  <Text style={styles.text}>{definition.original_word}</Text>
                </View>
              )}

              {/* Pronunciation */}
              {definition.pronunciation && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pronunciation</Text>
                  <Text style={styles.text}>{definition.pronunciation}</Text>
                </View>
              )}
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Definition not found.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '60%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  body: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4b5563',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
});
