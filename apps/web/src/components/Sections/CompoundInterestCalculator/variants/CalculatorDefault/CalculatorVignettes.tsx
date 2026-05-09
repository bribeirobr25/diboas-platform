'use client';

import { useTranslation } from '@diboas/i18n/client';
import styles from './CalculatorDefault.module.css';

interface VignetteRow {
  habit: string;
  yearly: string;
  twelveYear: string;
}

/**
 * Beat 2's static vignettes table.
 *
 * Numbers come from translation strings (locked editorial copy per CMO §4),
 * not from the calculator engine. The calculator below the lesson produces
 * formula-precise output for whatever the user inputs.
 */
export function CalculatorVignettes() {
  const intl = useTranslation();

  // react-intl returns strings, so vignettes are read as a JSON-encoded array.
  // The translation namespace stores them as a real array; loadPageNamespaces
  // flattens them into "namespace.beat2.vignettes.0.habit", so we read each
  // row by index here.
  const headers = {
    habit: intl.formatMessage({ id: 'learn-compound-interest.beat2.vignettesTableHeaders.habit' }),
    yearly: intl.formatMessage({ id: 'learn-compound-interest.beat2.vignettesTableHeaders.yearly' }),
    twelveYear: intl.formatMessage({ id: 'learn-compound-interest.beat2.vignettesTableHeaders.twelveYear' }),
  };

  const rows: VignetteRow[] = [0, 1, 2].map((i) => ({
    habit: intl.formatMessage({ id: `learn-compound-interest.beat2.vignettes.${i}.habit` }),
    yearly: intl.formatMessage({ id: `learn-compound-interest.beat2.vignettes.${i}.yearly` }),
    twelveYear: intl.formatMessage({ id: `learn-compound-interest.beat2.vignettes.${i}.twelveYear` }),
  }));

  return (
    <table className={styles.vignettesTable}>
      <thead>
        <tr>
          <th scope="col">{headers.habit}</th>
          <th scope="col">{headers.yearly}</th>
          <th scope="col">{headers.twelveYear}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.habit}>
            <th scope="row">{row.habit}</th>
            <td>{row.yearly}</td>
            <td className={styles.vignetteHighlight}>{row.twelveYear}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
