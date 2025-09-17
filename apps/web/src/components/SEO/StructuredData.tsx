/**
 * Structured Data Component
 * SEO: Injects JSON-LD structured data into pages
 * Performance: Pre-computed data for faster rendering
 */

interface StructuredDataProps {
  data: any | any[];
}

export function StructuredData({ data }: StructuredDataProps) {
  // Handle both single objects and arrays
  const dataArray = Array.isArray(data) ? data : [data];

  return (
    <>
      {dataArray.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item)
          }}
        />
      ))}
    </>
  );
}