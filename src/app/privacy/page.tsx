export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Privacy Policy</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-spotify-lightgray">
        <section>
          <h2 className="text-xl font-bold text-white">Data We Collect</h2>
          <p>We access your Spotify account data through the Spotify API to display:</p>
          <ul className="list-disc list-inside ml-4">
            <li>Your top tracks and artists</li>
            <li>Your recently played tracks</li>
            <li>Your currently playing track</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white">How We Use Your Data</h2>
          <p>Your data is used solely to display your listening statistics. We do not store your listening history or share your data with third parties.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white">Data Storage</h2>
          <p>We store only your session token to maintain your login. Your Spotify data is fetched in real-time and not permanently stored on our servers.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white">Your Rights</h2>
          <p>You can revoke access at any time through your Spotify account settings under Apps. This will immediately terminate our access to your data.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white">Contact</h2>
          <p>For privacy concerns, please contact us through our website.</p>
        </section>
      </div>
    </div>
  );
}
