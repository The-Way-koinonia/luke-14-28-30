import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface VerseQuoteProps {
  reference: string; // e.g., "John 3:16"
  text: string;
}

export default function VerseQuote({ reference, text }: VerseQuoteProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bar} />
      <View style={styles.content}>
        <Text style={styles.text}>"{text}"</Text>
        <Text style={styles.reference}>- {reference}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bar: {
    width: 4,
    backgroundColor: Colors.light.brand.primary || '#6366f1',
  },
  content: {
    padding: 12,
    flex: 1,
  },
  text: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#374151',
    lineHeight: 24,
    marginBottom: 4,
  },
  reference: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'right',
  },
});
