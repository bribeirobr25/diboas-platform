/**
 * Structured Data Component
 * SEO: Injects JSON-LD structured data into pages
 * Performance: Pre-computed data for faster rendering
 */

interface StructuredDataProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

export function StructuredData({ data }: StructuredDataProps) {
  // Handle both single objects and arrays
  const dataArray = Array.isArray(data) ? data : [data];

  return (
    <>
      {/* Stable: structured-data items are emitted once per render, never
       * reordered or sliced. Using index avoids JSON.stringify-keying each
       * payload (which is up to a few KB per JSON-LD document). */}
      {dataArray.map((item, index) => (
        <script
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}
