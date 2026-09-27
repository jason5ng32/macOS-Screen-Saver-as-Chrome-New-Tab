export const DEFAULTS = Object.freeze({
  userLanguage: 'auto',
  city: 'San Francisco',
  // Time display mode. 'off' hides time entirely; 'clock' is the
  // classic numeric clock; 'sky-arc' is the sun/moon trajectory chart
  // (requires a validated city for lat/lng). Replaces the older
  // boolean `showTime` — see migrateLegacyKeys() in storage.js.
  timeDisplay: 'clock',
  hourSystem: '24',
  showWeather: true,
  showMotto: true,
  showTopSites: true,
  showZenMode: true,
  videoSourceUrl: 'http://localhost:18000/videos/',
  refreshButton: true,
  tempUnit: 'celsius',
  authorInfo: true,
  videoSrc: 'apple',
  reverseProxy: true,
  shuffleScopes: ['all'],
  repeatCurrentVideo: false,
  showVideoMetadata: true,
  translateMotto: false,
  zenMusic: true,
  zenBreathingPattern: 'coherent', // 'off' | 'coherent' | 'box' | '478'
  zenReminderEnabled: false,
  zenReminderMinutes: 60,
  zenAutoExitEnabled: false,
  zenAutoExitMinutes: 15,
});

export const KNOWN_KEYS = Object.freeze(Object.keys(DEFAULTS));
