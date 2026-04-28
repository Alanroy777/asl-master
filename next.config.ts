import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'asl.gs' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'www.youtube.com' },
    ],
  },
  // Next.js 16 uses Turbopack by default.
  // MediaPipe is loaded via CDN <Script> tags (window.Holistic, window.Camera)
  // so no webpack/turbopack bundle exclusions are needed.
  // root silences the "multiple lockfiles" workspace warning.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
