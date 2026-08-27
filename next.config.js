/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/counseling-panel',
  assetPrefix: '/counseling-panel/',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
