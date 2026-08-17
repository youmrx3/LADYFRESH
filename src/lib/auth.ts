import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAdmin } from "./supabase";

/**
 * L'accès au back-office, tenu par Supabase.
 *
 * Auparavant : un mot de passe unique dans une variable d'environnement, et un
 * cookie signé maison. Ça marchait, mais tout le monde partageait le même
 * secret, le changer déconnectait tout le monde, et rien ne disait qui s'était
 * connecté. Supabase gère déjà des comptes pour ce site — autant s'en servir.
 *
 * Deux conditions, et les deux sont nécessaires :
 *
 * — une session Supabase valide, donc un compte qui existe et un mot de passe
 *   juste ;
 * — cette adresse inscrite dans la table `admins`.
 *
 * La seconde n'est pas une formalité. Si les inscriptions publiques sont
 * ouvertes sur le projet Supabase — c'est le réglage par défaut — n'importe qui
 * peut se créer un compte. Sans la table, ce compte ouvrirait le back-office.
 * La table est lue avec la clé de service : personne ne peut s'y ajouter depuis
 * un navigateur.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/** True quand Supabase peut porter l'authentification. */
export const authConfiguree = Boolean(url && anonKey);

/**
 * Client lié aux cookies de la requête.
 *
 * Supabase y écrit le jeton de session et son rafraîchissement. En lecture
 * seule — page rendue, et non action serveur — Next interdit l'écriture : on
 * avale l'erreur, la session reste valable pour la requête en cours et sera
 * réécrite au prochain passage par une action.
 */
export async function clientAuth() {
  const store = await cookies();
  return createServerClient(url!, anonKey!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (liste: { name: string; value: string; options: CookieOptions }[]) => {
        try {
          for (const { name, value, options } of liste) {
            store.set(name, value, options);
          }
        } catch {
          // Contexte de rendu : rien à écrire, ce n'est pas une erreur.
        }
      },
    },
  });
}

export type Verdict =
  | { autorisee: true }
  | { autorisee: false; raison: "inconnue" | "table-absente" | "pas-de-cle" };

/**
 * L'adresse est-elle autorisée à gérer la boutique ?
 *
 * Rend un motif et non un simple non : refuser sans dire pourquoi enverrait
 * chercher dans les journaux de l'hébergeur, alors que la cause est presque
 * toujours une étape de mise en place oubliée.
 */
export async function verdictAdmin(email: string | undefined): Promise<Verdict> {
  if (!email) return { autorisee: false, raison: "inconnue" };
  const db = supabaseAdmin();
  // Sans clé de service, impossible de vérifier : on refuse plutôt que d'ouvrir.
  if (!db) return { autorisee: false, raison: "pas-de-cle" };

  const { data, error } = await db
    .from("admins")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (error) {
    const absente = /could not find the table|does not exist/i.test(error.message);
    if (!absente) console.error("[auth] table `admins` illisible —", error.message);
    return { autorisee: false, raison: absente ? "table-absente" : "inconnue" };
  }
  return data ? { autorisee: true } : { autorisee: false, raison: "inconnue" };
}

/**
 * La personne devant l'écran peut-elle gérer la boutique ?
 *
 * `getUser()` et non `getSession()` : le premier fait vérifier le jeton par
 * Supabase, le second se contente de lire le cookie — qu'un navigateur peut
 * avoir forgé.
 */
export async function isAdmin() {
  if (!authConfiguree) return false;
  try {
    const supabase = await clientAuth();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    return (await verdictAdmin(user.email)).autorisee;
  } catch {
    return false;
  }
}

/** L'adresse connectée, pour l'afficher dans le back-office. */
export async function emailConnecte(): Promise<string | null> {
  if (!authConfiguree) return null;
  try {
    const supabase = await clientAuth();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.email ?? null;
  } catch {
    return null;
  }
}
