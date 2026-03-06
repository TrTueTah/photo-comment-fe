export function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function userFromToken(accessToken: string): {
  id: string;
  name: string;
  email: string;
} {
  const claims = decodeJwtPayload(accessToken);
  return {
    id: String(claims.sub ?? ""),
    name: String(claims.name ?? ""),
    email: String(claims.email ?? ""),
  };
}
