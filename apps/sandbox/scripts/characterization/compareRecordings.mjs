/**
 * ⛑ LEDGER-CHAR-1 · the comparison itself, pure (plan P12a J5; register 5.1029).
 *
 * `base` and `head` map a family name to its recorded cases (`{ [caseId]: recording }`);
 * `frozenIds` maps a family name to the case ids PR-1 froze (`frozen.json`). The result fails when:
 * - the base recorded no family, or no case at all (a run that compared nothing never passes);
 * - a frozen family or a frozen case id is missing from the BASE's own recording (the base cannot
 *   legitimately lose one: cases are never removed, plan D11);
 * - a case the base recorded is missing from the head, or recorded differently.
 * Cases only the head has are listed as new. No I/O here: `compareOutputs.mjs` reads the files.
 *
 * @param {Record<string, Record<string, unknown>>} base
 * @param {Record<string, Record<string, unknown>>} head
 * @param {Record<string, Record<string, unknown>>} frozenIds
 */
export function compareRecordings(base, head, frozenIds) {
  const problems = [];
  const added = [];
  let compared = 0;
  const families = Object.keys(base);
  if (families.length === 0) problems.push('the base recorded no family: nothing was compared');
  for (const [family, ids] of Object.entries(frozenIds)) {
    if (!(family in base)) {
      problems.push(`${family}: a frozen family is missing from the base's recording`);
      continue;
    }
    for (const id of Object.keys(ids))
      if (!(id in base[family]))
        problems.push(`${family} · ${id}: a frozen case is missing from the base's recording`);
  }
  for (const family of families) {
    const headFamily = head[family];
    if (!headFamily) {
      problems.push(`${family}: missing from the PR's recording`);
      continue;
    }
    for (const [id, recorded] of Object.entries(base[family])) {
      compared += 1;
      if (!(id in headFamily)) problems.push(`${family} · ${id}: lost`);
      else if (JSON.stringify(headFamily[id]) !== JSON.stringify(recorded))
        problems.push(`${family} · ${id}: changed`);
    }
    for (const id of Object.keys(headFamily))
      if (!(id in base[family])) added.push(`${family} · ${id}`);
  }
  for (const family of Object.keys(head))
    if (!(family in base))
      for (const id of Object.keys(head[family])) added.push(`${family} · ${id}`);
  if (families.length > 0 && compared === 0)
    problems.push('the base recorded no case: nothing was compared');
  return { ok: problems.length === 0, problems, added, compared, families: families.length };
}
