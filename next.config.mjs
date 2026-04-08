/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3'],
  },
  webpack: (config) => {
    // Exclude canvas from client-side bundle (pdfjs-dist uses it on server)
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
