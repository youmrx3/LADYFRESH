import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LiensAdmin } from "@/components/admin/LiensAdmin";
import { seDeconnecter } from "@/lib/actions";
import { isAdmin } from "@/lib/auth";
import { supabaseAdminConfigured } from "@/lib/supabase";

export const metadata = { title: "Gestion" };

export default async function LayoutAdmin({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await isAdmin())) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-porcelaine lg:flex">
      <aside className="etage-sombre shrink-0 lg:sticky lg:top-0 lg:h-screen lg:w-[15rem]">
        <div className="flex items-center justify-between gap-4 p-5 lg:block">
          <Link href="/" className="block">
            <Image
              src="/brand/ladyfresh-wordmark-white.png"
              alt="Lady Fresh"
              width={520}
              height={110}
              className="h-[18px] w-auto"
            />
          </Link>
          <p className="eyebrow text-or lg:mt-2">Gestion</p>
        </div>

        <LiensAdmin />

        <form action={seDeconnecter} className="p-5">
          <button
            type="submit"
            className="eyebrow text-craie transition-colors hover:text-or"
          >
            Se déconnecter
          </button>
        </form>
      </aside>

      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8">
        {!supabaseAdminConfigured && (
          <div className="mb-6 rounded border border-or/50 bg-or/10 px-4 py-3">
            <p className="text-[13.5px] font-medium">
              Base de données non connectée — les modifications ne sont pas
              enregistrées.
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-graphite-doux">
              Exécutez <code className="data">supabase/schema.sql</code> puis
              renseignez <code className="data">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
              <code className="data">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> et{" "}
              <code className="data">SUPABASE_SERVICE_ROLE_KEY</code> dans{" "}
              <code className="data">.env.local</code>. Le site affiche en
              attendant le catalogue de référence.
            </p>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
