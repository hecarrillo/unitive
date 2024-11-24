/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["es.wikipedia.org"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "jjuhqroesahcqukzdovs.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
