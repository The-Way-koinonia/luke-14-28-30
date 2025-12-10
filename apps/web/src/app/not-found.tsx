import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <p className="mb-4 text-gray-600 dark:text-gray-400">Could not find requested resource</p>
      <Link 
        href="/"
        className="px-4 py-2 bg-brand-purple text-white rounded hover:bg-brand-purple/90 transition"
      >
        Return Home
      </Link>
    </div>
  );
}
