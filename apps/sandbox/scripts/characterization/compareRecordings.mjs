/**
 * ⛑ LEDGER-CHAR-1 · the comparison itself, pure (plan P12a J5; register 5.1029).
 *
 * `base` and `head` map a family name to its recorded cases (`{ [caseId]: recording }`);
 * `frozenIds` maps a family name to the case ids PR-1 froze (`frozen.json`). The result fails when:
 * - the base recorded no family, or no case at all (a run that compared nothing never passes);
 * - a frozen family or a frozen case id is missing from the BASE's own recording (the base cannot
 *   legitimately lose one: cases are never removed, plan D11);
 * - a case the base recorded is missing from the head, or recorded differently;
 * - the head recorded a family or a case the base did not: both runs use the base's case files
 *   (the judge is restored from the base), so an extra case means the two runs were not judged
 *   alike.
 * Every lookup is an own-property check, so a case id such as `toString` is never mistaken for a
 * built-in. No I/O here: `compareOutputs.mjs` reads the files.
 *
 * @param {Record<string, Record<string, unknown>>} base
 * @param {Record<string, Record<string, unknown>>} head
 * @param {Record<string, Record<string, unknown>>} frozenIds
 */
export function compareRecordings(base, head, frozenIds) {
  const has = (object, key) =>
    object !== null && typeof object === 'object' && Object.hasOwn(object, key);
  const problems = [];
  let compared = 0;
  const families = Object.keys(base);
  const cases = families.reduce((n, family) => n + Object.keys(base[family] ?? {}).length, 0);
  if (families.length === 0) problems.push('the base recorded no family: nothing was compared');
  else if (cases === 0) problems.push('the base recorded no case: nothing was compared');
  for (const [family, ids] of Object.entries(frozenIds)) {
    if (!has(base, family)) {
      problems.push(`${family}: a frozen family is missing from the base's recording`);
      continue;
    }
    for (const id of Object.keys(ids))
      if (!has(base[family], id))
        problems.push(`${family} · ${id}: a frozen case is missing from the base's recording`);
  }
  for (const family of families) {
    if (!has(head, family)) {
      problems.push(`${family}: missing from the PR's recording`);
      continue;
    }
    const headFamily = head[family];
    for (const [id, recorded] of Object.entries(base[family])) {
      compared += 1;
      if (!has(headFamily, id)) problems.push(`${family} · ${id}: lost`);
      else if (JSON.stringify(headFamily[id]) !== JSON.stringify(recorded))
        problems.push(`${family} · ${id}: changed`);
    }
    for (const id of Object.keys(headFamily))
      if (!has(base[family], id))
        problems.push(
          `${family} · ${id}: only in the PR's recording (the runs were not judged alike)`
        );
  }
  for (const family of Object.keys(head))
    if (!has(base, family))
      problems.push(
        `${family}: a family only in the PR's recording (the runs were not judged alike)`
      );
  return { ok: problems.length === 0, problems, compared, families: families.length };
}
