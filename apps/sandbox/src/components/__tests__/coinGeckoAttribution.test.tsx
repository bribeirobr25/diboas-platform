// @vitest-environment happy-dom
/**
 * COINGECKO ATTRIBUTION — Product/Brand ruling 2026-09-22.
 *
 * ⚑ EVERY ASSERTION TARGETS THE ATTRIBUTION SEAM, and the two directions are
 * tested separately on purpose. "It appears where CoinGecko data renders" and
 * "it does NOT appear where none does" are different failures with different
 * causes, and a test that only checks the first would pass for a component that
 * brands every surface in the app — which is the failure the ruling names in
 * its own words.
 */

import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE_STAMP, getStrategy, observedStamp } from '@diboas/defi';
import type { GasQuote, ProtocolApy, ProtocolApyHistory, ProtocolId } from '@diboas/defi';
import { StrategyDetail } from '../StrategyDetail';
import { Manifest } from '../Manifest';
import { getMessages } from '@/i18n/loadMessages';
import { SANDBOX_LOCALES } from '@/i18n/config';

/** The ratified copy and link. Spelled out here so a drift fails LOUDLY. */
const COPY = 'Data provided by CoinGecko';
const LINK = 'https://www.coingecko.com/en/api';

/**
 * Stamps are derived from the CLOCK, never hardcoded.
 *
 * `StrategyDetail` has no `now` prop — it memoises `new Date().toISOString()`
 * internally — so a fee only renders when the gas stamp is inside Stage H's
 * window relative to the REAL current time. A literal date here would render
 * the fee today and silently stop rendering it in a fortnight, taking every
 * assertion below with it: an expiry landmine of exactly the kind the sabotage
 * discipline exists to catch.
 */
const DAY_MS = 24 * 60 * 60 * 1000;
const OBSERVED_AT = new Date(Date.now() - DAY_MS).toISOString();

const apy = (protocolId: ProtocolId): ProtocolApy => ({
  protocolId,
  apyPercent: 4,
  tvlUsd: null,
  chain: 'Arbitrum',
  stamp: observedStamp('defillama', OBSERVED_AT),
});

