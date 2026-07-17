#!/usr/bin/env node
/**
 * validate:seo — the source-level SEO gate (engineering-gates registry, 2026-07-17).
 *
 * Checks (all deterministic, no server needed — the validate:ux-canon model):
 *  1. PAGE_SEO_CONFIG entries: title 15–65 chars, description 50–170 chars,
 *     non-empty keywords, no em-dashes, no duplicate titles/descriptions.
 *  2. Route ↔ config parity: every `page.tsx` route under [locale] either has
 *     a PAGE_SEO_CONFIG key or is in the DOCUMENTED EXCEPTIONS below (pages
 *     that own their metadata or are deliberately unindexed). Unknown new
 *     routes FAIL — declaring SEO intent is mandatory.
 *  3. Learn flip pairs: live registry talks ↔ config entries (both-or-neither).
 *  4. OG parity: every PAGE_CONFIGS key is accepted by isValidPageType
 *     (source-level; the Phase-1 /api/og/learn silent-default class).
 *  5. Per-locale seo keys: every namespace carrying seo.title/seo.description
 *     has them in ALL 4 locales, within bounds, em-dash-free.
 *
 * Runtime-rendered meta (canonical/hreflang in HTML) is e2e territory, not
 * this script. JSON-LD emitters are unit-tested per feature.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf-8');

const errors = [];
const TITLE_MIN = 15,
  TITLE_MAX = 65,
  DESC_MIN = 50,
  DESC_MAX = 170;

/** Routes that deliberately have no PAGE_SEO_CONFIG entry — each needs a reason. */
const ROUTE_EXCEPTIONS = {
  '/': 'root redirect handled by app/page.tsx; locale home = the "home" key',
  '/investors': 'owns its metadata via generateMetadata (investor vertical)',
  '/investor-room': 'password-gated, noindex by design',
  '/investor-room/[doc]': 'password-gated, noindex by design',
  '/delete-confirm': 'GDPR flow page, not a marketing surface',
  '/email-preferences': 'transactional flow page, not a marketing surface',
  '/learn/[lesson]': 'dynamic route: per-talk keys checked via the registry (check 3)',
};

/** page key → route mapping where they differ. */
const KEY_TO_ROUTE = { home: '/', organization: null, share: '/share' };

