/**
 * The deletion texts state what erasure keeps (plan P14, E11′; register `5.863`; the founder's
 * approval as Legal for these texts, option B of `5.1004`, 2026-11-20).
 *
 * The page after a confirmed deletion, the completion email and the delete route used to say
 * "all your personal data has been permanently removed", while security logs (90 days), database
 * backups (within a day) and the email provider's copies remain. Each surface now names what is
 * kept; the old blanket promise may not come back in any locale.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = join(__dirname, '../../../../../..');
const LOCALES = ['en', 'pt-BR', 'es', 'de'] as const;
/**
 * "all … data" or "permanently" in each language: the claim erasure cannot keep. P14 review: the
 * pt-BR branch once read `datos` (never matches Portuguese `dados`) and German "alle … Daten"
 * was missing; the self-test below pins one phrase per language.
 */
const BLANKET =
  /permanent|dauerhaft|all (of )?your (personal )?data|todos (os )?(seus|tus) (dados|datos)|alle (deine|Ihre) (persönlichen )?Daten/i;

const deletion = (locale: string) =>
  JSON.parse(readFileSync(join(REPO, `packages/i18n/translations/${locale}/waitlist.json`), 'utf8'))
    .deletion as Record<string, string>;
const email = readFileSync(join(REPO, 'packages/email/src/templates/deletion-complete.ts'), 'utf8');
const request = readFileSync(
  join(REPO, 'packages/email/src/templates/deletion-confirmation.ts'),
  'utf8'
);
const route = readFileSync(join(REPO, 'apps/web/src/app/api/waitlist/delete/route.ts'), 'utf8');

describe('the deletion texts state what is kept', () => {
  it.each([
    'All your personal data has been removed.',
    'Todos os seus dados pessoais foram removidos.',
    'Todos tus datos fueron eliminados.',
    'Alle deine persönlichen Daten wurden gelöscht.',
    'This permanently deletes your entry.',
  ])('should recognise the blanket promise when a text says "%s" (self-test)', (text) => {
    expect(text).toMatch(BLANKET);
  });

  it.each(LOCALES)(
    'should name the 90-day logs and the invite code and promise no blanket deletion on the page in %s',
    (locale) => {
      const { successBody, confirmBody, nothingFoundBody } = deletion(locale);
      for (const text of [successBody, confirmBody]) {
        expect(text).toMatch(/90/);
        expect(text).not.toMatch(BLANKET);
      }
      // the page names the invite code left on friends' entries, as the email does
      expect(successBody).toMatch(
        /invite code|código de convite|código de invitación|Einladungscode/
      );
      expect(nothingFoundBody).not.toMatch(BLANKET);
      // no pointer to a policy that does not hold these details (W-D1 rewrites it)
      expect(successBody).not.toMatch(/Privacy Policy|Privacidade|Privacidad|Datenschutz/);
    }
  );

  it('should list what is kept in the completion email in all four locales', () => {
    expect(email.match(/keptTitle:/g)).toHaveLength(4);
    expect(email.match(/keptItems:/g)).toHaveLength(4);
    expect(email.match(/90/g)?.length).toBeGreaterThanOrEqual(4);
    expect(email).toContain('${t.keptItems}');
    expect(email).not.toMatch(BLANKET);
    // the box is not "for a limited time": the invite code and the provider's copies are not ours to time
    expect(email).not.toMatch(/limited time|tempo limitado|tiempo limitado|begrenzte Zeit/);
  });

  it('should ask for no blanket deletion in the request email in all four locales', () => {
    expect(request).not.toMatch(BLANKET);
  });

  it('should answer with what is kept and without the blanket promise when the delete route succeeds', () => {
    expect(route).toContain('Your waitlist entry and email records have been deleted.');
    expect(route).toMatch(/up to 90 days/);
    expect(route).toContain('deleted: result.deleted');
    expect(route).not.toMatch(/permanently deleted/i);
  });
});
