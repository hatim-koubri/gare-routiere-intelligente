/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy vers le backend Spring Boot
  // En dev local : http://localhost:8080
  // En Docker : la variable NEXT_PUBLIC_API_URL est définie dans docker-compose
  async rewrites() {
    // On récupère l'URL de base sans le /api final pour le proxy côté serveur
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api')
      .replace(/\/api$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${backendBase}/api/:path*`,
      },
    ];
  },
  images: {
    // Remplace l'ancien "domains" (déprécié) par remotePatterns
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;