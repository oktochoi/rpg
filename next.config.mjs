/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
    // STEP 27: /api/ai is a Pages API route. Static HTML export cannot host API routes,
    // so production builds as a Next.js server instead of `output: 'export'`.
    distDir: isDev ? '.next' : 'dist',
};

export default nextConfig;
