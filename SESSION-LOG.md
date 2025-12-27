# Spotify Stats App - Session Log
**Deployed:** https://mischa0x.com/krychek

---

## 2025-12-27: Krychek Profile Page

### Changes
- Replaced home page with personalized "Krychek's Top Songs 2025" profile
- Added embedded Spotify playlist (100 tracks playable)
- Added personality profile based on music taste analysis:
  - Deep focus thinker (ambient/electronic for complex work)
  - Digs deep not wide (obscure artists, active hunting)
  - Has layers (aggression under the ambient, Hall & Oates for levity)
  - European electronic sensibility
  - Late night person (2am music)
- Added top 30 track list with visual display
- Created `/krychek` route (unused, home page has content)

### Files Modified
- `src/app/page.tsx` - Complete rewrite with profile content
- `src/app/krychek/page.tsx` - New (duplicate, can be removed)

---

## 2025-12-25: Initial Build

## What was built
- Next.js 14 App Router with TypeScript
- NextAuth with Spotify OAuth (token refresh)
- Scopes: user-top-read, user-read-recently-played, user-read-currently-playing
- IP-based rate limiting
- Admin dashboard (email whitelist)
- Tailwind CSS with Spotify theme

## Pages
- `/krychek` - Home
- `/krychek/top` - Top tracks/artists
- `/krychek/recent` - Recently played
- `/krychek/now` - Now playing
- `/krychek/admin` - Admin (protected)
- `/krychek/privacy` - Privacy policy
- `/krychek/terms` - Terms of service

## API Routes
- `/krychek/api/spotify/top`
- `/krychek/api/spotify/recent`
- `/krychek/api/spotify/now`

## Key Files
- `src/app/api/auth/[...nextauth]/options.ts` - Auth config
- `src/components/Providers.tsx` - SessionProvider with basePath
- `ecosystem.config.js` - PM2 config (port 3003)
- `nginx.conf` - Nginx proxy config
- `.env.local` - Environment variables (not committed)

## Configuration Notes
- basePath: `/krychek` in next.config.js
- NEXTAUTH_URL: `https://mischa0x.com/krychek/api/auth`
- SessionProvider basePath: `/krychek/api/auth`
- PM2 process: `spotify-stats` on port 3003
- Nginx location block for `/krychek` proxies to 3003

## Spotify Dashboard Settings
- Redirect URI: `https://mischa0x.com/krychek/api/auth/callback/spotify`
