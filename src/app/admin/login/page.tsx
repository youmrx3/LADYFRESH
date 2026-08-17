import Image from "next/image";
import { redirect } from "next/navigation";
import { FormulaireConnexion } from "./FormulaireConnexion";
import { BasculeTheme } from "@/components/Bascules";
import { authConfiguree, isAdmin } from "@/lib/auth";
import { getT } from "@/i18n/server";

export const metadata = { title: "Connexion", robots: { index: false, follow: false } };

export default async function Connexion() {
  if (await isAdmin()) redirect("/admin");
  const { t } = await getT();
  const configure = authConfiguree;

  return (
    <main className="etage-vitrine flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-[24rem]">
        <div className="flex items-center justify-between gap-4">
          <Image
            src="/brand/ladyfresh-wordmark-black.webp"
            alt="Lady Fresh"
            width={520}
            height={110}
            className="dark-hidden h-[20px] w-auto"
          />
          <Image
            src="/brand/ladyfresh-wordmark-white.webp"
            alt="Lady Fresh"
            width={520}
            height={110}
            className="clair-hidden h-[20px] w-auto"
          />
          <div className="flex items-center gap-2">
            <BasculeTheme compact />
          </div>
        </div>

        <p className="eyebrow mt-8 text-or">{t.admin.espaceGestion}</p>
        <h1 className="display display-l mt-3">{t.admin.connexion}</h1>

        {configure ? (
          <FormulaireConnexion
            labels={{
              email: t.admin.email,
              motDePasse: t.admin.motDePasse,
              entrer: t.admin.entrer,
              verification: t.admin.verification,
            }}
          />
        ) : (
          <div className="plaque mt-8 p-5">
            <p className="text-[14px] leading-relaxed text-craie">
              {t.admin.pasDeMotDePasse}
            </p>
          </div>
        )}

        <a
          href="/"
          className="eyebrow mt-8 inline-block text-craie transition-colors hover:text-or"
        >
          {t.admin.retourSite}
        </a>
      </div>
    </main>
  );
}