const history = (protocolId: ProtocolId): ProtocolApyHistory => ({
  protocolId,
  points: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, '0')}`,
    apyPercent: 4,
  })),
  stamp: observedStamp('defillama', OBSERVED_AT),
});

const strategy = getStrategy('safeHarbor')!;
const APYS = strategy.allocation.map((l) => apy(l.protocolId));
const HISTORIES = strategy.allocation.map((l) => history(l.protocolId));

/** A gas quote whose stamp is INSIDE the window, so a fee amount renders. */
const PRICEABLE_GAS: GasQuote[] = [
  { chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: observedStamp('defillama', OBSERVED_AT) },
];
/** The fixture stamp is 60+ days old, so Stage H refuses it and NO fee renders. */
const REFUSED_GAS: GasQuote[] = [{ chain: 'Arbitrum', typicalFeeUsd: 0.03, stamp: FIXTURE_STAMP }];

function renderDetail(
  locale: (typeof SANDBOX_LOCALES)[number] = 'en',
  gas: GasQuote[] = PRICEABLE_GAS,
  usdPriceLocal: number | null = 1
) {
  return render(
    <IntlProvider locale={locale} messages={getMessages(locale)}>
      <StrategyDetail
        strategy={strategy}
        goalName="Future cushion"
        apys={APYS}
        histories={HISTORIES}
        gas={gas}
        usdPriceLocal={usdPriceLocal}
        currency="USD"
      />
    </IntlProvider>
  );
}

describe('attribution appears WHERE CoinGecko-derived data renders', () => {
  it('should attribute the network fee when the amount actually renders', () => {
    renderDetail();
    // The premise: a CoinGecko-FX-derived amount IS on screen.
    expect(screen.queryByText(/amount unavailable/i)).toBeNull();
    const link = screen.getByTestId('coingecko-attribution');
    expect(link.textContent).toBe(COPY);
  });

  it('should place the attribution INSIDE the cost group it belongs to', () => {
    /* PROXIMITY. Not a footer, not a modal, not an overflow menu — the ruling
       rejects each by name. Asserting containment within the cost section is
       what distinguishes "on the page somewhere" from "associated with the
       data", and a footer-only placement fails this. */
    renderDetail();
    const link = screen.getByTestId('coingecko-attribution');
    const group = link.closest('section');
    expect(group).not.toBeNull();
    /* Read `textContent`, not a text matcher: the fee row is composed from a
       message plus an interpolated amount, so React emits separate text nodes
       and `getByText` cannot span them — the same trap recorded on this
       surface's provenance assertion. */
    const text = group!.textContent ?? '';
    // The CoinGecko-derived VALUE and its attribution share one section.
    expect(text).toMatch(/Reference network cost/i);
    expect(text).toContain('$0.03');
    expect(text).toContain(COPY);
    // ...and the attribution FOLLOWS the value it attributes, not precedes it.
    expect(text.indexOf(COPY)).toBeGreaterThan(text.indexOf('$0.03'));
  });

  it('should link to the ratified target, opening safely', () => {
    renderDetail();
    const link = screen.getByTestId('coingecko-attribution');
    expect(link.getAttribute('href')).toBe(LINK);
    expect(link.getAttribute('rel')).toContain('noopener');
  });
});

describe('attribution does NOT appear where no CoinGecko-derived data renders', () => {
  it('should NOT brand the cost group when the fee amount is refused', () => {
    // Stage H refuses the stale gas stamp -> "amount unavailable" -> nothing
    // CoinGecko-derived is on screen, so nothing may be attributed.
    renderDetail('en', REFUSED_GAS);
    expect(screen.getByText(/amount unavailable/i)).toBeTruthy();
    expect(screen.queryByTestId('coingecko-attribution')).toBeNull();
  });

  it('should NOT brand the cost group when the FX rate is missing', () => {
    // A null `usdPriceLocal` withholds the fee (AUD-F05); same rule applies.
    renderDetail('en', PRICEABLE_GAS, null);
    expect(screen.queryByTestId('coingecko-attribution')).toBeNull();
  });

  it('should NOT brand a Manifest that carries no market-derived row', () => {
    /* `Manifest` is generic — `SimulatedEventScreen` uses it for a life event
       with no market data at all. Attribution is OPT-IN so that surface stays
       unbranded; a default-on prop would have branded it silently. */
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <Manifest
          titleId="manifest.title"
          rows={[{ labelId: 'manifest.amountLabel', value: '$10.00' }]}
          onApprove={() => {}}
          onCancel={() => {}}
        />
      </IntlProvider>
    );
    expect(screen.queryByTestId('coingecko-attribution')).toBeNull();
  });

  it('should brand the SAME Manifest when its caller declares market-derived rows', () => {
    // The positive twin: without this, the negative above would pass for a
    // component that can never render the attribution at all.
    render(
      <IntlProvider locale="en" messages={getMessages('en')}>
        <Manifest
          titleId="manifest.title"
          rows={[{ labelId: 'manifest.feeLabel', value: '$0.03' }]}
          onApprove={() => {}}
          onCancel={() => {}}
          attributeCoinGecko
        />
      </IntlProvider>
    );
    expect(screen.getByTestId('coingecko-attribution').textContent).toBe(COPY);
  });
});

describe('the copy is exact, and identical in every locale', () => {
  it.each(SANDBOX_LOCALES)('should render the exact English copy in %s', (locale) => {
    /* COPY LOCALIZATION = NO. The surrounding UI localizes normally; this
       string must not. Rendering through the real IntlProvider per locale is
       the assertion — reading the JSON would not prove what the user sees. */
    const { unmount } = renderDetail(locale);
    expect(screen.getByTestId('coingecko-attribution').textContent).toBe(COPY);
    unmount();
  });

  it('should reject the rejected variants by name', () => {
    renderDetail();
    const body = document.body.textContent ?? '';
    for (const banned of [
      'Powered by CoinGecko',
      'Market data powered by CoinGecko',
      'Prices powered by CoinGecko',
    ]) {
      expect(body).not.toContain(banned);
    }
  });

  it('should imply no endorsement, sponsorship or partnership', () => {
    renderDetail();
    const text = screen.getByTestId('coingecko-attribution').textContent ?? '';
    for (const word of ['partner', 'sponsor', 'endorse', 'official', 'certified']) {
      expect(text.toLowerCase()).not.toContain(word);
    }
  });
});

describe('the attribution cannot be hidden on mobile', () => {
  it('should carry no viewport-conditional or display rule in its stylesheet', () => {
    /* MOBILE / DESKTOP = SAME REQUIREMENT. A media query or a `display: none`
       is how an attribution silently disappears at 375px while every DOM test
       keeps passing — jsdom has no viewport, so a rendering assertion CANNOT
       catch it. Reading the stylesheet is the only instrument that can. The
       viewport matrix in Part E confirms it empirically. */
    const css = readFileSync(join(__dirname, '..', 'CoinGeckoAttribution.module.css'), 'utf8');
    expect(css).not.toContain('@media');
    expect(css.replace(/\s/g, '')).not.toContain('display:none');
    expect(css.replace(/\s/g, '')).not.toContain('visibility:hidden');
  });
});
