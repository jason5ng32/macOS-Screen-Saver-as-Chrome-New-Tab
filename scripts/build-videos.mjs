/**
 * Rebuild src/data/videos.json from the local macOS aerial manifest.
 *
 * macOS 14+ keeps the authoritative aerial-screensaver catalog at
 *   ~/Library/Application Support/com.apple.wallpaper/aerials/manifest/entries.json
 * (with a static fallback inside the system framework).
 *
 * That file contains 4K SDR 240fps URLs for each video, plus rich
 * metadata (location label, top-level category, subcategory).
 * This script extracts what we need and writes it to a project-local
 * JSON we can bundle into the extension.
 *
 * Usage: pnpm run build:videos
 *
 * Note: URLs are at sylvan.apple.com/itunes-assets/Aerials<N>/v4/...,
 * a different path than the legacy /Videos/comp_<...>.mov set. The
 * reverse proxy Worker must be updated to also handle /itunes-assets/
 * paths before the new URLs work in proxy mode.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const USER_MANIFEST = path.join(
  os.homedir(),
  'Library/Application Support/com.apple.wallpaper/aerials/manifest/entries.json',
);
const SYSTEM_MANIFEST =
  '/System/Library/PrivateFrameworks/WallpaperAerialAssets.framework/Versions/A/Resources/entries.json';

// Apple bundles all locales into a single .loctable (binary plist) under the
// translations bundle alongside entries.json. We decode it via `plutil` (macOS
// only) and project just the locales we ship.
const LOCTABLE = path.join(
  os.homedir(),
  'Library/Application Support/com.apple.wallpaper/aerials/manifest/TVIdleScreenStrings.bundle/Contents/Resources/Localizable.nocache.loctable',
);

// Source of truth for shipped locales is the _locales directory. Reading it
// here avoids drift with i18n.svelte.js, which derives the same list at
// runtime via `import.meta.glob`.
const LOCALES_DIR = path.join(repoRoot, 'src/_locales');
const LOCALES = fs
  .readdirSync(LOCALES_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

const OUT_PATH = path.join(repoRoot, 'src/data/videos.json');
const I18N_OUT_PATH = path.join(repoRoot, 'src/data/videos-i18n.json');

function loadManifest() {
  for (const p of [USER_MANIFEST, SYSTEM_MANIFEST]) {
    if (fs.existsSync(p)) {
      console.log(`reading: ${p}`);
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }
  throw new Error(
    'No aerial manifest found. Looked at:\n  ' +
      [USER_MANIFEST, SYSTEM_MANIFEST].join('\n  '),
  );
}

function loadLoctable() {
  if (!fs.existsSync(LOCTABLE)) {
    throw new Error(`Loctable not found: ${LOCTABLE}`);
  }
  console.log(`reading: ${LOCTABLE}`);
  const json = execFileSync(
    'plutil',
    ['-convert', 'json', '-o', '-', LOCTABLE],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  return JSON.parse(json);
}

// Look up `key` across all shipped locales. Missing values are omitted; the
// runtime helper falls back to `en`, which the loctable has for every key
// we care about.
function lookupLocales(loctable, key) {
  if (!key) return null;
  const out = {};
  for (const loc of LOCALES) {
    const v = loctable[loc]?.[key];
    if (v) out[loc] = v;
  }
  return Object.keys(out).length > 0 ? out : null;
}

function buildCategoryIndex(manifest, loctable) {
  const byId = new Map();
  const categoryI18n = {};
  const subcategoryI18n = {};
  for (const cat of manifest.categories || []) {
    const catKey = cat.localizedNameKey || '';
    const topName = catKey.replace(/^AerialCategory/, '');
    byId.set(cat.id, { kind: 'category', name: topName });
    if (topName && !categoryI18n[topName]) {
      const t = lookupLocales(loctable, catKey);
      if (t) categoryI18n[topName] = t;
    }
    for (const sub of cat.subcategories || []) {
      const subKey = sub.localizedNameKey || '';
      const subName = subKey.replace(/^AerialSubcategory/, '');
      byId.set(sub.id, { kind: 'subcategory', name: subName, parent: topName });
      if (subName && !subcategoryI18n[subName]) {
        const t = lookupLocales(loctable, subKey);
        if (t) subcategoryI18n[subName] = t;
      }
    }
  }
  return { byId, categoryI18n, subcategoryI18n };
}

function inferTimeOfDay(asset, subNames) {
  // accessibilityLabel suffix: e.g. "Tahoe Day" / "Tahoe Night"
  const label = (asset.accessibilityLabel || '').toLowerCase();
  if (/\bnight\b/.test(label)) return 'night';
  if (/\bday\b/.test(label)) return 'day';
  if (/\bsunrise\b|\bdawn\b/.test(label)) return 'sunrise';
  if (/\bsunset\b|\bdusk\b/.test(label)) return 'sunset';
  // Subcategory suffix as fallback (e.g. "AfricaNight", "CaribbeanDay")
  for (const sub of subNames) {
    if (/Night$/.test(sub)) return 'night';
    if (/Day$/.test(sub)) return 'day';
  }
  return null;
}

const manifest = loadManifest();
const loctable = loadLoctable();
const { byId: categoryIndex, categoryI18n, subcategoryI18n } =
  buildCategoryIndex(manifest, loctable);

const videos = [];
const videoI18n = {};
for (const a of manifest.assets) {
  const url = a['url-4K-SDR-240FPS'];
  if (!url) continue;

  const cats = (a.categories || [])
    .map((id) => categoryIndex.get(id))
    .filter(Boolean);
  const subs = (a.subcategories || [])
    .map((id) => categoryIndex.get(id))
    .filter(Boolean);

  const topCategory = cats.find((c) => c.kind === 'category')?.name ?? null;
  const subNames = subs.map((s) => s.name);

  videos.push({
    id: a.id,
    shotID: a.shotID || null,
    name: a.accessibilityLabel || null,
    url,
    previewImage: a.previewImage || null,
    category: topCategory,
    subcategories: subNames,
    timeOfDay: inferTimeOfDay(a, subNames),
  });

  // Translations are keyed by shotID (stable, Apple-defined) so the i18n
  // lookup file stays decoupled from runtime URL changes.
  if (a.shotID && a.localizedNameKey) {
    const t = lookupLocales(loctable, a.localizedNameKey);
    if (t) videoI18n[a.shotID] = t;
  }
}

const stats = {
  total: videos.length,
  byCategory: {},
  byTimeOfDay: { day: 0, night: 0, sunrise: 0, sunset: 0, unknown: 0 },
};
for (const v of videos) {
  stats.byCategory[v.category] = (stats.byCategory[v.category] || 0) + 1;
  stats.byTimeOfDay[v.timeOfDay ?? 'unknown']++;
}
console.log('total assets:', stats.total);
console.log('by category:', stats.byCategory);
console.log('by time of day:', stats.byTimeOfDay);

fs.writeFileSync(OUT_PATH, JSON.stringify(videos, null, 2) + '\n');
console.log(`wrote ${OUT_PATH}`);

const i18nPayload = {
  locales: LOCALES,
  categories: categoryI18n,
  subcategories: subcategoryI18n,
  videos: videoI18n,
};
fs.writeFileSync(I18N_OUT_PATH, JSON.stringify(i18nPayload, null, 2) + '\n');
console.log(
  `wrote ${I18N_OUT_PATH} ` +
    `(categories: ${Object.keys(categoryI18n).length}, ` +
    `subcategories: ${Object.keys(subcategoryI18n).length}, ` +
    `videos: ${Object.keys(videoI18n).length})`,
);
