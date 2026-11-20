export interface PairingLink {
  serverUrl: string;
  token: string;
}

function hostAndPath(u: URL): string {
  return `${u.hostname}${u.pathname}`.replace(/\/+$/, "").replace(/^\/+/, "");
}

/** Parse tangramfitplug://pair?url=<encoded>&token=<token>. Returns null when the link is incomplete. */
export function parsePairingLink(url: string): PairingLink | null {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.protocol !== "tangramfitplug:") return null;
  if (hostAndPath(u) !== "pair") return null;
  const serverUrl = u.searchParams.get("url")?.trim() ?? "";
  const token = u.searchParams.get("token")?.trim() ?? "";
  if (!serverUrl || !token) return null;
  return { serverUrl, token };
}

export function serverHost(serverUrl: string): string {
  try {
    return new URL(serverUrl).hostname;
  } catch {
    return serverUrl;
  }
}
