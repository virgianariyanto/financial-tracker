/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly set the project root to stop the multiple‑lockfile warning
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
