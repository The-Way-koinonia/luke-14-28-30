'use client';

import { useSocialFeed } from '@the-way/social-engine';
import { WebSocialAdapter } from '@/lib/adapters/webSocialAdapter';
import { useEffect } from 'react';
import Link from 'next/link';

export default function WebFeed() {
  const { posts, loading, refresh, loadMore } = useSocialFeed(WebSocialAdapter);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-gray-500 hover:text-gray-900">
                    &larr; Back
                </Link>
                <h1 className="text-xl font-bold text-brand-purple">Community Feed</h1>
            </div>
            <button 
                onClick={refresh}
                className="p-2 text-gray-500 hover:text-brand-purple transition-colors"
            >
                Refresh
            </button>
        </div>
      </header>

      {/* Feed Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 space-y-4">
        {loading && posts.length === 0 && (
            <div className="text-center py-10 text-gray-500">Loading feed...</div>
        )}

        {posts.map((post) => (
          <article key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                    {post.user?.avatar_url && (
                        <img src={post.user.avatar_url} alt={post.user.username} className="w-full h-full object-cover" />
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900">{post.user?.username || 'Unknown User'}</h3>
                    <p className="text-xs text-gray-500">{new Date(post.created_at).toLocaleDateString()}</p>
                </div>
            </div>
            <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 border-t pt-3">
                <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                    <span>❤️</span> {post.likes_count}
                </button>
                <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                    <span>💬</span> {post.comments_count}
                </button>
            </div>
          </article>
        ))}

        {!loading && (
            <button 
                onClick={loadMore}
                className="w-full py-3 text-brand-purple font-medium hover:bg-purple-50 rounded-lg transition-colors"
            >
                Load More
            </button>
        )}
      </main>
    </div>
  );
}
