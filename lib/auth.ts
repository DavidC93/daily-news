import { NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "admin_session";

function getApiKey(): string {
  const key = process.env.NEWS_API_KEY;
  if (!key) throw new Error("NEWS_API_KEY is not set");
  return key;
}

export function checkApiKey(req: NextRequest): boolean {
  const header = req.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return false;
  try {
    return timingSafeEqual(token, getApiKey());
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEWS_API_KEY || "";
  if (!secret) throw new Error("ADMIN_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyAdminSessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return verifyAdminSessionToken(token);
}

export const ADMIN_COOKIE_NAME = ADMIN_COOKIE;

export async function isWriteAuthorized(req: NextRequest): Promise<boolean> {
  if (checkApiKey(req)) return true;
  return isAdminAuthed();
}
