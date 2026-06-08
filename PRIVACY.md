# Privacy Policy for Macify

**Last updated: June 9, 2026**

Macify is a Chrome extension that replaces the new tab page with macOS-style
aerial screensaver videos, along with optional widgets such as a clock,
weather, and a "Zen" break reminder.

This policy explains exactly what data Macify touches, why, and where (if
anywhere) it goes. The short version:

> **Macify has no analytics, no tracking, no advertising, and no user
> accounts. It does not collect, sell, or share your personal information.
> Everything it stores stays on your device (or in your own Chrome account
> sync). The only data ever sent off your device is the minimum required to
> stream the videos you chose to watch and to show the weather for a city
> you typed in yourself.**

---

## What Macify accesses, and why

Macify requests only the permissions it actually uses. Here is each one and
the reason for it.

### `storage`
Your settings (chosen video source, widgets you enabled, city name, Zen
preferences, etc.) are saved using Chrome's `storage` API. This data lives in
`chrome.storage.local` on your device and, if you have Chrome Sync enabled, in
`chrome.storage.sync` — which is handled entirely by Google's sync
infrastructure under your own Google account. **Macify's developer never
receives or has access to this data.**

### `topSites`
Used to display your most-visited sites as shortcuts on the new tab page. This
information is read locally on your device and rendered on the page. **It is
never transmitted anywhere.** You can disable the shortcuts feature in
settings.

### `favicon`
Used to show the site icons next to those shortcuts, via Chrome's built-in
favicon service. This is a local browser API and involves no external request
from Macify.

### `idle`
Macify uses `chrome.idle.onStateChanged` to pause its built-in Zen break
reminder timer while the system is locked or idle. Without this, a locked
screen overnight or a long step-away would be counted as continuous work, and
the reminder would surface a misleading "you've been at the screen for 480
minutes" prompt the moment you return. **The idle state is read locally and
used only for this in-extension calculation — no idle data is stored,
transmitted, or shared with any server.**

---

## Data that leaves your device

Macify makes network requests only for the following features. Each is
optional and tied to a feature you actively use or enable.

### 1. Aerial videos (Apple's CDN, optionally via a reverse proxy)
The aerial videos are hosted by Apple at `sylvan.apple.com`. To play a video,
your browser requests the video file. By default these requests pass through a
reverse proxy operated by the developer (a Cloudflare Worker) for reliability;
you can turn the proxy off in settings to connect to Apple directly.

The proxy is a stateless "sanitize and forward" relay: it strips cookies and
tracking headers in both directions and **does not store the contents of your
requests**. As with any request to any web server, the server that ultimately
serves the video (Apple, and/or the proxy) necessarily sees your IP address
for the duration of the request. Macify does not attach any identifier to
these requests.

### 2. Weather and air quality (Open-Meteo)
If you enable the weather widget, you type in a **city name** (Macify does not
use GPS or automatic IP-based geolocation, and does not request the
`geolocation` permission). That city name is sent to
[Open-Meteo](https://open-meteo.com/) to look up its coordinates, and those
coordinates are then used to fetch the local forecast and air-quality data.
No API key, account, or personal identifier is involved. Open-Meteo's handling
of these requests is governed by their own
[privacy policy](https://open-meteo.com/en/terms). The resolved location and
forecast are cached locally on your device to reduce repeat requests.

### 3. Zen background music (optional)
If you enable background music in Zen mode, the audio files are fetched from an
endpoint operated by the developer. This is a plain media request; no personal
data is attached, and nothing about you is stored.

### 4. Translation (on-device)
The optional motto-translation feature uses Chrome's built-in
[Translator API](https://developer.chrome.com/docs/ai/translator-api), which
runs **entirely on your device**. The only network activity is a one-time
download of the translation model by Chrome itself. No text you see or
translate is ever sent to the developer.

---

## What Macify does NOT do

- It does **not** use any analytics, telemetry, crash reporting, or
  fingerprinting.
- It does **not** show ads.
- It does **not** require an account or ask you to log in.
- It does **not** collect or transmit your browsing history. (Your most-visited
  sites are read locally only to render shortcuts and never leave your device.)
- It does **not** sell or share your personal information with third parties.
- It does **not** use your data for any purpose unrelated to the single purpose
  of the extension.

---

## Data retention

Macify does not operate a server that stores your personal data. All settings
and caches live on your device (and in your own Chrome Sync account, if
enabled) and are removed when you uninstall the extension or clear its storage.

## Changes to this policy

If this policy changes, the updated version will be published at this same
location with a new "Last updated" date.

## Contact

Questions about this policy can be raised via the project's GitHub repository:
<https://github.com/jason5ng32/Macify> (open an issue).
