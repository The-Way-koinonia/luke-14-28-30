'use client';

import { useState, useEffect } from 'react';

// Define the shape of our Strong's data
interface StrongsDefinition {
  strongs_number: string;
  lemma: string;
  transliteration: string;
  pronunciation: string;
  definition: string;
}

interface CrossReference {
  to_book: string;
  to_chapter: number;
  to_verse_start: number;
  to_verse_end: number;
  votes: number;
  verse_text: string;
}

interface StrongsModalProps {
  word: string;
  bookName: string;
  chapter: number;
  verse: number;
  onClose: () => void;
}

export default function StrongsModal({ word, bookName, chapter, verse, onClose }: StrongsModalProps) {
  const [activeTab, setActiveTab] = useState<'strongs' | 'cross-refs'>('strongs');
  
  // Cross References State
  const [crossRefs, setCrossRefs] = useState<CrossReference[]>([]);
  const [loadingCrossRefs, setLoadingCrossRefs] = useState(false);

  // Strong's Data State
  const [strongsData, setStrongsData] = useState<StrongsDefinition | null>(null);
  const [loadingStrongs, setLoadingStrongs] = useState(false);

  // 1. Fetch Cross References
  useEffect(() => {
    setLoadingCrossRefs(true);
    fetch(`/api/bible/cross-references?book=${encodeURIComponent(bookName)}&chapter=${chapter}&verse=${verse}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCrossRefs(data.references || []);
        }
      })
      .catch(err => console.error('Failed to load cross-references:', err))
      .finally(() => setLoadingCrossRefs(false));
  }, [bookName, chapter, verse]);

  // 2. Fetch Strong's Data
  useEffect(() => {
    if (activeTab === 'strongs' && !strongsData) {
      setLoadingStrongs(true);
      const cleanWord = word.replace(/[.,;:!?'"()[\]{}]/g, '');
      
      fetch(`/api/bible/strongs?book=${encodeURIComponent(bookName)}&chapter=${chapter}&verse=${verse}&word=${encodeURIComponent(cleanWord)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setStrongsData(data.data);
          }
        })
        .catch(err => console.error('Failed to load Strongs data:', err))
        .finally(() => setLoadingStrongs(false));
    }
  }, [activeTab, bookName, chapter, verse, word, strongsData]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-radiant p-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">"{word}"</h3>
            <p className="text-sm text-white/90">{bookName} {chapter}:{verse}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('strongs')}
            className={`flex-1 py-3 px-4 font-medium transition ${
              activeTab === 'strongs'
                ? 'text-brand-purple border-b-2 border-brand-purple'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Strong's Concordance
          </button>
          <button
            onClick={() => setActiveTab('cross-refs')}
            className={`flex-1 py-3 px-4 font-medium transition ${
              activeTab === 'cross-refs'
                ? 'text-brand-purple border-b-2 border-brand-purple'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Cross References ({crossRefs.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'strongs' ? (
            <div>
              {loadingStrongs ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Searching dictionary...</p>
                </div>
              ) : strongsData ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4">
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      ℹ️ <strong>Note:</strong> Showing dictionary entry for <strong>"{word.replace(/[.,;:!?]/g, '')}"</strong>.
                    </p>
                  </div>

                  {/* Word Header */}
                  <div className="flex items-baseline gap-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-3xl font-bold text-brand-purple">{strongsData.lemma}</h2>
                    <div className="flex flex-col">
                      <span className="text-lg text-gray-600 dark:text-gray-300 font-serif italic">
                        {strongsData.transliteration}
                      </span>
                      <span className="text-xs text-gray-400">{strongsData.pronunciation}</span>
                    </div>
                    <span className="ml-auto text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 font-mono">
                      {strongsData.strongs_number}
                    </span>
                  </div>

                  {/* Definition */}
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                      Definition
                    </h4>
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-lg">
                      {strongsData.definition}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-gray-500 mb-2">Definition not found.</p>
                  <p className="text-xs text-gray-400">Try selecting a root word.</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              {loadingCrossRefs ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading cross-references...</p>
                </div>
              ) : crossRefs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">No cross-references found for this verse.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Showing {crossRefs.length} related verses
                  </p>
                  {crossRefs.map((ref, index) => (
                    <div 
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-brand-purple">
                          {ref.to_book} {ref.to_chapter}:{ref.to_verse_start}
                          {ref.to_verse_end !== ref.to_verse_start && `-${ref.to_verse_end}`}
                        </h5>
                        <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {ref.votes} votes
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">
                        {ref.verse_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}