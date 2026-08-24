"use server";

import { redirect } from "next/navigation";
import { authConfiguree, clientAuth, verdictAdmin } from "../auth";
import { limiteDepassee } from "../limite";
import { mot, type Retour } from "./_socle";

// ----------------------------------------------------------------- connexion

export async function seConnecter(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  if (!authConfiguree) {
    return {
      error:
        "Supabase n'est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY chez l'hébergeur, puis redéployez.",
    };
  }

  const email = mot(formData, "email").toLowerCase();
  const password = mot(formData, "password");
  if (!email || !password) return { error: "Adresse et mot de passe requis." };

  /*
    Bridage global des échecs, pas par IP.

    `headers()` est inutilisable dans une action passée à useActionState, et le
    middleware ne peut pas intercepter les POST d'actions sans leur faire perdre
    leur portée de requête. Sans IP, on compte donc les échecs toutes origines
    confondues : un attaquant peut gêner la propriétaire un quart d'heure, mais
    ne peut plus parcourir un dictionnaire. Les réussites ne comptent pas.
  */
  if (limiteDepassee("login:echecs", 30, 15 * 60 * 1000)) {
    return { error: "Trop de tentatives récentes. Réessayez dans quelques minutes." };
  }

  const supabase = await clientAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    limiteDepassee("login:echecs", 30, 15 * 60 * 1000);
    /*
      Message volontairement identique pour un compte inconnu et un mot de
      passe faux : distinguer les deux dirait à un inconnu quelles adresses
      existent.
    */
    return { error: "Adresse ou mot de passe incorrect." };
  }

  /*
    Le compte existe, mais est-il gestionnaire ? Si les inscriptions publiques
    sont ouvertes sur le projet Supabase, n'importe qui a pu s'en créer un.
  */
  const verdict = await verdictAdmin(email);
  if (!verdict.autorisee) {
    await supabase.auth.signOut();
    const motifs = {
      "table-absente":
        "La table `admins` n'existe pas encore. Exécutez supabase/schema.sql dans Supabase, puis ajoutez-y cette adresse.",
      "pas-de-cle":
        "SUPABASE_SERVICE_ROLE_KEY est absente du déploiement : impossible de vérifier les droits. Renseignez-la chez l'hébergeur puis redéployez.",
      inconnue: `Le compte existe mais n'a pas accès à la gestion. Ajoutez ${email} dans la table \`admins\` de Supabase.`,
    } as const;
    return { error: motifs[verdict.raison] };
  }

  redirect("/admin");
}

export async function seDeconnecter() {
  const supabase = await clientAuth();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
