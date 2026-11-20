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
/** "all … permanently" in each language: the claim erasure cannot keep. */
const BLANKET = /permanent|dauerhaft|todos (os seus|tus) datos|all your personal data/i;

const successBody = (locale: string) =>
  (
    JSON.parse(
      readFileSync(join(REPO, `packages/i18n/translations/${locale}/waitlist.json`), 'utf8')
    ).deletion as { successBody: string }
  ).successBody;
const email = readFileSync(join(REPO, 'packages/email/src/templates/deletion-complete.ts'), 'utf8');
const route = readFileSync(join(REPO, 'apps/web/src/app/api/waitlist/delete/route.ts'), 'utf8');

describe('the deletion texts state what is kept', () => {
  it.each(LOCALES)(
    'should name the 90-day logs and promise no blanket deletion on the page in %s',
    (locale) => {
      const text = successBody(locale);
      expect(text).toMatch(/90/);
      expect(text).not.toMatch(BLANKET);
    }
  );

  it('should list what is kept in the completion email in all four locales', () => {
    expect(email.match(/keptTitle:/g)).toHaveLength(4);
    expect(email.match(/keptItems:/g)).toHaveLength(4);
    expect(email.match(/90/g)?.length).toBeGreaterThanOrEqual(4);
    expect(email).toContain('${t.keptItems}');
    expect(email).not.toMatch(BLANKET);
  });

  it('should answer without the blanket promise when the delete route succeeds', () => {
    expect(route).toContain('Your waitlist entry and email records have been deleted.');
    expect(route).not.toMatch(/permanently deleted/i);
  });
});
