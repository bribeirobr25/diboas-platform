#!/usr/bin/env node
/**
 * generate-investor-docs.mjs — investor-room document content generator.
 *
 * Converts the canonical investor-material markdown (in the LOCAL-ONLY
 * `docs/get-ready/investor-material/`) into the committed i18n namespace
 * `packages/i18n/translations/<locale>/investor-docs.json`, as an ordered,
 * typed `blocks[]` model that mirrors each source document EXACTLY (headings,
 * paragraphs, lists, tables, quotes — in order).
 *
 * Why generate instead of hand-transcribe: some docs have 80+ table rows;
 * mechanical conversion is the only way to guarantee fidelity. Runs at dev time
 * (the source is gitignored); its JSON output is committed.
 *
 * Usage:  node scripts/generate-investor-docs.mjs [locale]   (default: en)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const locale = process.argv[2] || 'en';

// slug -> source markdown file, per locale. EN wired for Phase 1; the other
// locales point at their native production docs for Phase 2.
const BASE = 'docs/get-ready/investor-material';
const SLUG_SOURCES = {
  en: {
    'business-plan': `${BASE}/BUSINESS_PLAN_final_aligned_EN.md`,
    'investor-faq': `${BASE}/INVESTOR_FAQ_final_aligned_EN.md`,
    'pitch-deck': `${BASE}/investor-page-en/03_diboas_pitch_deck_outline_EN.md`,
    'use-of-funds': `${BASE}/investor-page-en/04_diboas_use_of_funds_EN.md`,
    'revenue-model': `${BASE}/investor-page-en/05_diboas_revenue_model_summary_EN.md`,
    'regulatory-position': `${BASE}/investor-page-en/06_diboas_regulatory_position_summary_EN.md`,
    'product-roadmap': `${BASE}/investor-page-en/07_diboas_product_roadmap_EN.md`,
    'fees-summary': `${BASE}/investor-page-en/08_diboas_fees_summary_EN.md`,
  },
  'pt-BR': {
    'business-plan': `${BASE}/BUSINESS_PLAN_final_aligned_PT.md`,
    'investor-faq': `${BASE}/INVESTOR_FAQ_final_aligned_PT.md`,
    'pitch-deck': `${BASE}/investor-page-ptBR/03_diboas_pitch_deck_outline_PT-BR.md`,
    'use-of-funds': `${BASE}/investor-page-ptBR/04_diboas_use_of_funds_PT-BR.md`,
    'revenue-model': `${BASE}/investor-page-ptBR/05_diboas_revenue_model_summary_PT-BR.md`,
    'regulatory-position': `${BASE}/investor-page-ptBR/06_diboas_regulatory_position_summary_PT-BR.md`,
    'product-roadmap': `${BASE}/investor-page-ptBR/07_diboas_product_roadmap_PT-BR.md`,
    'fees-summary': `${BASE}/investor-page-ptBR/08_diboas_fees_summary_PT-BR.md`,
  },
};

/** Strip inline markdown control chars, preserving the words. */
function inline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1') // bold
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1') // italic
    .replace(/`(.+?)`/g, '$1') // code
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1') // links -> text
    .trim();
}

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l) => /^\s*\|?[\s:|-]+\|?\s*$/.test(l) && l.includes('-');
const splitRow = (l) =>
  l
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => inline(c.trim()));

/** Parse one markdown document into an ordered blocks[] array. */
function parse(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let para = [];
  let titleSkipped = false;
  let metaSkipped = false;

  const flushPara = () => {
    if (para.length) {
      const text = inline(para.join(' ').replace(/\s+/g, ' ').trim());
      if (text) blocks.push({ type: 'paragraph', text });
      para = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip the first H1 (the document title — rendered from investor.json).
    if (!titleSkipped && /^#\s+/.test(line)) {
      titleSkipped = true;
      continue;
    }
    // Blockquote. The FIRST `>` block (right after the title) is the internal
    // front-matter metadata (Module / Language / Version / Status / Scope /
    // Format / data-room refs) — skip it. Every SUBSEQUENT `>` block is a real
    // pull-quote → render as a quote block (not a stray `>` paragraph).
    if (/^>\s?/.test(line)) {
      flushPara();
      const wasFirst = !metaSkipped;
      metaSkipped = true;
      const inner = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        const c = inline(lines[i].replace(/^>\s?/, '').trim());
        if (c) inner.push(c);
        i++;
      }
      i--;
      if (!wasFirst && inner.length) blocks.push({ type: 'quote', text: inner.join(' ') });
      continue;
    }

    if (line.trim() === '') {
      flushPara();
      continue;
    }

    // Fenced block (``` … ```): used in these docs for emphasized taglines /
    // callouts, not real code. Capture the inner lines as a callout block.
    if (/^```/.test(line)) {
      flushPara();
      metaSkipped = true;
      const inner = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        const c = inline(lines[i].trim());
        if (c) inner.push(c);
        i++;
      }
      if (inner.length) blocks.push({ type: 'callout', lines: inner });
      continue;
    }

    // Horizontal rule (---, ***, ___): pure section divider (no content) — skip.
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushPara();
      metaSkipped = true;
      continue;
    }

    // Heading — normalize source #/##/### -> h2/h3/h4 (under the page h1).
    const h = line.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      flushPara();
      metaSkipped = true;
      const level = Math.min(h[1].length + 1, 4);
      blocks.push({ type: 'heading', level, text: inline(h[2]) });
      continue;
    }

    // Table (consecutive `| … |` lines).
    if (isTableRow(line)) {
      flushPara();
      metaSkipped = true;
      const rows = [];
      while (i < lines.length && isTableRow(lines[i])) {
        if (!isTableSep(lines[i])) rows.push(splitRow(lines[i]));
        i++;
      }
      i--;
      if (rows.length) {
        const [headers, ...body] = rows;
        blocks.push({ type: 'table', headers, rows: body });
      }
      continue;
    }

    // Lists.
    const ul = line.match(/^\s*[-*]\s+(.+)$/);
    const ol = line.match(/^\s*\d+\.\s+(.+)$/);
    if (ul || ol) {
      flushPara();
      metaSkipped = true;
      const ordered = !!ol;
      const items = [];
      while (i < lines.length) {
        const m = ordered
          ? lines[i].match(/^\s*\d+\.\s+(.+)$/)
          : lines[i].match(/^\s*[-*]\s+(.+)$/);
        if (!m) break;
        items.push(inline(m[1]));
        i++;
      }
      i--;
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    // Otherwise: paragraph text.
    metaSkipped = true;
    para.push(line.trim());
  }
  flushPara();
  return blocks;
}

const sources = SLUG_SOURCES[locale] || SLUG_SOURCES.en;
const docs = {};
for (const [slug, rel] of Object.entries(sources)) {
  const path = resolve(ROOT, rel);
  if (!existsSync(path)) {
    console.error(`  ✗ MISSING source for ${slug}: ${rel}`);
    continue;
  }
  const blocks = parse(readFileSync(path, 'utf8'));
  docs[slug] = { blocks };
  const tbl = blocks.filter((b) => b.type === 'table').length;
  console.log(`  ✓ ${slug}: ${blocks.length} blocks (${tbl} tables)`);
}

const out = resolve(ROOT, `packages/i18n/translations/${locale}/investor-docs.json`);
writeFileSync(out, JSON.stringify({ docs }, null, 2) + '\n');
console.log(`\nWrote ${out}`);
