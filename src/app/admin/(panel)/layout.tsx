import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BasculeLangue, BasculeTheme } from "@/components/Bascules";
import { LiensAdmin } from "@/components/admin/LiensAdmin";
import { seDeconnecter } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { supabaseAdminConfigured } from "@/lib/supabase";
import { getT } from "@/i18n/server";

export const metadata = { title: "Gestion" };

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");
  const { t } = await getT();

  return (
    <div className="min-h-screen bg-comptoir lg:flex">
      <aside className="etage-vitrine shrink-0 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-[15.5rem] lg:flex-col">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:block lg:py-6">
          <Link href="/" className="block">
            <Image
              src="/brand/ladyfresh-wordmark-black.png"
              alt="Lady Fresh"
              width={520}
              height={110}
              className="dark-hidden h-[17px] w-auto"
            />
            <Image
              src="/brand/ladyfresh-wordmark-white.png"
              alt="Lady Fresh"
              width={520}
              height={110}
              className="clair-hidden h-[17px] w-auto"
            />
          </Link>
          <p className="eyebrow text-or lg:mt-2">{t.admin.gestion}</p>
        </div>

        <LiensAdmin
          liens={[
            { href: "/admin", label: t.admin.onglets.commandes },
            { href: "/admin/gammes", label: t.admin.onglets.gammes },
            { href: "/admin/produits", label: t.admin.onglets.produits },
            { href: "/admin/contenu", label: t.admin.onglets.contenu },
          ]}
        />

        <div className="flex items-center justify-between gap-3 px-5 py-4 lg:mt-auto">
          <BasculeLangue compact />
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

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 sm:py-8">
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
    </div>
  );
}
