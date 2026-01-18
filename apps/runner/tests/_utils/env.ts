export function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function withE2E(url: string): string {
  const u = new URL(url);
  u.searchParams.set("e2e", "1");
  return u.toString();
}
