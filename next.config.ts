import type { NextConfig } from "next";

// Photos uploaded from the dashboard live in Supabase Storage
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : "rbxmmpvssjuobpfpjwse.supabase.co";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/media/**" }],
  },
};

export default nextConfig;
