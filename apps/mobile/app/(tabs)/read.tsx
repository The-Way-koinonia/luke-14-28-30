import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBooks, getChapterVerses } from '@/utils/bibleDb';
import { BibleBook, BibleVerse } from '@/types/database';
import MobileStrongsModal from '@/components/MobileStrongsModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

interface Highlight {
  verseId: number;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
}

export default function MobileBibleReader() {
  const router = useRouter();
  
  // State
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<number>(43); // Default to John
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStrongsId, setSelectedStrongsId] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    loadBooks();
    loadHighlights();
  }, []);

  useEffect(() => {
    loadVerses();
  }, [selectedBook, selectedChapter]);

  const loadBooks = async () => {
    try {
      const data = await getBooks();
      setBooks(data);
    } catch (e) {
      console.error("Failed to load books", e);
    }
  };

  const loadVerses = async () => {
    setLoading(true);
    try {
      const data = await getChapterVerses(selectedBook, selectedChapter);
      setVerses(data);
    } catch (e) {
      console.error("Failed to load verses", e);
    } finally {
      setLoading(false);
    }
  };

  const loadHighlights = async () => {
    const saved = await AsyncStorage.getItem('bible-highlights');
    if (saved) setHighlights(JSON.parse(saved));
  };

  const handleWordClick = (word: string, verse: BibleVerse, strongsId?: string) => {
    console.log("Clicked:", word, strongsId);
    if (strongsId) {
      setSelectedWord(word);
      setSelectedStrongsId(strongsId);
      setModalVisible(true);
    }
  };

  // XML Parser for Mobile
  const renderVerseText = (verse: BibleVerse) => {
    const parts = verse.text.split(/(<w[^>]*>.*?<\/w>)/g);

    return (
      <Text style={styles.verseText}>
        {parts.map((part, index) => {
          const uniqueKey = `${verse.id}-part-${index}`;
          
          if (part.startsWith('<w')) {
            const content = part.replace(/<[^>]+>/g, '');
            // Extract first Strong's ID found (matches "strong:G1234")
            const match = /strong:([GH]\d+)/.exec(part);
            const strongsId = match ? match[1] : undefined;

            return (
              <Text
                key={uniqueKey}
                style={styles.clickableWord}
                onPress={() => handleWordClick(content, verse, strongsId)}
              >
                {content}
              </Text>
            );
          }
          return <Text key={uniqueKey}>{part.replace(/<[^>]+>/g, '')}</Text>;
        })}
      </Text>
    );
  };

  // Render
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <LinearGradient
        colors={[Colors.light.brand.gold.DEFAULT, Colors.light.brand.purple.DEFAULT, Colors.light.brand.purple.dark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => {/* Logic to change book */}}>
             <Text style={styles.headerTitle}>
               {books.find(b => b.id === selectedBook)?.name || 'Loading...'} {selectedChapter}
             </Text>
             <Text style={styles.headerSubtitle}>King James Version</Text>
        </TouchableOpacity>
        
        <View style={styles.headerControls}>
           <TouchableOpacity onPress={() => setSelectedChapter(c => Math.max(1, c - 1))}>
             <Ionicons name="chevron-back" size={24} color="white" />
           </TouchableOpacity>
           <TouchableOpacity onPress={() => setSelectedChapter(c => c + 1)}>
             <Ionicons name="chevron-forward" size={24} color="white" />
           </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      {loading ? (
        <ActivityIndicator size="large" color="#d4a017" style={styles.loader} />
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {verses.map((verse, index) => (
            <View key={verse.id || index} style={styles.verseRow}>
              <Text style={styles.verseNumber}>
                {verse.verse}
              </Text>
              {renderVerseText(verse)}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Strong's Modal */}
      <MobileStrongsModal
        visible={modalVisible}
        word={selectedWord}
        strongsId={selectedStrongsId}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfbf7',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 50 : 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    // Background handled by LinearGradient
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginTop: 2,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 16,
  },
  loader: {
    marginTop: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontSize: 12,
    color: '#6b7280', // gray-500
    width: 24,
    paddingTop: 4,
    fontWeight: 'bold',
  },
  verseText: {
    fontSize: 18,
    color: '#1f2937', // gray-800
    lineHeight: 32,
    flex: 1,
  },
  clickableWord: {
    color: '#5b21b6', // brand-purple
  }
});
