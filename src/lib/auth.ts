import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "lf_admin";
const MAX_AGE = 60 * 60 * 12; // 12 h

function secret() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

/** Le mot de passe admin. Sans lui, le back-office refuse toute requête. */
export function adminPassword() {
  return process.env.ADMIN_PASSWORD || null;
}

function sign(payload: string) {
  return createHmac("sha256", secret()!).update(payload).digest("hex");
}

/**
 * Comparaison à temps constant. Un `===` sur une chaîne s'arrête au premier
 * caractère différent : le temps de réponse trahit alors le préfixe correct,
 * ce qui suffit à reconstruire un secret octet par octet.
 */
export function comparaisonSure(a: string, b: string) {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual exige des longueurs égales ; on hache pour les égaliser
  // sans révéler la longueur attendue.
  const ha = createHmac("sha256", "compare").update(bufA).digest();
  const hb = createHmac("sha256", "compare").update(bufB).digest();
  return timingSafeEqual(ha, hb);
}

export function issueToken() {
  const expires = Date.now() + MAX_AGE * 1000;
  // Un aléa par session : deux connexions ne partagent pas le même jeton, et
  // le jeton ne se devine pas à partir de l'horodatage seul.
  const nonce = randomBytes(9).toString("base64url");
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function tokenIsValid(token: string | undefined) {
  if (!token || !secret()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  return comparaisonSure(signature, sign(`${expires}.${nonce}`));
}

export async function isAdmin() {
  const store = await cookies();
  return tokenIsValid(store.get(ADMIN_COOKIE)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
