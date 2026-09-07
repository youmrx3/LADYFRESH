"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isAdmin } from "../auth";
import { supabaseAdmin } from "../supabase";
import { messages, type Retour } from "./_socle";

/*
  Types acceptés au téléversement, et l'extension qu'on leur impose.

  Liste fermée, et non « tout ce qui commence par image/ » : le stockage est
  public, un SVG y serait servi tel quel et peut porter du script. L'extension
  est déduite du type validé, jamais du nom de fichier envoyé.
*/
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/webm": "webm",
};
const TYPES_AUTORISES = new Set(Object.keys(EXTENSIONS));

// ------------------------------------------------------------ téléversement

/**
 * Autorise un téléversement direct navigateur → Supabase.
 *
 * Le fichier ne traverse plus le serveur Next. C'est ce qui règle l'échec
 * observé : une action serveur refuse tout corps au-delà de 1 Mo par défaut et
 * la connexion se coupe (ERR_CONNECTION_RESET) — donc n'importe quelle vraie
 * photo produit. Relever la limite n'aurait déplacé le mur que jusqu'à 4,5 Mo,
 * plafond des fonctions Vercel qu'on ne peut pas lever : ça aurait marché en
 * local et cassé en production.
 *
 * Le serveur ne rend qu'une URL signée, courte et à usage unique. La clé
 * service-role ne quitte jamais le serveur, et seul un admin connecté peut en
 * obtenir une.
 */
export async function urlDeTeleversement(
  nom: string,
  type: string,
): Promise<{ url?: string; publicUrl?: string; error?: string }> {
  const m = await messages();
  if (!(await isAdmin())) return { error: m.sessionExpiree };

  if (!TYPES_AUTORISES.has(type)) return { error: m.formatRefuse };

  const db = supabaseAdmin();
  if (!db) return { error: "supabase-absent" };

  const chemin = `${Date.now()}-${nomPropre(nom, type)}`;
  const { data, error } = await db.storage
    .from("media")
    .createSignedUploadUrl(chemin);
  if (error) return { error: error.message };

  const { data: pub } = db.storage.from("media").getPublicUrl(chemin);
  return { url: data.signedUrl, publicUrl: pub.publicUrl };
}

/** Nom de fichier assaini ; l'extension vient du type MIME validé. */
function nomPropre(nom: string, type: string) {
  const base = nom
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `${base || "fichier"}.${EXTENSIONS[type]}`;
}

/**
 * Envoie un fichier et renvoie son URL publique.
 *
 * Avec Supabase, le fichier part dans le bucket `media`. Sans Supabase, il
 * atterrit dans `public/uploads/` : ça marche en local et sur un serveur
 * classique, pas sur du serverless en lecture seule. C'est ce qui permet de
 * téléverser des images avant même d'avoir branché la base.
 */
export async function televerser(
  _prev: Retour & { url?: string },
  formData: FormData,
): Promise<Retour & { url?: string }> {
  // Hors du `try` : le `catch` en a besoin lui aussi.
  const m = await messages();
  try {
    if (!(await isAdmin())) return { error: m.sessionExpiree };

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0)
      return { error: m.fichierRequis };
    if (file.size > 60 * 1024 * 1024) return { error: m.fichierTropLourd };

    /*
      Liste blanche stricte. Le bucket est public : un SVG ou un HTML servi
      depuis le même domaine exécuterait son script dans le contexte du site.
      On refuse donc tout ce qui n'est pas une image matricielle ou une vidéo,
      SVG compris.
    */
    if (!TYPES_AUTORISES.has(file.type)) return { error: m.formatRefuse };

    const chemin = `${Date.now()}-${nomPropre(file.name, file.type)}`;

    const db = supabaseAdmin();
    if (db) {
      const { error } = await db.storage.from("media").upload(chemin, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "31536000",
      });
      if (error) throw new Error(error.message);
      const { data } = db.storage.from("media").getPublicUrl(chemin);
      return { ok: m.fichierTeleverse, url: data.publicUrl };
    }

    // Repli local : impossible sur un disque en lecture seule, on le dit.
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)
      return { error: m.televersementLocal };
    const dossier = join(process.cwd(), "public", "uploads");
    await mkdir(dossier, { recursive: true });
    await writeFile(join(dossier, chemin), Buffer.from(await file.arrayBuffer()));
    return { ok: m.fichierEnregistre, url: `/uploads/${chemin}` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : m.echec };
  }
}
