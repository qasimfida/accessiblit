/** Logging must not become another exception path into a host application. */
export function createReporter(): (key: string, message: string) => void {
  const seen = new Set<string>();
  return (key, message) => {
    if (seen.has(key)) return;
    seen.add(key);
    try {
      console.warn(`[Accessiblit] ${message}`);
    } catch {
      /* A host may replace console. */
    }
  };
}
