'use client';

/**
 * Minimal Navigation Component
 *
 * A simplified navigation variant for landing pages that displays only:
 * - Logo (linked to home)
 * - Language switcher
 * - CTA button (opens waiting list modal)
 *
 * Used for B2C/B2B landing pages where full navigation is not needed.
 */

import Image from 'next/image';
import { useIntl } from 'react-intl';
import { Button } from '@diboas/ui';
import { Container, FlexBetween, LocaleLink } from '@/components/UI';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useWaitingListModal } from '@/components/WaitingList';
import { ASSET_PATHS } from '@/config/assets';
import { BRAND_CONFIG } from '@/config/brand';
import { DEFAULT_CTA_PROPS } from '@/config/cta';

export default function MinimalNavigation() {
  const intl = useIntl();
  const { openModal } = useWaitingListModal();

  return (
    <nav className="minimal-navigation-bar" aria-label="Main navigation">
      <Container>
        <FlexBetween className="minimal-navigation-content">
          {/* Logo */}
          <LocaleLink href="/" className="brand-logo" aria-label={`${BRAND_CONFIG.NAME} Home`}>
            <Image
              src={ASSET_PATHS.LOGOS.ICON}
              alt={BRAND_CONFIG.NAME}
              width={76}
              height={76}
              style={{ width: 'auto', height: 'auto', maxHeight: '76px' }}
              priority
            />
          </LocaleLink>

          {/* Actions: Language Switcher + CTA */}
          <div className="minimal-nav-actions">
            <LanguageSwitcher variant="dropdown" size="sm" />
            <Button
              variant={DEFAULT_CTA_PROPS.variant}
              size="sm"
              trackable={DEFAULT_CTA_PROPS.trackable}
              onClick={openModal}
              className="minimal-nav-cta"
            >
              {intl.formatMessage({ id: 'common.navigation.joinWaitlist' })}
            </Button>
          </div>
        </FlexBetween>
      </Container>
    </nav>
  );
}