// ---------- parse PAGE_SEO_CONFIG (source-level) ----------
const seoSrc = read('apps/web/src/lib/seo/constants.ts');
const entryRe =
  /^  '?([a-z/-]+)'?: \{\s*\n\s*title: (['"])([\s\S]*?)\2,\s*\n\s*description:\s*\n?\s*(['"])([\s\S]*?)\4,/gm;
const entries = {};
let m;
while ((m = entryRe.exec(seoSrc))) entries[m[1]] = { title: m[3], description: m[5] };

if (Object.keys(entries).length < 30)
  errors.push(
    `parser sanity: only ${Object.keys(entries).length} PAGE_SEO_CONFIG entries parsed (expected 30+) — the source format changed; update this script`
  );

const seenTitles = new Map(),
  seenDescs = new Map();
for (const [key, { title, description }] of Object.entries(entries)) {
  if (key === 'organization') continue;
  if (title.length < TITLE_MIN || title.length > TITLE_MAX)
    errors.push(
      `${key}: title length ${title.length} outside ${TITLE_MIN}–${TITLE_MAX}: "${title}"`
    );
  if (description.length < DESC_MIN || description.length > DESC_MAX)
    errors.push(`${key}: description length ${description.length} outside ${DESC_MIN}–${DESC_MAX}`);
  if (title.includes('—') || description.includes('—'))
    errors.push(`${key}: em-dash in title/description`);
  if (seenTitles.has(title))
    errors.push(`duplicate title between "${seenTitles.get(title)}" and "${key}"`);
  if (seenDescs.has(description))
    errors.push(`duplicate description between "${seenDescs.get(description)}" and "${key}"`);
  seenTitles.set(title, key);
  seenDescs.set(description, key);
  const kwBlock = seoSrc.slice(
    seoSrc.indexOf(`'${key}':`) === -1 ? seoSrc.indexOf(`  ${key}: {`) : seoSrc.indexOf(`'${key}':`)
  );
  if (!/keywords: \[/.test(kwBlock.slice(0, 600))) errors.push(`${key}: no keywords array`);
}

// ---------- route parity ----------
const pagesDir = path.join(ROOT, 'apps/web/src/app/[locale]');
const routes = [];
(function walk(dir, prefix) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      const seg = e.name.startsWith('(') ? '' : `/${e.name}`;
      walk(path.join(dir, e.name), prefix + seg);
    } else if (e.name === 'page.tsx') routes.push(prefix || '/');
  }
})(pagesDir, '');
const configRoutes = new Set(
  Object.keys(entries)
    .map((k) => (k in KEY_TO_ROUTE ? KEY_TO_ROUTE[k] : `/${k}`))
    .filter(Boolean)
);
for (const r of routes) {
  if (!configRoutes.has(r) && !(r in ROUTE_EXCEPTIONS))
    errors.push(
      `route ${r} has NO PAGE_SEO_CONFIG entry and is not a documented exception — declare its SEO intent (add a config entry or an exception with a reason in scripts/validate-seo.mjs)`
    );
}

// ---------- learn flip pairs ----------
const registry = read('apps/web/src/lib/learn/registry.ts');
const talkRe = /'([a-z-]+)': \{[\s\S]*?slug: '([a-z-]+)'[\s\S]*?status: '(\w+)'/g;
while ((m = talkRe.exec(registry))) {
  const [, , slug, status] = m;
  const hasEntry = `learn/${slug}` in entries;
  if (status === 'live' && !hasEntry)
    errors.push(`live talk "${slug}" missing PAGE_SEO_CONFIG entry`);
  if (status === 'announced' && hasEntry)
    errors.push(`announced talk "${slug}" must NOT have a PAGE_SEO_CONFIG entry (sitemap leak)`);
}

// ---------- OG parity ----------
const og = read('apps/web/src/lib/og/templates.tsx');
// Parse the WHOLE PAGE_CONFIGS block (comment-robust: keys may have comment
// lines between the key and its first prop).
const cfgStart = og.indexOf('PAGE_CONFIGS');
const cfgBlock = og.slice(cfgStart, og.indexOf('} as const', cfgStart));
const ogKeys = [...cfgBlock.matchAll(/^  '?([a-z][a-z0-9-]*)'?: \{/gm)].map((x) => x[1]);
if (ogKeys.length < 20)
  errors.push(
    `parser sanity: only ${ogKeys.length} OG PAGE_CONFIGS keys parsed (expected 20+) — source format changed; update this script`
  );
// Bound the allowlist to the array literal and STRIP COMMENTS before
// matching — a comment mentioning a key must never satisfy the check
// (mutation-audit finding, 2026-07-17).
const fnStart = og.indexOf('function isValidPageType');
const validBlock = og.slice(fnStart, og.indexOf('].includes', fnStart)).replace(/\/\/[^\n]*/g, '');
for (const k of ogKeys) {
  if (!validBlock.includes(`'${k}'`))
    errors.push(
      `OG page type "${k}" is in PAGE_CONFIGS but NOT in isValidPageType — /api/og/${k} silently serves the default template`
    );
}

// ---------- per-locale seo keys ----------
const LOCALES = ['en', 'pt-BR', 'es', 'de'];
const enDir = path.join(ROOT, 'packages/i18n/translations/en');
const nsWithSeo = fs.readdirSync(enDir).filter((f) => {
  if (!f.endsWith('.json')) return false;
  try {
    const j = JSON.parse(read(`packages/i18n/translations/en/${f}`));
    return j.seo && (j.seo.title || j.seo.description);
  } catch {
    return false;
  }
});
for (const f of nsWithSeo) {
  for (const loc of LOCALES) {
    let j;
    try {
      j = JSON.parse(read(`packages/i18n/translations/${loc}/${f}`));
    } catch {
      errors.push(`${loc}/${f}: unreadable`);
      continue;
    }
    const t = j.seo?.title,
      d = j.seo?.description;
    if (!t) errors.push(`${loc}/${f}: seo.title missing`);
    else if (t.length > 80)
      errors.push(`${loc}/${f}: seo.title length ${t.length} > 80 (locale bound incl. expansion)`);
    if (!d) errors.push(`${loc}/${f}: seo.description missing`);
    else if (d.length < DESC_MIN || d.length > 210)
      errors.push(
        `${loc}/${f}: seo.description length ${d.length} outside ${DESC_MIN}–210 (locale bound incl. expansion)`
      );
    if ((t && t.includes('—')) || (d && d.includes('—')))
      errors.push(`${loc}/${f}: em-dash in seo strings`);
  }
}

// ---------- report ----------
if (errors.length) {
  console.error(`✖ validate:seo — ${errors.length} finding(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `✓ validate:seo OK — ${Object.keys(entries).length} config entries bounded+unique; ${routes.length} routes accounted for (${Object.keys(ROUTE_EXCEPTIONS).length} documented exceptions); learn flip pairs consistent; ${ogKeys.length} OG types registered; ${nsWithSeo.length} seo-bearing namespaces ×4 locales bounded.`
);
