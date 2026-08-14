import { FormattedMessage } from 'react-intl';
import styles from './ModeChip.module.css';

/**
 * The persistent "Sandbox · play money" mode chip (design-system primitive,
 * slice A1). Mode-confusion is the one real safety risk (moving real money by
 * accident), so this label is ONE lexicon and appears on every surface — the
 * app shell (AppChrome) and standalone screens (Welcome) share this component
 * rather than each inlining the badge. Sea-green pill, sentence case, matching
 * the approved mockups; text uses the accessible teal-600 for contrast on the
 * pale tint.
 */
export function ModeChip() {
  return (
    <span className={styles.chip}>
      <FormattedMessage id="common.playBadge" />
    </span>
  );
}
