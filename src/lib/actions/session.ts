"use server";

import { redirect } from "next/navigation";
import { authConfiguree, clientAuth, verdictAdmin } from "../auth";
import { limiteDepassee } from "../limite";
import { fill } from "@/i18n";
import { messages, mot, type Retour } from "./_socle";

// ----------------------------------------------------------------- connexion

export async function seConnecter(
  _prev: Retour,
  formData: FormData,
): Promise<Retour> {
  const m = await messages();
  if (!authConfiguree) return { error: m.authNonConfiguree };

  const email = mot(formData, "email").toLowerCase();
  const password = mot(formData, "password");
  if (!email || !password) return { error: m.identifiantsRequis };

  /*
    Bridage global des échecs, pas par IP.

    `headers()` est inutilisable dans une action passée à useActionState, et le
    middleware ne peut pas intercepter les POST d'actions sans leur faire perdre
    leur portée de requête. Sans IP, on compte donc les échecs toutes origines
    confondues : un attaquant peut gêner la propriétaire un quart d'heure, mais
    ne peut plus parcourir un dictionnaire. Les réussites ne comptent pas.
  */
  if (limiteDepassee("login:echecs", 30, 15 * 60 * 1000)) {
    return { error: m.tropDeTentatives };
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
    return { error: m.identifiantsInvalides };
  }

  /*
    Le compte existe, mais est-il gestionnaire ? Si les inscriptions publiques
    sont ouvertes sur le projet Supabase, n'importe qui a pu s'en créer un.
  */
  const verdict = await verdictAdmin(email);
  if (!verdict.autorisee) {
    await supabase.auth.signOut();
    const motifs = {
      "table-absente": m.adminsTableAbsente,
      "pas-de-cle": m.adminsPasDeCle,
      inconnue: fill(m.adminsInconnue, { email }),
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
