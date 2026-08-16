/**
 * Ce qui distingue une piste d'une autre : le numéro de téléphone.
 *
 * La clé de reprise vivait d'abord dans le navigateur. Erreur de conception :
 * elle identifiait l'appareil, pas la personne. Deux clientes qui commandent
 * depuis le même téléphone — la boutique elle-même, une amie à qui on prête
 * l'écran — n'en formaient qu'une seule, la seconde écrasant la première. Une
 * piste sur deux disparaissait sans laisser de trace.
 *
 * C'est donc le numéro qui fait la clé, et lui seul. Deux numéros, deux
 * lignes, quel que soit l'appareil. Le même numéro qui revient met à jour sa
 * propre ligne plutôt que d'en empiler une par visite.
 */

/**
 * Le numéro sous une forme unique, ou null s'il n'est pas encore complet.
 *
 * Enregistrer un numéro à moitié tapé créerait une ligne par état
 * intermédiaire : « 0770112 », puis « 07701122 », puis le vrai. On n'accepte
 * donc qu'un mobile algérien entier — dix chiffres commençant par 05, 06 ou
 * 07 — et l'indicatif +213 est ramené à la forme locale pour que les deux
 * écritures d'un même numéro se rejoignent.
 */
export function numeroNormalise(brut: string): string | null {
  let chiffres = (brut ?? "").replace(/\D/g, "");
  if (chiffres.startsWith("00213")) chiffres = chiffres.slice(5);
  else if (chiffres.startsWith("213")) chiffres = chiffres.slice(3);
  if (chiffres.length === 9 && /^[5-7]/.test(chiffres)) chiffres = `0${chiffres}`;
  return /^0[5-7]\d{8}$/.test(chiffres) ? chiffres : null;
}
