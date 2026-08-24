/**
 * Point d'entrée des actions du back-office.
 *
 * Les écrans importent d'ici et ignorent le découpage : `actions.ts` faisait
 * mille lignes et mélangeait la connexion, le catalogue, les téléversements et
 * l'amorçage de la base. Les modules sont séparés par domaine, ce barillet
 * garde les imports existants intacts.
 */
export type { Retour } from "./_socle";

export * from "./session";
export * from "./commandes";
export * from "./catalogue";
export * from "./contenu";
export * from "./medias";
export * from "./amorcage";
