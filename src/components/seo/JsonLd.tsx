/**
 * Server-rendered JSON-LD. Owner: pages-lead. A plain <script type="application/ld+json">: no client JavaScript.
 * "<" is escaped so no value can close the script element.
 */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
