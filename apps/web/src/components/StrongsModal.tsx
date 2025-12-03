'use client';

import { useState, useEffect } from 'react';

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
  const [crossRefs, setCrossRefs] = useState<CrossReference[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch cross-references when modal opens
    setLoading(true);
    fetch(`/api/bible/cross-references?book=${encodeURIComponent(bookName)}&chapter=${chapter}&verse=${verse}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCrossRefs(data.references || []);
        }
      })
      .catch(err => console.error('Failed to load cross-references:', err))
      .finally(() => setLoading(false));
  }, [bookName, chapter, verse]);

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
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  🚧 Strong's concordance data coming soon! This will include the original Greek/Hebrew word, transliteration, pronunciation, and definition.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Word Analysis</h4>
                  <p className="text-gray-600 dark:text-gray-400">Selected word: <span className="font-medium text-gray-900 dark:text-white">{word}</span></p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Future Features</h4>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-sm">
                    <li>Strong's Number (e.g., G746, H1234)</li>
                    <li>Original Language Text</li>
                    <li>Transliteration & Pronunciation</li>
                    <li>Complete Definition</li>
                    <li>Other Occurrences in Scripture</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {loading ? (
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
                    Showing {crossRefs.length} related verses (ordered by relevance)
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
                        {ref.verse_text || 'Loading verse text...'}
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