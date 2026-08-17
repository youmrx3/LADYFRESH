/**
 * Ce qui distingue une piste de rappel d'une autre.
 *
 * Deux tentatives ont échoué avant celle-ci, et chacune perdait des clientes :
 *
 * — Une clé tirée au sort et gardée dans le navigateur identifiait l'appareil,
 *   pas la personne. Deux clientes servies depuis le même téléphone n'en
 *   faisaient qu'une, la seconde effaçant la première.
 *
 * — Le numéro seul corrigeait ce point mais en créait un autre : une même
 *   cliente qui repasse commande met à jour sa ligne au lieu d'en ouvrir une.
 *   Sur le comptoir, où l'on enchaîne les commandes depuis le même écran, la
 *   liste ne bougeait plus.
 *
 * La clé est donc double : une session, et le numéro. La session change à
 * chaque commande envoyée — la suivante repart de zéro, et une commande de
 * plus est toujours une ligne de plus. Le numéro sépare deux clientes servies
 * dans la même session. Ce qui reste groupé, et c'est le seul but, ce sont les
 * frappes successives d'une même personne en train de remplir le formulaire.
 */
const CLE_SESSION = "ladyfresh.session";

function aleatoire() {
  try {
    return crypto.randomUUID().slice(0, 8);
  } catch {
    // Contexte non sécurisé ou navigateur ancien : le hasard suffit ici.
    return Math.random().toString(36).slice(2, 10);
  }
}

/** La session en cours, créée au besoin. */
function sessionCourante(): string {
  if (typeof window === "undefined") return "";
  try {
    const existante = localStorage.getItem(CLE_SESSION);
    if (existante) return existante;
    const neuve = aleatoire();
    localStorage.setItem(CLE_SESSION, neuve);
    return neuve;
  } catch {
    // Navigation privée : pas de regroupement, chaque envoi fera sa ligne.
    return aleatoire();
  }
}

/**
 * La commande est partie : la session se termine.
 *
 * Sans cette rotation, la commande suivante — même passée dix secondes plus
 * tard pour quelqu'un d'autre — retomberait sur la ligne précédente.
 */
export function terminerSession() {
  try {
    localStorage.removeItem(CLE_SESSION);
  } catch {
    // Rien à effacer si rien n'a pu être écrit.
  }
}

/**
 * Le numéro sous une forme unique, ou null s'il n'est pas encore complet.
 *
 * Enregistrer un numéro à moitié tapé créerait une ligne par état
 * intermédiaire. On n'accepte donc qu'un mobile algérien entier — dix chiffres
 * commençant par 05, 06 ou 07 — et l'indicatif +213 est ramené à la forme
 * locale pour que les deux écritures d'un même numéro se rejoignent.
 */
export function numeroNormalise(brut: string): string | null {
  let chiffres = (brut ?? "").replace(/\D/g, "");
  if (chiffres.startsWith("00213")) chiffres = chiffres.slice(5);
  else if (chiffres.startsWith("213")) chiffres = chiffres.slice(3);
  if (chiffres.length === 9 && /^[5-7]/.test(chiffres)) chiffres = `0${chiffres}`;
  return /^0[5-7]\d{8}$/.test(chiffres) ? chiffres : null;
}

/** La clé de la piste : session + numéro. Vide si le numéro n'est pas complet. */
export function clePiste(telephone: string): string {
  const numero = numeroNormalise(telephone);
  return numero ? `${sessionCourante()}:${numero}` : "";
}
