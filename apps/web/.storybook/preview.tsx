import type { Preview, Decorator } from '@storybook/nextjs';
import type { SupportedLocale } from '@diboas/i18n/config';
import { I18nProvider, LocaleProvider } from '../src/components/Providers';
import { STORYBOOK_MESSAGES } from './i18n-messages';
import '../src/styles/design-tokens.css';
import '../src/app/globals.css';

// i18n decorator (Phase 3A PR-3A, 2026-05-18) — wraps every story in the
// app's canonical I18nProvider + LocaleProvider so calculator components
// using `intl.formatMessage` render localized copy. Imports flow through
// `@/components/Providers` per audit CC1+L10 (NOT raw `react-intl`).
//
// `key={locale}` (L15) forces LocaleProvider remount on locale switch —
// defensive future-proofing since current calculators only read `locale`
// (not `isHydrated`), but the remount cost is trivial in Storybook.
const i18nDecorator: Decorator = (Story, context) => {
  const locale = (context.globals.locale ?? 'en') as SupportedLocale;
  const messages = STORYBOOK_MESSAGES[locale];
  return (
    <LocaleProvider key={locale} initialLocale={locale}>
      <I18nProvider locale={locale} messages={messages}>
        <Story />
      </I18nProvider>
    </LocaleProvider>
  );
};

const themeDecorator: Decorator = (_Story, context) => {
  const theme = context.globals.theme;
  return (
    <div data-theme={theme} style={{ minHeight: '100vh' }}>
      <_Story />
    </div>
  );
};

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      description: {
        component: 'Section components built with the Component Factory Pattern',
      },
    },
    viewport: {
      viewports: {
        mobile: { name: 'Mobile', styles: { width: '390px', height: '844px' } },
        tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' } },
        desktop: { name: 'Desktop', styles: { width: '1920px', height: '1080px' } },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1f2937' },
        { name: 'gray', value: '#f9fafb' },
      ],
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
          { value: 'high-contrast', title: 'High Contrast' },
          { value: 'dark-high-contrast', title: 'Dark High Contrast' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Active locale for i18n strings',
      defaultValue: 'en',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en', title: 'English' },
          { value: 'pt-BR', title: 'Portuguese (BR)' },
          { value: 'es', title: 'Spanish' },
          { value: 'de', title: 'German' },
        ],
        dynamicTitle: true,
      },
    },
  },
  // i18n decorator OUTERMOST so its providers are in scope of the theme
  // wrapper, and so the locale switcher's effect propagates to every story.
  decorators: [i18nDecorator, themeDecorator],
};

export default preview;
