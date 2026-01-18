export function ensureE2EParam(url: string) {
  const u = new URL(url);
  if (!u.searchParams.has("e2e")) u.searchParams.set("e2e", "1");
  return u.toString();
}

export function validateGameUrlAllowlist(url: string, allowDomains: string[]) {
  try {
    const u = new URL(url);
    return allowDomains.some(d => u.hostname === d || u.hostname.endsWith("." + d));
  } catch {
    return false;
  }
}
