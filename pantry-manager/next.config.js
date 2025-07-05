const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com', 'placehold.co'], // Add the external hostname
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
