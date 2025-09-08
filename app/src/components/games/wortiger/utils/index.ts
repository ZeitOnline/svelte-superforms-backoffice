/**
 * Create a CSV string from rows. Uses semicolon (;) which plays nicer with German
 * locales in Excel. Fields are quoted and quotes are escaped.
 */
export function toCSV(rows: Array<Array<string | number>>, delimiter = ';'): string {
  const quote = (v: string | number) => `"${String(v).replaceAll('"', '""')}"`;
  return rows.map(r => r.map(quote).join(delimiter)).join('\r\n');
}
