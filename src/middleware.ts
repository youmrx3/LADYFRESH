import { NextResponse, type NextRequest } from "next/server";
import { ipDe, limiteDepassee } from "@/lib/limite";

/**
 * Deux responsabilités de bordure : poser les en-têtes de sécurité et brider
 * les commandes.
 *
 * Pourquoi ici et pas dans next.config.ts — une règle `headers()` sur
 * `source: "/:path*"` s'applique aussi aux POST des actions serveur, et sous
 * Next 15.1 ces actions perdent alors leur portée de requête : `cookies()`
 * lève « called outside a request scope » et toute connexion rend une 500.
 * Trouvé par bissection. Ici on ne touche qu'aux réponses GET/HEAD, celles où
 * CSP, X-Frame-Options et HSTS ont un sens.
 */

const MESSAGES: Record<string, string> = {
  fr: "Trop de commandes envoyées depuis cette connexion. Réessayez plus tard.",
  ar: "عدد كبير من الطلبات من هذا الاتصال. أعيدي المحاولة لاحقًا.",
  en: "Too many orders from this connection. Try again later.",
};

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

/**
 * `unsafe-inline` sur les scripts est imposé par Next : l'hydratation et le
 * script de thème sont en ligne. Une CSP à nonce obligerait à rendre chaque
 * page dynamiquement, ce que la mise en cache du catalogue cherche à éviter.
 */
function csp() {
  const sb = supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : "";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src 'self' data: blob:${sb}`,
    `media-src 'self' blob:${sb}`,
    `connect-src 'self'${sb}`,
    "upgrade-insecure-requests",
  ].join("; ");
}

function poserEntetes(reponse: NextResponse, pathname: string) {
  const h = reponse.headers;
  h.set("Content-Security-Policy", csp());
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("X-Frame-Options", "DENY");
  h.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=(), payment=()",
  );
  h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");

  // L'espace de gestion ne doit jamais être indexé ni mis en cache partagé.
  if (pathname.startsWith("/admin")) {
    h.set("X-Robots-Tag", "noindex, nofollow");
    h.set("Cache-Control", "no-store, must-revalidate");
  }
  return reponse;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.method === "POST" && pathname === "/api/orders") {
    const ip = ipDe(request.headers);
    if (limiteDepassee(`orders:${ip}`, 20, 60 * 60 * 1000)) {
      const locale = request.cookies.get("lf_locale")?.value ?? "fr";
      return NextResponse.json(
        { error: MESSAGES[locale] ?? MESSAGES.fr },
        { status: 429, headers: { "Retry-After": "600" } },
      );
    }
    return NextResponse.next();
  }

  return poserEntetes(NextResponse.next(), pathname);
}

export const config = {
  matcher: [
    /*
      La vitrine et l'API de commande. `/admin` est délibérément absent : dès
      qu'un middleware intercepte la route où une action serveur poste, cette
      action perd sa portée de requête et `cookies()` échoue — c'est tout le
      back-office qui tombe. Le back-office est derrière mot de passe et porte
      son `noindex` par métadonnée ; la surface exposée, elle, garde ses
      en-têtes.
    */
    "/((?!_next/|api/|admin|favicon.ico|brand/|products/|gammes/|videos/|uploads/).*)",
    "/api/orders",
  ],
};
