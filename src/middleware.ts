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

const DEV = process.env.NODE_ENV !== "production";

/*
  L'outil de configuration d'événements de Meta ouvre le site dans un cadre
  pour y détecter le pixel. `frame-ancestors 'none'` et `X-Frame-Options: DENY`
  le lui interdisent : l'outil ne charge rien et conclut « aucun pixel sur ce
  site » — alors que les événements arrivent bien dans le gestionnaire.

  On n'ouvre donc pas la porte en permanence. Poser META_OUTIL_CONFIGURATION=1
  le temps de la configuration, puis retirer la variable : le clickjacking
  redevient impossible. Les conversions personnalisées, elles, se créent sans
  cet outil et n'ont jamais besoin de cette variable.
*/
const OUTIL_META = process.env.META_OUTIL_CONFIGURATION === "1";
const CADRES_META = "https://*.facebook.com https://*.instagram.com";

/*
  Le pixel Meta charge son script depuis connect.facebook.net et poste ses
  événements vers facebook.com. Sans ces trois ouvertures ciblées, la CSP le
  bloque en silence : la page s'affiche, le pixel ne compte rien. On n'ouvre
  que ces domaines, et uniquement si un identifiant est configuré.
*/
const META = process.env.NEXT_PUBLIC_META_PIXEL_ID
  ? {
      script: " https://connect.facebook.net",
      image: " https://www.facebook.com",
      connect: " https://www.facebook.com https://connect.facebook.net",
    }
  : { script: "", image: "", connect: "" };

/**
 * `unsafe-inline` sur les scripts est imposé par Next : l'hydratation et le
 * script de thème sont en ligne. Une CSP à nonce obligerait à rendre chaque
 * page dynamiquement, ce que la mise en cache du catalogue cherche à éviter.
 *
 * En développement il faut en plus `unsafe-eval` et le websocket local : le
 * bundler évalue ses modules par `eval()` et pousse les mises à jour par
 * socket. Sans eux, aucun script ne s'exécute — React n'hydrate pas et tout
 * ce qui est interactif meurt en silence, sans erreur visible sur la page.
 * En production, rien de tout cela n'est nécessaire.
 */
function csp() {
  const sb = supabaseHost ? ` https://${supabaseHost} wss://${supabaseHost}` : "";
  const dev = DEV ? " 'unsafe-eval'" : "";
  const devSocket = DEV ? " ws: http://localhost:* http://127.0.0.1:*" : "";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    OUTIL_META ? `frame-ancestors ${CADRES_META}` : "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'unsafe-inline'${dev}${META.script}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    `img-src 'self' data: blob:${sb}${META.image}`,
    `media-src 'self' blob:${sb}`,
    `connect-src 'self'${sb}${devSocket}${META.connect}`,
    ...(DEV ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

function poserEntetes(reponse: NextResponse, pathname: string) {
  const h = reponse.headers;
  h.set("Content-Security-Policy", csp());
  h.set("X-Content-Type-Options", "nosniff");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // X-Frame-Options ne sait pas nommer plusieurs origines et prime sur la CSP
  // dans les navigateurs anciens : pendant la configuration Meta, on le retire
  // et on laisse `frame-ancestors` faire le tri.
  if (!OUTIL_META) h.set("X-Frame-Options", "DENY");
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
