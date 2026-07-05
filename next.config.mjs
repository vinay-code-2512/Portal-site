/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "firebase/auth",
      "firebase/firestore",
      "firebase/functions",
      "date-fns",
    ],
    scrollRestoration: true,
    cpus: 4,
  },
  images: {
    unoptimized: true,
    deviceSizes: [375, 480, 640, 768, 1024, 1280, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
