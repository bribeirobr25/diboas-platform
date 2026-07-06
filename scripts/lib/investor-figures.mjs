/**
 * investor-figures.mjs — pure resolution + consistency-check logic for the
 * investor figures registry (config/investor-figures.json).
 *
 * Shared by BOTH consumers so the logic exists once (DRY):
 *   - scripts/generate-investor-docs.mjs  (token substitution at generation)
 *   - scripts/validate-investor-figures.mjs + the CI Vitest consistency test
 *
 * Pure functions only — no filesystem access, no process.exit. Callers load
 * files and decide how to fail. See
 * docs/audit/FIGURES_REGISTRY_IMPLEMENTATION_PLAN_2026-07-06.md §0.3-0.5.
 */

/** Token syntax in room source markdown: {{fig:fees.cap.rampB2B}} */
export const TOKEN_RE = /\{\{fig:([A-Za-z0-9._-]+)\}\}/g;

const LOCALES = ['en', 'pt-BR', 'de', 'es'];
const STATUSES = ['active', 'pending'];

/**
 * Structural validation usable without ajv (the CI Vitest test runs inside
 * apps/web, which does not declare ajv). The full JSON-Schema validation via
 * ajv runs in scripts/validate-investor-figures.mjs at the repo root; this
 * check covers the invariants the resolver depends on.
 * @returns {string[]} error messages (empty = valid)
 */
export function validateRegistryShape(registry) {
  const errors = [];
  if (!registry || typeof registry !== 'object' || !registry.figures) {
    return ['registry must be an object with a "figures" map'];
  }
  for (const [id, fig] of Object.entries(registry.figures)) {
    if (!/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)*$/.test(id)) {
      errors.push(`figure id "${id}" is not dot-namespaced lowerCamel`);
    }
    for (const field of ['value', 'source', 'asOf', 'status']) {
      if (fig[field] === undefined) errors.push(`figure "${id}" missing required field "${field}"`);
    }
    if (fig.status !== undefined && !STATUSES.includes(fig.status)) {
      errors.push(`figure "${id}" has invalid status "${fig.status}"`);
    }
    if (fig.value !== undefined && typeof fig.value !== 'string') {
      if (typeof fig.value !== 'object' || fig.value === null) {
        errors.push(`figure "${id}" value must be a string or a locale record`);
      } else {
        if (typeof fig.value.en !== 'string' || !fig.value.en) {
          errors.push(`figure "${id}" locale record must include a non-empty "en" value`);
        }
        for (const loc of Object.keys(fig.value)) {
          if (!LOCALES.includes(loc)) errors.push(`figure "${id}" has unknown locale "${loc}"`);
        }
      }
    }
  }
  for (const [i, p] of (registry.protected || []).entries()) {
    if (!p.pattern || !Array.isArray(p.locales) || !p.minCount || !p.why) {
      errors.push(`protected[${i}] must carry pattern, locales, minCount, why`);
    }
  }
  return errors;
}

/**
 * Resolve one figure for a content locale.
 * Throws on unknown id, pending status, or missing locale value — a
 * flagged-wrong or unknown number must never render (fail loud, never omit).
 */
export function resolveFigure(figures, id, locale) {
  const fig = figures[id];
  if (!fig) throw new Error(`Unknown figure id "${id}" — not in config/investor-figures.json`);
  if (fig.status !== 'active') {
    throw new Error(
      `Figure "${id}" has status "${fig.status}" — pending figures must not render (rule 0.2)`
    );
  }
  if (typeof fig.value === 'string') return fig.value;
  const v = fig.value[locale] ?? fig.value.en;
  if (typeof v !== 'string' || !v) {
    throw new Error(`Figure "${id}" has no value for locale "${locale}" and no en fallback`);
  }
  return v;
}

/**
 * Substitute every {{fig:id}} token in a markdown text for the given content
 * locale. Returns { text, resolved, ids }. Throws (via resolveFigure) on any
 * unknown or pending figure.
 */
export function substituteTokens(text, figures, locale) {
  const ids = [];
  const out = text.replace(TOKEN_RE, (_, id) => {
    ids.push(id);
    return resolveFigure(figures, id, locale);
  });
  return { text: out, resolved: ids.length, ids };
}

/**
 * Parse one `label | value | note?` stats row. Only the FIRST TWO pipes
 * delimit, so a note may itself contain `|` (a resolved value may not).
 * `inline` strips residual markdown per cell (identity by default, for tests).
 * Throws on a missing/empty label or value.
 */
export function parseStatsRow(line, inline = (s) => s) {
  const first = line.indexOf('|');
  if (first === -1) throw new Error(`stats row needs "label | value": "${line}"`);
  const label = inline(line.slice(0, first).trim());
  const rest = line.slice(first + 1);
  const second = rest.indexOf('|');
  const value = inline((second === -1 ? rest : rest.slice(0, second)).trim());
  const note = second === -1 ? undefined : inline(rest.slice(second + 1).trim()) || undefined;
  if (!label || !value) throw new Error(`stats row needs non-empty label and value: "${line}"`);
  return note ? { label, value, note } : { label, value };
}

/**
 * Parse a ```stats fence body (array of raw lines) into {hero, items}.
 * 1 hero + 0–4 secondaries (1–5 non-empty rows). Fail-loud outside that range.
 */
