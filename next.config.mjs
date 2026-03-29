/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Next.js API routes to use the existing CommonJS services in src/
  experimental: {
    serverComponentsExternalPackages: ['twilio', 'googleapis', '@sendgrid/mail', '@anthropic-ai/sdk'],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Prevent MIME sniffing attacks
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Limit referrer information leaked to other sites
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed by this app
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // Force HTTPS on future visits (1 year)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // Content Security Policy — restricts what can load on the page
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js requires unsafe-inline for styles; unsafe-eval for hot reload in dev
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.com https://*.clerk.accounts.dev",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              // Clerk auth endpoints + own API
              "connect-src 'self' https://clerk.com https://*.clerk.accounts.dev",
              // Clerk hosted UI renders in an iframe
              "frame-src https://clerk.com https://*.clerk.accounts.dev",
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
