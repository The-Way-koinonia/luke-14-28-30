'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import StrongsModal from '@/components/StrongsModal';

interface BibleVerse {
  id: number;
  translation: string;
  book_id: number;
  chapter: number;
  verse: number;
  text: string;
  book_name: string;
}

interface BibleBook {
  id: number;
  book_number: number;
  name: string;
  testament: string;
  chapters: number;
}

interface Highlight {
  verseId: number;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'orange';
}

interface Bookmark {
  bookId: number;
  chapter: number;
  verse: number;
  bookName: string;
}

interface ModalState {
  isOpen: boolean;
  word: string;
  bookName: string;
  chapter: number;
  verse: number;
}

export default function BibleReader() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<number>(43);
  const [selectedChapter, setSelectedChapter] = useState<number>(3);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  // Highlighting & Bookmarks (stored in localStorage)
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [copiedVerse, setCopiedVerse] = useState<number | null>(null);

  // Modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    word: '',
    bookName: '',
    chapter: 0,
    verse: 0
  });

  // Load highlights and bookmarks from localStorage
  useEffect(() => {
    const savedHighlights = localStorage.getItem('bible-highlights');
    const savedBookmarks = localStorage.getItem('bible-bookmarks');
    const savedDarkMode = localStorage.getItem('dark-mode');

    if (savedHighlights) setHighlights(JSON.parse(savedHighlights));
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
  }, []);

  // Save highlights to localStorage
  useEffect(() => {
    localStorage.setItem('bible-highlights', JSON.stringify(highlights));
  }, [highlights]);

  // Save bookmarks to localStorage
  useEffect(() => {
    localStorage.setItem('bible-bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('dark-mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Fetch all books on mount
  useEffect(() => {
    fetch('/api/bible/books')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setBooks(data.data);
        }
      })
      .catch(err => console.error('Failed to load books:', err));
  }, []);

  // Fetch verses when book or chapter changes
  useEffect(() => {
    if (!selectedBook || !selectedChapter) return;

    setLoading(true);
    setError(null);
    setSelectedVerses(new Set());

    fetch(`/api/bible/verses?bookId=${selectedBook}&chapter=${selectedChapter}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.verses) {
          setVerses(data.verses);
        } else {
          setError(data.error || 'Failed to load verses');
        }
      })
      .catch(err => {
        setError('Failed to load verses');
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [selectedBook, selectedChapter]);

  const currentBook = books.find(b => b.id === selectedBook);
  const maxChapters = currentBook?.chapters || 1;

  const handlePreviousChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else if (selectedBook > 1) {
      const prevBook = books.find(b => b.id === selectedBook - 1);
      if (prevBook) {
        setSelectedBook(prevBook.id);
        setSelectedChapter(prevBook.chapters);
      }
    }
  };

  const handleNextChapter = () => {
    if (selectedChapter < maxChapters) {
      setSelectedChapter(selectedChapter + 1);
    } else if (selectedBook < 66) {
      const nextBook = books.find(b => b.id === selectedBook + 1);
      if (nextBook) {
        setSelectedBook(nextBook.id);
        setSelectedChapter(1);
      }
    }
  };

  // Verse selection
  const toggleVerseSelection = (verseId: number) => {
    const newSelected = new Set(selectedVerses);
    if (newSelected.has(verseId)) {
      newSelected.delete(verseId);
    } else {
      newSelected.add(verseId);
    }
    setSelectedVerses(newSelected);
  };

  // Highlighting
  const addHighlight = (color: Highlight['color']) => {
    const newHighlights = [...highlights];
    selectedVerses.forEach(verseId => {
      const existingIndex = newHighlights.findIndex(h => h.verseId === verseId);
      if (existingIndex >= 0) {
        newHighlights[existingIndex].color = color;
      } else {
        newHighlights.push({ verseId, color });
      }
    });
    setHighlights(newHighlights);
    setSelectedVerses(new Set());
  };

  const removeHighlight = (verseId: number) => {
    setHighlights(highlights.filter(h => h.verseId !== verseId));
  };

  const getHighlightColor = (verseId: number): string | null => {
    const highlight = highlights.find(h => h.verseId === verseId);
    if (!highlight) return null;

    const colors = {
      yellow: 'bg-yellow-200 dark:bg-yellow-900/30',
      green: 'bg-green-200 dark:bg-green-900/30',
      blue: 'bg-blue-200 dark:bg-blue-900/30',
      pink: 'bg-pink-200 dark:bg-pink-900/30',
      orange: 'bg-orange-200 dark:bg-orange-900/30',
    };
    return colors[highlight.color];
  };

  // Bookmarks
  const toggleBookmark = (verse: BibleVerse) => {
    const existingIndex = bookmarks.findIndex(
      b => b.bookId === verse.book_id && b.chapter === verse.chapter && b.verse === verse.verse
    );

    if (existingIndex >= 0) {
      setBookmarks(bookmarks.filter((_, i) => i !== existingIndex));
    } else {
      setBookmarks([...bookmarks, {
        bookId: verse.book_id,
        chapter: verse.chapter,
        verse: verse.verse,
        bookName: verse.book_name
      }]);
    }
  };

  const isBookmarked = (verse: BibleVerse): boolean => {
    return bookmarks.some(
      b => b.bookId === verse.book_id && b.chapter === verse.chapter && b.verse === verse.verse
    );
  };

  const goToBookmark = (bookmark: Bookmark) => {
    setSelectedBook(bookmark.bookId);
    setSelectedChapter(bookmark.chapter);
    setShowBookmarks(false);
  };

  // Copy to clipboard
  const copyVerse = (verse: BibleVerse) => {
    const text = `${verse.book_name} ${verse.chapter}:${verse.verse} - ${verse.text} (KJV)`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedVerse(verse.id);
      setTimeout(() => setCopiedVerse(null), 2000);
    });
  };

  // Share verse
  const shareVerse = (verse: BibleVerse) => {
    const text = `${verse.book_name} ${verse.chapter}:${verse.verse} - ${verse.text} (KJV)`;

    if (navigator.share) {
      navigator.share({
        title: `${verse.book_name} ${verse.chapter}:${verse.verse}`,
        text: text,
      }).catch(err => console.log('Share failed:', err));
    } else {
      copyVerse(verse);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    setShowMenu(false);
    router.push('/');
  };

  // Handle word click
  const handleWordClick = (word: string, verse: BibleVerse) => {
    // Remove punctuation from word
    const cleanWord = word.replace(/[.,;:!?'"()[\]{}]/g, '');
    
    setModalState({
      isOpen: true,
      word: cleanWord,
      bookName: verse.book_name,
      chapter: verse.chapter,
      verse: verse.verse
    });
  };

  // Render verse with clickable words
  const renderVerseText = (verse: BibleVerse) => {
    const words = verse.text.split(' ');
    
    return (
      <p className="bible-text text-text-primary flex-1">
        {words.map((word, index) => (
          <span key={index}>
            <span
              onClick={() => handleWordClick(word, verse)}
              className="cursor-pointer hover:text-brand-purple hover:underline transition-colors"
            >
              {word}
            </span>
            {index < words.length - 1 && ' '}
          </span>
        ))}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Strong's Modal */}
      {modalState.isOpen && (
        <StrongsModal
          word={modalState.word}
          bookName={modalState.bookName}
          chapter={modalState.chapter}
          verse={modalState.verse}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
        />
      )}

      {/* Header */}
      <header className="bg-gradient-radiant shadow-lg border-b border-border-dark sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Menu Button */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {status === 'authenticated' ? (
                    <>
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {session?.user?.name || session?.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          router.push('/profile');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Profile
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          router.push('/signin');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          router.push('/signup');
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Center: Title */}
            <div>
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">The Way</h1>
              <p className="text-xs text-white/90 mt-0.5">Bible Study & Social Network</p>
            </div>

            {/* Right: Bookmarks & Dark Mode */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBookmarks(!showBookmarks)}
                className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Bookmarks"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                {bookmarks.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-gold text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {bookmarks.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                aria-label="Toggle dark mode"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Bookmarks Sidebar */}
      {showBookmarks && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowBookmarks(false)}>
          <div
            className="fixed right-0 top-0 h-full w-80 bg-bg-tertiary shadow-2xl p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-text-primary">Bookmarks</h3>
              <button
                onClick={() => setShowBookmarks(false)}
                className="text-text-tertiary hover:text-text-primary"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {bookmarks.length === 0 ? (
              <p className="text-text-tertiary text-center py-8">No bookmarks yet</p>
            ) : (
              <div className="space-y-2">
                {bookmarks.map((bookmark, index) => (
                  <button
                    key={index}
                    onClick={() => goToBookmark(bookmark)}
                    className="w-full text-left p-3 rounded-lg bg-bg-secondary hover:bg-border-light transition-colors"
                  >
                    <p className="font-medium text-text-primary">
                      {bookmark.bookName} {bookmark.chapter}:{bookmark.verse}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Highlight Toolbar */}
        {selectedVerses.size > 0 && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-bg-elevated border border-border shadow-xl rounded-lg p-4 z-30">
            <p className="text-sm text-text-secondary mb-3">
              {selectedVerses.size} verse{selectedVerses.size > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => addHighlight('yellow')}
                className="w-8 h-8 rounded-full bg-yellow-300 hover:ring-2 ring-yellow-500"
                aria-label="Yellow highlight"
              />
              <button
                onClick={() => addHighlight('green')}
                className="w-8 h-8 rounded-full bg-green-300 hover:ring-2 ring-green-500"
                aria-label="Green highlight"
              />
              <button
                onClick={() => addHighlight('blue')}
                className="w-8 h-8 rounded-full bg-blue-300 hover:ring-2 ring-blue-500"
                aria-label="Blue highlight"
              />
              <button
                onClick={() => addHighlight('pink')}
                className="w-8 h-8 rounded-full bg-pink-300 hover:ring-2 ring-pink-500"
                aria-label="Pink highlight"
              />
              <button
                onClick={() => addHighlight('orange')}
                className="w-8 h-8 rounded-full bg-orange-300 hover:ring-2 ring-orange-500"
                aria-label="Orange highlight"
              />
              <button
                onClick={() => setSelectedVerses(new Set())}
                className="ml-2 px-3 py-1 bg-bg-secondary text-text-primary rounded hover:bg-border-light text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Navigation Controls */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Book</label>
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(parseInt(e.target.value));
                  setSelectedChapter(1);
                }}
                className="input"
              >
                {books.filter(b => b.testament === 'OT').length > 0 && (
                  <optgroup label="Old Testament">
                    {books.filter(b => b.testament === 'OT').map(book => (
                      <option key={book.id} value={book.id}>{book.name}</option>
                    ))}
                  </optgroup>
                )}
                {books.filter(b => b.testament === 'NT').length > 0 && (
                  <optgroup label="New Testament">
                    {books.filter(b => b.testament === 'NT').map(book => (
                      <option key={book.id} value={book.id}>{book.name}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Chapter</label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(parseInt(e.target.value))}
                className="input"
              >
                {Array.from({ length: maxChapters }, (_, i) => i + 1).map(ch => (
                  <option key={ch} value={ch}>Chapter {ch}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Navigate</label>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousChapter}
                  disabled={selectedBook === 1 && selectedChapter === 1}
                  className="flex-1 px-4 py-2 bg-bg-secondary text-text-primary rounded-md hover:bg-border-light disabled:opacity-50 disabled:cursor-not-allowed font-medium border border-border"
                >
                  ← Prev
                </button>
                <button
                  onClick={handleNextChapter}
                  disabled={selectedBook === 66 && selectedChapter === maxChapters}
                  className="btn-primary flex-1"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Title */}
        <div className="mb-6">
          <h2 className="text-4xl font-bold text-text-primary">
            {currentBook?.name} {selectedChapter}
          </h2>
          <p className="text-text-secondary mt-1 flex items-center gap-2">
            <span>King James Version</span>
            <span className="text-brand-gold">•</span>
            <span>{verses.length} verses</span>
          </p>
        </div>

        {/* Verses Display */}
        <div className="card">
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
              <p className="mt-4 text-text-secondary">Loading verses...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && verses.length > 0 && (
            <div className="space-y-3">
              {verses.map((verse) => {
                const highlightColor = getHighlightColor(verse.id);
                const isSelected = selectedVerses.has(verse.id);
                const bookmarked = isBookmarked(verse);
                const copied = copiedVerse === verse.id;

                return (
                  <div
                    key={verse.id}
                    className={`flex gap-4 p-3 rounded-md transition-all group relative ${
                      highlightColor || ''
                    } ${
                      isSelected ? 'ring-2 ring-brand-purple' : ''
                    }`}
                  >
                    <span
                      className="verse-number mt-1 flex-shrink-0 group-hover:text-brand-gold transition-colors cursor-pointer"
                      onClick={() => toggleVerseSelection(verse.id)}
                    >
                      {verse.verse}
                    </span>
                    
                    {renderVerseText(verse)}

                    {/* Action buttons */}
                    <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      {/* Bookmark */}
                      <button
                        onClick={() => toggleBookmark(verse)}
                        className={`p-1.5 rounded hover:bg-bg-secondary transition-colors ${
                          bookmarked ? 'text-brand-gold' : 'text-text-tertiary'
                        }`}
                        aria-label="Bookmark"
                      >
                        <svg className="w-4 h-4" fill={bookmarked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>

                      {/* Copy */}
                      <button
                        onClick={() => copyVerse(verse)}
                        className="p-1.5 rounded hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-colors relative"
                        aria-label="Copy"
                      >
                        {copied ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>

                      {/* Share */}
                      <button
                        onClick={() => shareVerse(verse)}
                        className="p-1.5 rounded hover:bg-bg-secondary text-text-tertiary hover:text-text-primary transition-colors"
                        aria-label="Share"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>

                      {/* Remove highlight */}
                      {highlightColor && (
                        <button
                          onClick={() => removeHighlight(verse.id)}
                          className="p-1.5 rounded hover:bg-bg-secondary text-text-tertiary hover:text-red-500 transition-colors"
                          aria-label="Remove highlight"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-tertiary">
            Click verse numbers to select • Click words to study • Hover for actions
          </p>
        </div>
      </main>
    </div>
  );
}