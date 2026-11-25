import { describe, expect, it } from 'vitest';
import { scrubAnalyticsEvent } from '../scrubAnalyticsEvent';

describe('scrubAnalyticsEvent (PostHog before_send, 5.864)', () => {
  it('should strip tokens from every URL-valued property, person properties included', () => {
    const event = scrubAnalyticsEvent({
      properties: {
        $current_url: 'https://diboas.com/en/delete-confirm?token=abc',
        $pathname: '/en/delete-confirm',
        $referrer: 'https://diboas.com/pt-BR/email-preferences?t=x&utm_source=mail',
        $prev_pageview_url: 'https://diboas.com/en?utm_source=Mail&t=x',
        plan: 'free',
        count: 3,
      },
      $set: { $current_url: '/en/email-preferences?t=x' },
      $set_once: { $initial_current_url: 'https://diboas.com/?ref=REFABCD12&token=1' },
    });
    expect(event.properties).toEqual({
      $current_url: 'https://diboas.com/en/delete-confirm',
      $pathname: '/en/delete-confirm',
      $prev_pageview_url: 'https://diboas.com/en?utm_source=mail',
      plan: 'free',
      count: 3,
    });
    expect(event.$set).toEqual({ $current_url: '/en/email-preferences' });
    expect(event.$set_once).toEqual({ $initial_current_url: 'https://diboas.com/?ref=REFABCD12' });
  });

  it('should pass a null event and an event without properties through', () => {
    expect(scrubAnalyticsEvent(null)).toBeNull();
    expect(scrubAnalyticsEvent({})).toEqual({});
  });
});

describe('scrubAnalyticsEvent: campaign values and referrers (W-D1, 5.924, DR G3)', () => {
  it('should keep only shaped campaign values in URLs, at any depth', () => {
    const event = scrubAnalyticsEvent({
      properties: {
        $current_url: 'https://diboas.com/en?utm_source=Bad!&utm_source=ok&utm%5Fmedium=x',
        nested: { url: '/en?a=1?utm_campaign=Spring' },
      },
    });
    expect(event.properties).toEqual({
      $current_url: 'https://diboas.com/en',
      nested: { url: '/en?utm_campaign=spring' },
    });
  });

  it('should shape or drop every property named a campaign key or ending in one', () => {
    const event = scrubAnalyticsEvent({
      properties: { utm_source: ' Newsletter ', utm_medium: 'two words', utm_id: 'kept' },
      $set: { $initial_utm_campaign: 'Spring', $initial_utm_term: 7 },
      $set_once: { $session_entry_utm_content: 'a'.repeat(40) },
    });
    expect(event.properties).toEqual({ utm_source: 'newsletter', utm_id: 'kept' });
    expect(event.$set).toEqual({ $initial_utm_campaign: 'spring' });
    expect(event.$set_once).toEqual({});
  });

  it('should remove every referrer-derived property, in every form', () => {
    const event = scrubAnalyticsEvent({
      properties: {
        $referrer: 'https://www.bing.com/search?q=x',
        $referring_domain: 'www.bing.com',
        $search_engine: 'bing',
        ph_keyword: 'x',
        $session_entry_referrer: 'https://www.bing.com/search?q=x',
        $session_entry_referring_domain: 'www.bing.com',
        $session_entry_search_engine: 'bing',
        $session_entry_ph_keyword: 'x',
        $pathname: '/en',
      },
      $set: { $referrer: 'x', $referring_domain: 'y' },
      $set_once: {
        $initial_referrer: 'x',
        $initial_referring_domain: 'y',
        $initial_search_engine: 'z',
        $initial_ph_keyword: 'k',
      },
    });
    expect(event.properties).toEqual({ $pathname: '/en' });
    expect(event.$set).toEqual({});
    expect(event.$set_once).toEqual({});
    expect(JSON.stringify(event)).not.toContain('bing');
  });
});

describe('scrubAnalyticsEvent at depth (thirteenth audit)', () => {
  it('should scrub nested URLs and URL-valued keys (web vitals, heatmaps, exceptions)', () => {
    const event = scrubAnalyticsEvent({
      properties: {
        $web_vitals_LCP_event: { $current_url: 'https://diboas.com/en/delete-confirm?token=V' },
        $heatmap_data: { 'https://diboas.com/en/delete-confirm?token=H': [{ x: 1 }] },
        $exception_list: [{ stacktrace: { frames: [{ filename: '/en/email-preferences?t=E' }] } }],
        label: 'plain text?t=keep',
      },
    });
    const json = JSON.stringify(event);
    for (const secret of ['token=V', 'token=H', 't=E']) expect(json).not.toContain(secret);
    expect((event.properties as Record<string, unknown>).label).toBe('plain text?t=keep');
    expect(Object.keys((event.properties as { $heatmap_data: object }).$heatmap_data)).toEqual([
      'https://diboas.com/en/delete-confirm',
    ]);
  });
});

it('should stop descending past its depth limit rather than recurse without end', () => {
  let deep: Record<string, unknown> = { leaf: '/x?t=1' };
  for (let i = 0; i < 12; i += 1) deep = { d: deep };
  expect(() => scrubAnalyticsEvent({ properties: deep })).not.toThrow();
});
