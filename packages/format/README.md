# @diboas/format

Number formatting shared by the website (`apps/web`) and the Practice app (`apps/sandbox`).
It has no dependencies; it is plain `Intl` underneath.

## `formatPercent(fraction, locale, options?)`

Writes a percentage the one way diBoaS writes it: the `%` sign immediately after the number, with
no space, in every locale (founder ruling 2026-10-31, register `5.729`).

```ts
formatPercent(0.07, 'de'); // "7%"   (Intl alone gives "7 %")
formatPercent(0.0039, 'es', { minimumFractionDigits: 2 }); // "0,39%"
```

Pass the value as a fraction (0.07 for 7%), as `Intl` does. `options` are `Intl.NumberFormatOptions`
without `style`. Digits, separators and sign are exactly the locale's; only the space next to `%` is
removed.

**Do not call `Intl.NumberFormat` with `style: 'percent'` anywhere else.** A source check in the web
app's tests (`apps/web/src/lib/__tests__/percentFormatClass.test.ts`) fails if you do.

## `findPercentFormatViolations(text)`

Returns every place a string breaks the ruling: a space or hyphen before `%`, or a digit followed by
the spelled-out word ("7 percent", "7 Prozent", "7 por ciento", "7 por cento"). Both apps' catalogue
tests call it, so the rule is written once. Spelled-out prose with no digit ("Ten percent…") and
"percentage points" are not violations.
