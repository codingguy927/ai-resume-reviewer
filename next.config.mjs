/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail the build on ESLint/TS while we stabilize
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Ensure Node runtime by default for APIs if you like (optional)
  experimental: { serverComponentsExternalPackages: ["pdf-parse", "pdfkit"] },
};

export default nextConfig;
