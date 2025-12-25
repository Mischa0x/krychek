export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
      <div className="prose prose-invert max-w-none space-y-6 text-spotify-lightgray">
        <section>
          <h2 className="text-xl font-bold text-white">Acceptance of Terms</h2>
          <p>By using this service, you agree to these terms. If you do not agree, please do not use the service.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white">Service Description</h2>
          <p>This service provides a visualization of your Spotify listening data using the official Spotify API.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white">User Responsibilities</h2>
          <ul className="list-disc list-inside ml-4">
            <li>You must have a valid Spotify account</li>
            <li>You are responsible for maintaining the security of your account</li>
            <li>You agree not to abuse the service or attempt to access data belonging to others</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white">Limitations</h2>
          <p>This service is provided as-is without warranty. We are not responsible for any inaccuracies in the data displayed, as it is fetched directly from Spotify.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white">Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
        </section>
      </div>
    </div>
  );
}
