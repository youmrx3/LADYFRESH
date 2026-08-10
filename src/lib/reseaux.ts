/**
 * Liens vers les réseaux sociaux.
 *
 * Le champ du back-office est libre : on y tape « lady.fresh.mfp », parfois
 * « @lady.fresh.mfp », parfois « instagram.com/lady.fresh.mfp », rarement
 * l'adresse complète. Sans protocole, un href est un chemin relatif — le
 * navigateur lit « lady.fresh.mfp » comme une page du site et emmène sur
 * ladyfresh.vercel.app/lady.fresh.mfp au lieu du profil.
 *
 * Plutôt que d'exiger une adresse parfaite de la personne qui remplit le
 * formulaire, on accepte les quatre écritures et on complète ici.
 */

export type Reseau = "instagram" | "facebook" | "tiktok";

const BASES: Record<Reseau, { profil: string; hotes: string[] }> = {
  instagram: {
    profil: "https://www.instagram.com/",
    hotes: ["instagram.com", "www.instagram.com", "instagr.am"],
  },
  facebook: {
    profil: "https://www.facebook.com/",
    hotes: [
      "facebook.com",
      "www.facebook.com",
      "m.facebook.com",
      "web.facebook.com",
      "fb.com",
      "fb.me",
    ],
  },
  tiktok: {
    // Le « @ » fait partie du chemin d'un profil TikTok, pas de l'identifiant.
    profil: "https://www.tiktok.com/@",
    hotes: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com"],
  },
};

/** Rend une adresse absolue, ou null si le champ est vide. */
export function lienReseau(
  valeur: string | null | undefined,
  reseau: Reseau,
): string | null {
  const brut = (valeur ?? "").trim();
  if (!brut) return null;

  // Adresse déjà complète : on n'y touche pas.
  if (/^https?:\/\//i.test(brut)) return brut;

  const { profil, hotes } = BASES[reseau];

  // « instagram.com/lady.fresh.mfp » : il ne manque que le protocole.
  const hote = brut.split("/")[0].toLowerCase();
  if (hotes.includes(hote)) return `https://${brut}`;

  // Sinon c'est un identifiant. Attention : un identifiant contient souvent
  // des points (« lady.fresh.mfp ») — le confondre avec un nom de domaine
  // fabriquerait https://lady.fresh.mfp, qui ne mène nulle part.
  return profil + brut.replace(/^@+/, "");
}
