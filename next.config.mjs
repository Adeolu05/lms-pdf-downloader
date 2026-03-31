/** @type {import('next').NextConfig} */
// Standalone output is for local `npm run dist` (Electron). Vercel uses its own serverless
// bundle; forcing standalone there often breaks or confuses the deploy pipeline.
const nextConfig = {
    ...(process.env.VERCEL ? {} : { output: 'standalone' }),
};

export default nextConfig;
