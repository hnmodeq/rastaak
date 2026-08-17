/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['*.e2b.app', 'localhost:3000'],
};

export default nextConfig;
