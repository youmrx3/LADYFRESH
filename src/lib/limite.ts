/**
 * Limiteur de débit, volontairement sans dépendance Node : ce module tourne
 * dans le middleware, donc sur le runtime Edge.
 *
 * Portée réelle : la mémoire est propre à chaque instance. Sur Vercel, un
 * attaquant réparti sur plusieurs instances obtient plus d'essais que la
 * limite affichée, et le compteur repart à zéro après un démarrage à froid.
 * Ça arrête un script naïf, pas une attaque distribuée. Pour un vrai plafond,
 * remplacer la Map par Vercel KV ou Upstash — la signature ne change pas.
 */
const compteurs = new Map<string, { n: number; jusqu: number }>();

export function limiteDepassee(cle: string, max: number, fenetreMs: number) {
  const maintenant = Date.now();
  const actuel = compteurs.get(cle);

  if (!actuel || actuel.jusqu < maintenant) {
    compteurs.set(cle, { n: 1, jusqu: maintenant + fenetreMs });
    return false;
  }
  actuel.n += 1;

  // Purge opportuniste : sans elle la Map grossit indéfiniment.
  if (compteurs.size > 5000) {
    for (const [k, v] of compteurs) if (v.jusqu < maintenant) compteurs.delete(k);
  }
  return actuel.n > max;
}

/** IP du client derrière le proxy Vercel, sinon une clé de repli. */
export function ipDe(headers: Headers) {
  const avant = headers.get("x-forwarded-for");
  if (avant) return avant.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "inconnue";
}
