/**
 * Shared i18n Type Definitions
 *
 * Typed alternatives to Record<string, any> for stronger type safety
 * across the i18n package.
 */

/**
 * Recursive type representing a nested i18n message object.
 * Leaf values are always strings; intermediate nodes are nested objects.
 *
 * Example:
 * {
 *   "common": {
 *     "greeting": "Hello, {name}!"
 *   },
 *   "title": "Welcome"
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IntlMessages = Record<string, any>;

/**
 * Flat message map compatible with react-intl's IntlProvider.
 * Used after messages have been flattened (e.g., via flattenMessages).
 */
export type FlatIntlMessages = Record<string, string>;

/**
 * Values that can be interpolated into ICU message format strings.
 * Covers the standard react-intl value types.
 */
export type MessageFormatValues = Record<
  string,
  string | number | boolean | Date | null | undefined
>;
