import Image from "next/image";
import type { SiteSettings } from "@/lib/types";

const RAPIDES = [
  { href: "#gammes", label: "Nos gammes" },
  { href: "#boutique", label: "Boutique" },
  { href: "#commander", label: "Comment commander" },
  { href: "#format", label: "Gros & demi-gros" },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  const reseaux = [
    { href: settings.instagram_url, label: "Instagram" },
    { href: settings.facebook_url, label: "Facebook" },
    { href: settings.tiktok_url, label: "TikTok" },
  ].filter((r) => r.href);

  return (
    <footer
      id="contact"
      className="etage-sombre saut-ancre border-t border-encre-bord pb-8 pt-16"
    >
      <div className="shell">
        <div className="grid gap-10 border-b border-encre-bord pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Image
              src="/brand/ladyfresh-wordmark-white.png"
              alt="Lady Fresh"
              width={520}
              height={110}
              className="h-[22px] w-auto"
            />
            <p className="mt-5 max-w-[32ch] text-[14.5px] leading-relaxed text-craie">
              Brumes parfumées, gels lavants intimes et déodorants. Fabriqués
              pour la fraîcheur qui tient toute la journée.
            </p>
          </div>

          <nav aria-label="Liens rapides">
            <p className="eyebrow text-or">Le site</p>
            <ul className="mt-4 space-y-2.5">
              {RAPIDES.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-[14.5px] text-craie transition-colors hover:text-porcelaine"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="eyebrow text-or">Contact</p>
            <ul className="mt-4 space-y-2.5 text-[14.5px] text-craie">
              <li>
                <a
                  href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}
                  className="data transition-colors hover:text-porcelaine"
                >
                  {settings.contact_phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="transition-colors hover:text-porcelaine"
                >
                  {settings.contact_email}
                </a>
              </li>
              <li>{settings.contact_address}</li>
            </ul>

            {reseaux.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
                {reseaux.map((r) => (
                  <li key={r.label}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="eyebrow text-craie transition-colors hover:text-or"
                    >
                      {r.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <p className="data text-[12px] text-craie">
            © {new Date().getFullYear()} Lady Fresh — Tous droits réservés
          </p>
          <a
            href="/admin"
            className="eyebrow text-[10px] text-craie/60 transition-colors hover:text-or"
          >
            Espace gestion
          </a>
        </div>
      </div>
    </footer>
  );
}
