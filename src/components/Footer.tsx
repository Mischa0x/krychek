import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-spotify-black border-t border-spotify-gray py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-spotify-lightgray text-sm">
            Powered by Spotify API
          </div>
          <div className="flex space-x-6 text-sm">
            <Link href="/privacy" className="text-spotify-lightgray hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-spotify-lightgray hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
