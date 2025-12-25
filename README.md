# mischa0x-spotify

A production-ready Next.js 14 application for viewing Spotify listening statistics. Features NextAuth authentication with Spotify provider, secure token refresh, admin panel, and full API rate limiting.

## Features

- **Spotify Authentication**: OAuth 2.0 with automatic token refresh
- **Top Tracks & Artists**: View your most played music over different time periods
- **Recently Played**: See your listening history
- **Now Playing**: Real-time currently playing track
- **Admin Panel**: Protected admin dashboard for authorized users
- **Rate Limiting**: IP-based rate limiting on all API routes
- **Security**: Refresh tokens never exposed to client, secure headers

## File Structure

```
mischa0x-spotify/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       ├── options.ts
│   │   │   │       └── route.ts
│   │   │   └── spotify/
│   │   │       ├── now/
│   │   │       │   └── route.ts
│   │   │       ├── recent/
│   │   │       │   └── route.ts
│   │   │       └── top/
│   │   │           └── route.ts
│   │   ├── admin/
│   │   │   └── page.tsx
│   │   ├── now/
│   │   │   └── page.tsx
│   │   ├── privacy/
│   │   │   └── page.tsx
│   │   ├── recent/
│   │   │   └── page.tsx
│   │   ├── terms/
│   │   │   └── page.tsx
│   │   ├── top/
│   │   │   └── page.tsx
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ArtistCard.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── Loading.tsx
│   │   ├── NowPlaying.tsx
│   │   ├── Providers.tsx
│   │   ├── TimeRangeSelector.tsx
│   │   └── TrackCard.tsx
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── rate-limit.ts
│   │   ├── spotify.ts
│   │   └── utils.ts
│   └── types/
│       ├── index.ts
│       └── next-auth.d.ts
├── .env.example
├── .eslintrc.json
├── .gitignore
├── ecosystem.config.js
├── next.config.js
├── nginx.conf
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Spotify Developer Account
- Domain with SSL (for production)

## Spotify App Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new application
3. Note your Client ID and Client Secret
4. Add redirect URIs:
   - Development: `http://127.0.0.1:3000/api/auth/callback/spotify`
   - Production: `https://mischa0x.com/api/auth/callback/spotify`

## Local Development

### 1. Clone and install dependencies

```bash
cd ~/dev/mischa0x-spotify
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Spotify OAuth
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# NextAuth
NEXTAUTH_SECRET=your_random_secret_at_least_32_characters
NEXTAUTH_URL=http://127.0.0.1:3000

# Admin emails (comma-separated)
ADMIN_EMAILS=your@email.com
```

Generate a secure NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

### 3. Run development server

```bash
npm run dev
```

Visit [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Production Deployment

### 1. Build the application

```bash
cd ~/dev/mischa0x-spotify
npm run build
```

### 2. Configure production environment

Create `.env.production.local`:

```env
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
NEXTAUTH_SECRET=your_production_secret
NEXTAUTH_URL=https://mischa0x.com
ADMIN_EMAILS=admin@example.com
```

### 3. Set up Nginx

```bash
# Copy nginx config
sudo cp nginx.conf /etc/nginx/sites-available/mischa0x-spotify

# Create symlink
sudo ln -s /etc/nginx/sites-available/mischa0x-spotify /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. Set up SSL with Certbot

```bash
sudo certbot --nginx -d mischa0x.com -d www.mischa0x.com
```

### 5. Start with PM2

```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### 6. Update Spotify redirect URI

In Spotify Developer Dashboard, add production redirect URI:
```
https://mischa0x.com/api/auth/callback/spotify
```

## API Routes

All API routes require authentication and include rate limiting.

### GET /api/spotify/top

Get top tracks or artists.

Query parameters:
- `type`: `tracks` or `artists` (default: `tracks`)
- `time_range`: `short_term`, `medium_term`, or `long_term` (default: `medium_term`)
- `limit`: 1-50 (default: 20)

### GET /api/spotify/recent

Get recently played tracks.

Query parameters:
- `limit`: 1-50 (default: 20)

### GET /api/spotify/now

Get currently playing track.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SPOTIFY_CLIENT_ID` | Spotify app client ID | Yes |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret | Yes |
| `NEXTAUTH_SECRET` | Random secret for session encryption | Yes |
| `NEXTAUTH_URL` | Base URL of the application | Yes |
| `ADMIN_EMAILS` | Comma-separated list of admin emails | Yes |

## Security Features

- **Token Security**: Refresh tokens are never exposed to the client
- **Automatic Token Refresh**: Access tokens are refreshed 5 minutes before expiry
- **Rate Limiting**: IP-based rate limiting on all API routes (30 req/min for data, 60 req/min for now playing)
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, CSP, etc.
- **Admin Protection**: Admin routes check user email against ADMIN_EMAILS

## PM2 Commands

```bash
# View logs
pm2 logs mischa0x-spotify

# Restart application
pm2 restart mischa0x-spotify

# Stop application
pm2 stop mischa0x-spotify

# View status
pm2 status

# Monitor
pm2 monit
```

## Troubleshooting

### "Invalid redirect URI" error
Ensure the redirect URI in Spotify Dashboard exactly matches:
- Dev: `http://127.0.0.1:3000/api/auth/callback/spotify`
- Prod: `https://mischa0x.com/api/auth/callback/spotify`

### Token refresh fails
Check that SPOTIFY_CLIENT_SECRET is correct and the app hasn't been deleted from Spotify Dashboard.

### Rate limit errors
Wait for the rate limit window to reset (shown in Retry-After header).

## License

MIT
