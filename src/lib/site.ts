/**
 * L'adresse publique du site.
 *
 * `NEXT_PUBLIC_SITE_URL` quand elle est posée — c'est la même variable que
 * l'email emploie déjà pour son lien vers le back-office — et le domaine de la
 * marque sinon, qui est aussi ce que `metadataBase` déclare. La barre finale
 * est retirée : `${SITE_URL}/sitemap.xml` ne doit pas produire un double slash.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ladyfresh.dz"
).replace(/\/+$/, "");
