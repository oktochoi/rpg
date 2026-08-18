/** @type {import('next').NextConfig} */
const nextConfig = {
    // STEP 27: /api/ai is a Pages API route. Static HTML export cannot host API routes,
    // so production builds as a Next.js server instead of `output: 'export'`.
    // Keep the default `.next` output so Vercel can find routes-manifest.json.
};

export default nextConfig;
