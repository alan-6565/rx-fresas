// One shared staff password (ADMIN_PASSWORD). The cookie holds a signature of
// it rather than the password itself, and changing the password signs
// everyone out. Web Crypto so it runs in the proxy and in routes alike.

export const ADMIN_COOKIE = "rx_admin";

export async function adminToken(password = process.env.ADMIN_PASSWORD): Promise<string | null> {
  if (!password) return null;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("rx-fresas-admin-v1"));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isAdminToken(value: string | undefined): Promise<boolean> {
  const expected = await adminToken();
  if (!value || !expected || value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
