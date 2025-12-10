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
  const [strongsData, setStrongsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStrongs, setLoadingStrongs] = useState(false);

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

    // Fetch Strong's data
    setLoadingStrongs(true);
    fetch(`/api/bible/strongs?book=${encodeURIComponent(bookName)}&chapter=${chapter}&verse=${verse}&word=${encodeURIComponent(word)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStrongsData(data.data);
        }
      })
      .catch(err => console.error('Failed to load Strong\'s data:', err))
      .finally(() => setLoadingStrongs(false));
  }, [bookName, chapter, verse, word]);

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
                  <p className="mt-2 text-gray-600 dark:text-gray-400">Loading Strong's data...</p>
                </div>
              ) : strongsData ? (
                <div className="space-y-6">
                  {/* Original Word Card */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div>
                         <span className="inline-block bg-brand-purple/10 text-brand-purple text-xs font-bold px-2 py-1 rounded mb-2">
                           {strongsData.strongsId}
                         </span>
                         <h2 className="text-3xl font-serif text-gray-900 dark:text-white mb-1">
                           {strongsData.lemma}
                         </h2>
                         <p className="text-lg text-gray-600 dark:text-gray-300 font-medium font-serif">
                           {strongsData.xlit}
                         </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Pronunciation</p>
                        <p className="font-mono text-gray-700 dark:text-gray-200">{strongsData.pron}</p>
                      </div>
                    </div>
                  </div>

                  {/* Definitions */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5 text-brand-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Definition
                      </h4>
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                        {strongsData.strongs_def}
                      </div>
                    </div>

                     {/* Derivation */}
                     {strongsData.derivation && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">Derivation</h4>
                        <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                          {strongsData.derivation}
                        </p>
                      </div>
                    )}

                    {/* KJV Usage */}
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm uppercase tracking-wide opacity-70">
                        KJV Usage
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm border-l-4 border-brand-purple/30 pl-3">
                        {strongsData.kjv_def}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg inline-block">
                    <p>No Strong's data found for this word.</p>
                  </div>
                </div>
              )}
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