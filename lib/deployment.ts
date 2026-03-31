/** True on Vercel-hosted builds (`NEXT_PUBLIC_VERCEL_ENV` is set at build time). */
export function isVercelHosted(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);
}
