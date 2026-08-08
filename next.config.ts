import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : null;
  } catch {
    return null;
  }
})();

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
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },

  experimental: {
    optimizePackageImports: ["@supabase/supabase-js"],
  },


};

export default nextConfig;
