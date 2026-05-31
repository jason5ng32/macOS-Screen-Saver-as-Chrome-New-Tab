# Macify — Development Guide

For end users (install, configure video source, permissions), see [README.md](README.md).

This document covers building Macify from source, the optional batch video downloader, manual local-server setup for advanced users, and contributing.

## Building from source

Requirements: Node.js 20+ and npm.

The build is **not zero-config** — Macify needs a CDN you control for the Apple aerial reverse proxy and the zen-mode music. The published Chrome Store build uses my own infrastructure; if you fork, you bring your own. The build refuses to run without these set.

### 1. Stand up your CDN host

Pick a single hostname you control, sitting behind Cloudflare. The same hostname serves two paths:

| Path | Backed by |
|---|---|
| `<host>/itunes-assets/*` | A Cloudflare Worker (see [`cloudflare-worker/worker.js`](cloudflare-worker/worker.js)) reverse-proxying `sylvan.apple.com` |
| `<host>/music/musicNNNNN.mp3` | An R2 bucket containing 40 zen-mode music files (`music00001.mp3` … `music00040.mp3`) bound to the same hostname |

#### Worker setup

1. Cloudflare dashboard → Workers & Pages → Create Worker → paste [`cloudflare-worker/worker.js`](cloudflare-worker/worker.js) → Deploy.
2. Settings → Triggers → Add Custom Domain or Route → `<host>/itunes-assets/*`.

**Optional anti-abuse layer.** If you want to keep random callers off your worker, add a Cloudflare WAF rule:

- Security → WAF → Custom Rules → Create rule:
  - Match: `URI Path starts with "/itunes-assets/"` AND `URI Query String does not contain "k=<your-token>"`
  - Action: Block
- Generate the token with `openssl rand -hex 16` and set it as `VITE_APPLE_PROXY_KEY` (next section). The build appends `?k=<token>` to every video request.

Skip this if you don't care — the worker still works.

#### Music R2 bucket

1. Create an R2 bucket and bind it to your `<host>` as a custom domain.
2. Upload your 40 audio files as `music/music00001.mp3` … `music/music00040.mp3`. Macify itself doesn't ship music — pick anything calm and ambient (royalty-free or your own).

### 2. Set the build env

```bash
git clone https://github.com/jason5ng32/Macify.git
cd Macify
cp .env.example .env
# edit .env — fill in VITE_MACIFY_BASE (required)
# and VITE_APPLE_PROXY_KEY (only if you set up the WAF rule above)
pnpm install
pnpm run build
```

If `.env` is missing or incomplete the build aborts with a list of what's missing. See [`.env.example`](.env.example) for the full reference.

### 3. Load the extension

The built extension is in `dist/`. Chrome → `chrome://extensions` → Developer mode → "Load unpacked" → select `dist/`.

## Aerial video batch downloader

The downloader is exposed to end users via a one-line bash wrapper (see [README.md](README.md#first--download-the-videos)). For local development against an unmerged branch or to run it without `curl`-ing from GitHub, use the pnpm script:

```bash
# Interactive menu (default — pick full catalog / random N / by category)
pnpm run download:aerials

# Preview without writing files (counts, sizes, disk space, what's already present)
pnpm run download:aerials -- --dry-run

# Test with a small sample
pnpm run download:aerials -- --limit 5

# List available categories
pnpm run download:aerials -- --list-categories

# Filter by category
pnpm run download:aerials -- --category Landscapes,Cities

# Tune parallel download workers (default 3, max 8)
pnpm run download:aerials -- --parallel 3
```

Under the hood, both paths invoke `python3 -m aerial_downloader.main`. The bash wrapper at [`scripts/aerial_downloader/install.sh`](scripts/aerial_downloader/install.sh) just `curl`s the package's nine `.py` files into a temp dir before running them — no clone required.

The downloader reads the macOS manifest at `~/Library/Application Support/com.apple.wallpaper/aerials/manifest/entries.json` and saves videos to `~/Library/Application Support/com.apple.wallpaper/aerials/videos`. It uses Apple's UUID-based naming to match what macOS itself would have stored, so files already downloaded via System Settings are detected and skipped.

Skipping is content-aware: a file is skipped only when its size matches Apple's `Content-Length`; partial downloads resume from `.part` files using HTTP `Range` requests when supported.

Macify does not ship or mirror Apple's video files — this helper only downloads the URLs already listed in your local macOS manifest. The full catalog can be ~80–150 GB, so make sure you have free disk space (the dry-run reports the estimate).

Source lives under [`scripts/aerial_downloader/`](scripts/aerial_downloader/) — a small Python package with no third-party dependencies (stdlib only). When adding or removing a `.py` file, update the `FILES=()` array in `install.sh` in the same commit so the bash wrapper keeps fetching the right set.

## Local server — manual Apache setup

The recommended way to set up the local server is the one-line `setup.sh` from the README. Below is the equivalent manual flow if you prefer to inspect / edit the Apache config yourself.

Save the following as `videoserver.conf`, replacing `YOUR_MAC_USER_NAME` with your actual macOS username:

```apache
LoadModule headers_module libexec/apache2/mod_headers.so

User YOUR_MAC_USER_NAME
Group staff

Listen 18000

<VirtualHost *:18000>
    Header always set Access-Control-Allow-Origin "*"
    Alias /videos "/Users/YOUR_MAC_USER_NAME/Library/Application Support/com.apple.wallpaper/aerials/videos"

    <Directory "/Users/YOUR_MAC_USER_NAME/Library/Application Support/com.apple.wallpaper/aerials/videos">
        Options +Indexes
        Require all granted
    </Directory>
</VirtualHost>
```

Symlink it into Apache's drop-in folder, validate, and restart:

```bash
sudo ln -s /path/to/videoserver.conf /private/etc/apache2/other/macify.conf
sudo apachectl configtest
sudo apachectl stop && sudo apachectl start
```

Then in Macify's settings, set the source to **Local server** with URL `http://localhost:18000/videos/`.

## Project structure

```
src/                    Svelte / JS source
src/_locales/           Chrome extension translations (en, ja, zh_CN, zh_TW)
src/components/         Shared widgets (Clock, Weather, ZenReminderPill, etc.)
src/options/            Settings page (split into per-card sections)
src/popup/              Popup UI
src/lib/                Storage, video-source, weather, zen, etc.

scripts/                Build + helper scripts
scripts/build-quotes.mjs        Bundle the public-domain quotes set
scripts/build-videos.mjs        Snapshot the Aerial manifest
scripts/aerial_downloader/      Python batch downloader (see above)
scripts/local-server/           One-line setup + uninstall for the local Apache server

cloudflare-worker/      The reverse-proxy Worker that backs the default video source
```

## Contributing

PRs welcome — bug fixes, translations, new aerial-source adapters, performance improvements, accessibility fixes.

A few conventions:

- Keep code comments and frontmatter fields in English; prose in PR descriptions can be either language.
- Match the existing commit message style in `git log` — short imperative subject + a body when context helps reviewers (`why` more than `what`).
- For multi-step changes, run `pnpm run build` at least once before pushing.

## License

MIT. See [LICENSE](LICENSE).
