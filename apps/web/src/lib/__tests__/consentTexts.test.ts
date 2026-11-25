/**
 * CONSENT-TEXT-1 · every consent text the site shows is the wording its current version pins,
 * in all four locales (market clean-up W-D1, register 5.923; spec §4). A signup's evidence tag
 * names a box text and version; this is what makes that name mean one wording. Changed wording
 * needs a new version (`scripts/check-consent-texts-grow.mjs` refuses an edited version in CI).
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COOKIE_CONFIG } from '@/config/env';
import { JOIN_NOTICE_KEY, NOTE_BOX_KEYS } from '@/components/WaitingList/WaitlistNoteFields';
import { JOIN_NOTICE_VERSION, SIGNUP_NOTE_BOX_VERSIONS } from '@/lib/waitingList/constants';
import {
  TEXTS_PATH,
  consentTextShrinkage,
  hashWording,
  main,
} from '../../../../../scripts/check-consent-texts-grow.mjs';

const REPO = resolve(__dirname, '../../../../..');
const LOCALES = ['en', 'pt-BR', 'es', 'de'];
interface Entry {
  id: string;
  keys: string[];
  versions: Record<string, Record<string, string>>;
}
const table = (): { texts: Entry[] } => JSON.parse(readFileSync(join(REPO, TEXTS_PATH), 'utf8'));

/** The version each text is shown at today, read from the code that shows it. */
const CURRENT: Record<string, string> = {
  banner: COOKIE_CONFIG.consentVersion,
  note: String(SIGNUP_NOTE_BOX_VERSIONS.note),
  'note-campaign': String(SIGNUP_NOTE_BOX_VERSIONS['note-campaign']),
  'join-notice': String(JOIN_NOTICE_VERSION),
};

function wording(locale: string, id: string): string {
  const [ns, ...path] = id.split('.');
  let node: unknown = JSON.parse(
    readFileSync(join(REPO, 'packages/i18n/translations', locale, `${ns}.json`), 'utf8')
  );
  for (const part of path) node = (node as Record<string, unknown>)?.[part];
  if (typeof node !== 'string') throw new Error(`${locale} ${id} is not a string`);
  return node;
}

describe('CONSENT-TEXT-1: the shown wording is the pinned wording', () => {
  it('should version exactly the texts the code shows', () => {
    expect(
      table()
        .texts.map((t) => t.id)
        .sort()
    ).toEqual(Object.keys(CURRENT).sort());
  });

  it.each(Object.keys(CURRENT))('should pin the current version of %s in every locale', (id) => {
    const entry = table().texts.find((t) => t.id === id)!;
    const pinned = entry.versions[CURRENT[id]];
    expect(pinned, `${id} v${CURRENT[id]} is not in the table`).toBeDefined();
    for (const locale of LOCALES)
      expect(hashWording(entry.keys.map((k) => wording(locale, k))), `${id} ${locale}`).toBe(
        pinned[locale]
      );
  });

  it('should render the note boxes and the join notice from exactly the versioned keys', () => {
    const keys = (id: string) => table().texts.find((t) => t.id === id)!.keys;
    expect([NOTE_BOX_KEYS.note]).toEqual(keys('note'));
    expect([NOTE_BOX_KEYS['note-campaign']]).toEqual(keys('note-campaign'));
    expect([JOIN_NOTICE_KEY]).toEqual(keys('join-notice'));
  });
});

describe('CONSENT-TEXT-1: a pinned version only grows', () => {
  const v = (hash: string) => ({
    texts: [{ id: 'note', keys: ['k'], versions: { '1': { en: hash } } }],
  });

  it('should pass an unchanged table, a new version and a first introduction', () => {
    expect(consentTextShrinkage(table(), table())).toEqual([]);
    const grown = {
      texts: [{ id: 'note', keys: ['k'], versions: { '1': { en: 'a' }, '2': { en: 'b' } } }],
    };
    expect(consentTextShrinkage(v('a'), grown)).toEqual([]);
    expect(consentTextShrinkage(null, table())).toEqual([]);
  });

  it('should fail an edited version, a removed version or text, and a deleted table', () => {
    expect(consentTextShrinkage(v('a'), v('b'))).toEqual([
      'note v1 en: the pinned wording changed',
    ]);
    expect(
      consentTextShrinkage(v('a'), { texts: [{ id: 'note', keys: ['k'], versions: {} }] })
    ).toEqual(['note v1: the version is gone']);
    expect(consentTextShrinkage(v('a'), { texts: [] })).toEqual(['note: the text is gone']);
    expect(consentTextShrinkage(v('a'), null)).toEqual(['the table was deleted']);
    expect(consentTextShrinkage(null, null)).toEqual(['the table is missing on this branch']);
  });

  it('should fail closed without a base commit', () => {
    expect(main([])).toBe(1);
    expect(main(['0000000000000000000000000000000000000000'])).toBe(1);
    expect(main(['not-a-commit'])).toBe(1);
  });

  it('should pass against this branch itself', () => {
    expect(main(['HEAD'])).toBe(0);
  });
});
