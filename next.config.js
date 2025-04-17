/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["geist"],
  // Remove any experimental features that might be causing issues
  experimental: {
    // Remove any experimental options that might be causing issues
    // e.g., remove "appDir: true" if it exists and you're not using the app directory
  }
};

module.exports = nextConfig;