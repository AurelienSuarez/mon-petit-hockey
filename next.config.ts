import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Emulates Cloudflare bindings when running `next dev`, so behavior matches the
// deployed Worker. No-op in production (the actual OpenNext Cloudflare build).
initOpenNextCloudflareForDev();
