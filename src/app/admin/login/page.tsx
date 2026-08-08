import Image from "next/image";
import { redirect } from "next/navigation";
import { FormulaireConnexion } from "./FormulaireConnexion";
import { adminPassword, isAdmin } from "@/lib/auth";

export const metadata = { title: "Connexion" };

export default async function Connexion() {
  if (await isAdmin()) redirect("/admin");
  const configure = Boolean(adminPassword());

  return (
    <main className="etage-sombre flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[24rem]">
        <Image
          src="/brand/ladyfresh-wordmark-white.png"
          alt="Lady Fresh"
          width={520}
          height={110}
          className="h-[22px] w-auto"
        />
        <p className="eyebrow mt-6 text-or">Espace gestion</p>
        <h1 className="display display-l mt-3">Connexion</h1>

        {configure ? (
          <FormulaireConnexion />
        ) : (
          <div className="plaque mt-8 p-5">
            <p className="text-[14px] leading-relaxed text-craie">
              Aucun mot de passe n&apos;est configuré. Ajoutez{" "}
              <code className="data text-or">ADMIN_PASSWORD</code> dans{" "}
              <code className="data text-or">.env.local</code> à la racine du
              projet, puis relancez le serveur.
            </p>
          </div>
        )}

        <a
          href="/"
          className="eyebrow mt-8 inline-block text-craie transition-colors hover:text-or"
        >
          ← Retour au site
        </a>
      </div>
    </main>
  );
}