export function parseStatsBlock(rawLines, inline = (s) => s) {
  const rows = rawLines
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => parseStatsRow(l, inline));
  if (rows.length === 0 || rows.length > 5) {
    throw new Error(
      `stats block must have 1 hero + 0–4 secondaries (1–5 rows); got ${rows.length}`
    );
  }
  const [hero, ...items] = rows;
  return { type: 'stats', hero, items };
}

/**
 * CI-safe check of every `stats` block in the committed generated artifacts:
 * a non-empty hero, 0–4 secondaries each with non-empty label+value, and the
 * `investment-summary` doc carries at most 2 bands (A3 §3). Returns messages.
 */
export function checkStatsBlocks(artifactsByLocale) {
  const errors = [];
  for (const [locale, content] of Object.entries(artifactsByLocale)) {
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      errors.push(`[${locale}] investor-docs.json is not valid JSON`);
      continue;
    }
    for (const [slug, doc] of Object.entries(parsed.docs || {})) {
      const bands = (doc.blocks || []).filter((b) => b.type === 'stats');
      if (slug === 'investment-summary' && bands.length > 2) {
        errors.push(`[${locale}] ${slug} has ${bands.length} stats bands (max 2)`);
      }
      for (const band of bands) {
        if (!band.hero || !band.hero.label || !band.hero.value) {
          errors.push(`[${locale}] ${slug} stats band missing a hero label/value`);
        }
        const items = band.items || [];
        if (items.length > 4) {
          errors.push(`[${locale}] ${slug} stats band has ${items.length} secondaries (max 4)`);
        }
        for (const it of items) {
          if (!it.label || !it.value) {
            errors.push(`[${locale}] ${slug} stats secondary missing a label/value`);
          }
        }
      }
    }
  }
  return errors;
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count += 1;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

/**
 * CI-safe consistency checks over the committed generated artifacts.
 * @param registry parsed config/investor-figures.json
 * @param artifactsByLocale { en: string, 'pt-BR': string, de: string, es: string }
 *        — raw file contents of each locale's investor-docs.json
 * @returns {string[]} error messages (empty = consistent)
 */
export function checkGeneratedArtifacts(registry, artifactsByLocale) {
  const errors = [];

  // 1. No unresolved token residue in any committed artifact.
  for (const [locale, content] of Object.entries(artifactsByLocale)) {
    if (content.includes('{{fig:')) {
      errors.push(`[${locale}] investor-docs.json contains unresolved "{{fig:" token residue`);
    }
  }

  // 2. Superseded literals banned once their replacing figure is active.
  for (const [id, fig] of Object.entries(registry.figures)) {
    if (fig.status !== 'active' || !Array.isArray(fig.forbidLiterals)) continue;
    for (const pattern of fig.forbidLiterals) {
      const re = new RegExp(pattern, 'g');
      for (const [locale, content] of Object.entries(artifactsByLocale)) {
        const hits = content.match(re);
        if (hits && hits.length > 0) {
          errors.push(
            `[${locale}] ${hits.length}x forbidden literal /${pattern}/ survives although "${id}" is active`
          );
        }
      }
    }
  }

  // 3. Protected literals must remain present (e.g. the Year-1 users target).
  for (const p of registry.protected || []) {
    for (const locale of p.locales) {
      const content = artifactsByLocale[locale];
      if (content === undefined) continue;
      const count = countOccurrences(content, p.pattern);
      if (count < p.minCount) {
        errors.push(
          `[${locale}] protected literal "${p.pattern}" found ${count}x, expected >= ${p.minCount} (${p.why})`
        );
      }
    }
  }

  return errors;
}

/**
 * Local-only source checks (need docs/full-view + docs/agents on disk — these
 * directories are not git-tracked, so this NEVER runs in CI).
 * @param registry parsed registry
 * @param sources { feesMd?: string, decisionLog?: string } raw file contents
 * @returns {string[]} error messages
 */
export function checkCanonicalSources(registry, sources) {
  const errors = [];
  for (const [id, fig] of Object.entries(registry.figures)) {
    if (fig.source === 'FEES.md' && sources.feesMd && fig.feesRow) {
      const row = sources.feesMd
        .split('\n')
        .find((l) => l.trim().startsWith('|') && l.includes(fig.feesRow));
      if (!row) {
        errors.push(`FEES.md has no table row matching "${fig.feesRow}" (figure "${id}")`);
        continue;
      }
      for (const canonical of fig.feesCanonical || []) {
        if (!row.includes(canonical)) {
          errors.push(`FEES.md row "${fig.feesRow}" lacks "${canonical}" (figure "${id}")`);
        }
      }
    }
    if (fig.source.startsWith('DECISION_LOG#') && sources.decisionLog) {
      const decisionId = fig.source.split('#')[1];
      if (!sources.decisionLog.includes(`## ${decisionId}`)) {
        errors.push(`DECISION_LOG.md has no "## ${decisionId}" entry (figure "${id}")`);
      }
      for (const anchor of fig.anchors || []) {
        if (!sources.decisionLog.includes(anchor)) {
          errors.push(`DECISION_LOG.md lacks anchor "${anchor}" (figure "${id}")`);
        }
      }
    }
  }
  return errors;
}
