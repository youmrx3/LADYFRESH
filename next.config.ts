import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La bannière `x-powered-by` n'apporte rien et annonce la pile.
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ["image/avif", "image/webp"],
    // Tailles réellement utilisées par le site : inutile de générer plus.
    deviceSizes: [360, 420, 640, 768, 1024, 1280, 1600],
    imageSizes: [44, 48, 64, 96, 128, 200, 256, 320],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    /*
      Le motif était calculé depuis NEXT_PUBLIC_SUPABASE_URL, donc lu à la
      compilation. Un build lancé sans cette variable produisait une liste
      vide, et toute image téléversée renvoyait « hostname not configured » :
      le champ s'enregistrait bien, la photo n'apparaissait jamais. Le
      caractère générique supprime cette dépendance au moment du build.

      La portée reste étroite : uniquement les objets publics du stockage
      Supabase, jamais l'API ni un autre chemin.
    */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },


};

export default nextConfig;
