import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-purple-dark via-brand-purple to-brand-purple-light flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white drop-shadow-lg">The Way</h1>
          <p className="text-2xl text-brand-gold font-semibold">Faith-Centered Bible Study & Community</p>
          <p className="text-lg text-purple-100 max-w-xl mx-auto">
            Study God's Word with powerful tools, connect with believers, and grow in your walk with Christ.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/read" className="px-8 py-3 bg-brand-gold text-brand-purple-darker font-bold rounded-full hover:bg-white hover:scale-105 transition-all shadow-lg w-full sm:w-auto">
            Start Reading
          </Link>
          <Link href="/auth/signin" className="px-8 py-3 border-2 border-white/30 text-white font-semibold rounded-full hover:bg-white/10 transition-all w-full sm:w-auto">
            Sign In
          </Link>
        </div>
      </div>
    </main>
  );
}
