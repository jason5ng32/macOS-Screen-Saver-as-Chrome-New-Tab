/**
 * Rebuild src/data/quotes.json from JamesFT/Database-Quotes-JSON.
 *
 * Source: https://raw.githubusercontent.com/JamesFT/Database-Quotes-JSON/master/quotes.json
 * (~5400 famous quotes, no explicit license but content is largely
 *  public-domain attributions; we take a 500-quote subset, dedupe by
 *  text, and cap any single author so no one dominates the rotation.)
 *
 * Usage: pnpm run build:quotes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const SOURCE_URL =
  'https://raw.githubusercontent.com/JamesFT/Database-Quotes-JSON/master/quotes.json';
const OUT_PATH = path.join(repoRoot, 'src/data/quotes.json');

const TARGET = 500;
const MAX_PER_AUTHOR = 15;
const MIN_LEN = 10;
const MAX_LEN = 220;

const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`fetch failed: HTTP ${res.status}`);
const raw = await res.json();
console.log(`source quotes: ${raw.length}`);

const seenContent = new Set();
const authorCount = new Map();
const out = [];

for (const q of raw) {
  const content = (q.quoteText || '').trim().replace(/\s+/g, ' ');
  const author = (q.quoteAuthor || '').trim();
  if (!content || !author) continue;
  if (content.length < MIN_LEN || content.length > MAX_LEN) continue;
  if (/^(unknown|anonymous|n\/a)$/i.test(author)) continue;
  if (seenContent.has(content)) continue;
  const cnt = authorCount.get(author) || 0;
  if (cnt >= MAX_PER_AUTHOR) continue;
  seenContent.add(content);
  authorCount.set(author, cnt + 1);
  out.push({ content, author });
  if (out.length >= TARGET) break;
}

console.log(`selected: ${out.length}`);
console.log(`unique authors: ${authorCount.size}`);

fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
console.log(`wrote ${OUT_PATH}`);
