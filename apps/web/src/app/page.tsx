import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white">
            The Way
          </h1>
          <p className="text-2xl text-gold-300 font-semibold">
            Faith-Centered Bible Study & Community
          </p>
          <p className="text-lg text-purple-100 max-w-xl mx-auto">
            Study God's Word with powerful tools, connect with believers, and grow in your faith journey.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/read"
            className="px-8 py-4 bg-gold-500 hover:bg-gold-600 text-gray-900 font-bold rounded-lg shadow-lg transition-all transform hover:scale-105"
          >
            Start Reading
          </Link>
          <Link
            href="/api/test"
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border-2 border-white/30 transition-all"
          >
            Test API
          </Link>
        </div>

        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-white/90">
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold text-gold-400">24,570</div>
            <div className="text-sm">Bible Verses</div>
          </div>
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold text-gold-400">66</div>
            <div className="text-sm">Books</div>
          </div>
          <div className="p-6 bg-white/10 rounded-lg backdrop-blur-sm">
            <div className="text-3xl font-bold text-gold-400">KJV</div>
            <div className="text-sm">Translation</div>
          </div>
        </div>
      </div>
    </main>
  );
}
