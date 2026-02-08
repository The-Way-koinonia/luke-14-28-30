/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@the-way/types', '@the-way/social-engine'],
  images: {
    domains: [],
  },
};

module.exports = nextConfig;
