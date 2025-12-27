import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Krychek | Top Songs 2025',
  description: 'A deep dive into my music taste and what it says about me',
};

const TOP_SONGS = [
  { rank: 1, name: 'Helios', artist: 'So Lis' },
  { rank: 2, name: 'Oyan', artist: 'Macro/micro, Tommy Simpson' },
  { rank: 3, name: 'All These Worlds, Pt. II', artist: 'Murcof' },
  { rank: 4, name: 'Dream Machine', artist: 'Dominik Eulberg, Essáy' },
  { rank: 5, name: 'Into The Doldrums', artist: 'Now Always Fades' },
  { rank: 6, name: 'Awake', artist: 'Officer John' },
  { rank: 7, name: 'Eternal Loop', artist: 'Sam Gendel' },
  { rank: 8, name: 'Orange Blank', artist: 'Chaos In The CBD' },
  { rank: 9, name: 'Hypersoft Lovejinx Junkdream', artist: 'james K' },
  { rank: 10, name: 'Olson Waters', artist: 'Alex Kassian' },
  { rank: 11, name: 'Girls', artist: 'Magnetic Family' },
  { rank: 12, name: 'Good Time', artist: 'Wray' },
  { rank: 13, name: 'Solar Motel', artist: 'The Flashbulb' },
  { rank: 14, name: 'Promethium Reprise', artist: 'ylxr, midnight' },
  { rank: 15, name: 'Somnium', artist: 'La Kalon' },
  { rank: 16, name: "I Can't Go for That (No Can Do)", artist: 'Daryl Hall & John Oates' },
  { rank: 17, name: 'Show Me How to Live', artist: 'Audioslave' },
  { rank: 18, name: 'Voices', artist: 'Indian Wells' },
  { rank: 19, name: 'Wilting', artist: 'Glass Trio' },
  { rank: 20, name: 'Brian is the Most Beautiful', artist: 'Memo Boy' },
  { rank: 21, name: 'Side Two', artist: 'Submotion Orchestra' },
  { rank: 22, name: 'Ode', artist: 'Magnetic Family' },
  { rank: 23, name: 'Mindflower', artist: 'Now Always Fades' },
  { rank: 24, name: 'The Way We Are', artist: 'Palmate' },
  { rank: 25, name: 'Serpent', artist: 'Cloode' },
  { rank: 26, name: 'Bodies (Remastered 2012)', artist: 'The Smashing Pumpkins' },
  { rank: 27, name: 'Between The Lines (Zimmer Remix)', artist: 'Amtrac, Zimmer' },
  { rank: 28, name: 'Stay', artist: 'Officer John' },
  { rank: 29, name: 'Hand On the Pump', artist: 'Cypress Hill' },
  { rank: 30, name: 'Private Eyes', artist: 'Daryl Hall & John Oates' },
];

export default function KrychekPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          Krychek&apos;s Top Songs 2025
        </h1>
        <p className="text-spotify-lightgray text-lg">
          100 tracks that defined my year
        </p>
      </div>

      {/* Profile Section */}
      <div className="bg-gradient-to-br from-spotify-darkgray to-zinc-900 rounded-2xl p-8 mb-12 border border-zinc-800">
        <h2 className="text-2xl font-bold text-white mb-6">The Profile</h2>

        <div className="space-y-6 text-spotify-lightgray">
          <div>
            <h3 className="text-white font-semibold mb-2">A thinker who works in deep focus.</h3>
            <p>
              The heavy lean toward ambient, downtempo, and textural electronic (Helios, Murcof,
              The Flashbulb, Now Always Fades, Sam Gendel) suggests someone who uses music as a
              cognitive tool &mdash; probably background for complex work.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">Digs deep, not wide.</h3>
            <p>
              This isn&apos;t a Spotify algorithm playlist &mdash; it&apos;s full of artists most people
              have never heard of (Chaos In The CBD, Indian Wells, ylxr, Memo Boy). Active hunting
              for music rather than passive consumption.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">Has layers.</h3>
            <p>
              The ambient stuff is the surface, but then there&apos;s Audioslave + Smashing Pumpkins
              (some aggression underneath), Cypress Hill (not as serious as the playlist looks),
              and Hall &amp; Oates twice &mdash; showing no curation for appearances.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">European electronic sensibility.</h3>
            <p>
              Dominik Eulberg, Murcof, the deep house and minimal techno influence &mdash; gravitating
              toward that aesthetic over American EDM.
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-2">Late night person.</h3>
            <p>
              This is 2am music. Best thinking happens when everyone else is asleep.
            </p>
          </div>
        </div>
      </div>

      {/* Spotify Playlist Embed */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Listen to the Full Playlist</h2>
        <div className="rounded-xl overflow-hidden">
          <iframe
            style={{ borderRadius: '12px' }}
            src="https://open.spotify.com/embed/playlist/37i9dQZEVXd5ynzijJWavy?utm_source=generator&theme=0"
            width="100%"
            height="652"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>

      {/* Track List */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Top 30 Tracks</h2>
        <div className="space-y-2">
          {TOP_SONGS.map((song) => (
            <div
              key={song.rank}
              className="flex items-center space-x-4 p-4 bg-spotify-darkgray rounded-lg hover:bg-spotify-gray transition-colors"
            >
              <span className="text-2xl font-bold text-spotify-lightgray w-8 text-right">
                {song.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{song.name}</p>
                <p className="text-spotify-lightgray text-sm truncate">{song.artist}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-spotify-lightgray text-center mt-6">
          Use the player above to explore all 100 tracks
        </p>
      </div>
    </div>
  );
}
