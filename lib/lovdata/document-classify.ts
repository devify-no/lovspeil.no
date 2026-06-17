/**
 * Amendment acts ("Lov om endringer i …") are imported for reference resolution
 * but should not appear as browsable primary laws.
 */
export function isAmendmentDocument(title: string): boolean {
  return (
    /^lov om endring(er)?\s+i\s+/i.test(title) ||
    /^forskrift om endring(er)?\s+i\s+/i.test(title)
  );
}
