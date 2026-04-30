/**
 * Twitter Card Metadata Helper
 * Code Reusability: Shared across all page generateMetadata functions
 */
export function getTwitterMeta(title: string, description: string, image: string) {
  return {
    card: 'summary_large_image' as const,
    site: '@diboasfi',
    creator: '@bribeiro_br',
    title,
    description,
    images: [image],
  };
}
