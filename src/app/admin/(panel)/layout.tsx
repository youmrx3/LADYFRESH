import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BasculeTheme } from "@/components/Bascules";
import {
  BarreOngletsMobile,
  LiensAdmin,
  type LienAdmin,
} from "@/components/admin/LiensAdmin";
import { seDeconnecter } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { supabaseAdminConfigured } from "@/lib/supabase";
import { getT } from "@/i18n/server";

export const metadata = { title: "Gestion", robots: { index: false, follow: false } };

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { t } = await getT();

  const o = t.admin.onglets;
  const liens: LienAdmin[] = [
    { href: "/admin", label: o.commandes, court: o.courts.commandes, icone: "commandes" },
    { href: "/admin/pistes", label: o.pistes, court: o.courts.pistes, icone: "pistes" },
    { href: "/admin/types", label: o.types, court: o.courts.types, icone: "types" },
    { href: "/admin/gammes", label: o.gammes, court: o.courts.gammes, icone: "gammes" },
    { href: "/admin/produits", label: o.produits, court: o.courts.produits, icone: "produits" },
    { href: "/admin/formats", label: o.formats, court: o.courts.formats, icone: "formats" },
    { href: "/admin/contenu", label: o.contenu, court: o.courts.contenu, icone: "contenu" },
  ];

  const marque = (
    <Link href="/" className="block shrink-0">
      <Image
        src="/brand/ladyfresh-wordmark-black.webp"
        alt="Lady Fresh"
        width={520}
        height={110}
        className="dark-hidden h-[16px] w-auto"
      />
      <Image
        src="/brand/ladyfresh-wordmark-white.webp"
        alt="Lady Fresh"
        width={520}
        height={110}
        className="clair-hidden h-[16px] w-auto"
      />
    </Link>
  );

  return (
    <div className="min-h-screen bg-comptoir lg:flex">
      {/* -------------------------------------------- barre haute — mobile */}
      <header
        className="etage-vitrine sticky top-0 z-40 flex items-center gap-3 border-b px-4 py-3 lg:hidden"
        style={{ borderColor: "var(--vitrine-line)" }}
      >
        {marque}
        <span className="eyebrow ms-1 text-or">{t.admin.gestion}</span>
        <div className="ms-auto flex items-center gap-2">
          <BasculeTheme compact />
          <form action={seDeconnecter}>
            <button
              type="submit"
              aria-label={t.admin.seDeconnecter}
              title={t.admin.seDeconnecter}
              className="flex h-9 w-9 items-center justify-center rounded border"
              style={{ borderColor: "color-mix(in srgb, currentColor 22%, transparent)" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </form>
        </div>
      </header>

      {/* ------------------------------------------ barre latérale — desktop */}
      <aside className="etage-vitrine hidden shrink-0 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[15.5rem] lg:flex-col">
        <div className="px-5 py-6">
          {marque}
          <p className="eyebrow mt-2 text-or">{t.admin.gestion}</p>
        </div>

        <LiensAdmin liens={liens} />

        <div className="mt-auto flex items-center justify-between gap-3 px-5 py-4">
          <BasculeTheme compact />
        </div>

        <form action={seDeconnecter} className="px-5 pb-5">
          <button
            type="submit"
            className="eyebrow text-craie transition-colors hover:text-or"
          >
            {t.admin.seDeconnecter}
          </button>
        </form>
      </aside>

      {/* La marge basse laisse passer la barre d'onglets sur téléphone. */}
      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-7 sm:pt-8 lg:pb-10">
        {!supabaseAdminConfigured && (
          <div
            className="mb-6 rounded border px-4 py-3"
            style={{
              borderColor: "color-mix(in srgb, var(--or-trait) 50%, transparent)",
              background: "color-mix(in srgb, var(--or-trait) 10%, transparent)",
            }}
          >
            <p className="text-[13.5px] font-medium">{t.admin.baseAbsente}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-graphite-doux">
              {t.admin.baseAbsenteAide}
            </p>
          </div>
        )}
        {children}
      </main>

      <BarreOngletsMobile liens={liens} />
    </div>
  );
}
