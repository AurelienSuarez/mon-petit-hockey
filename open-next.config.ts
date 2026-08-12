import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental-cache override: every page in this app reads cookies() for auth,
// which already forces fully dynamic rendering — there's no ISR/static regeneration
// output to cache, so the default (in-memory, per-request) cache is enough and this
// avoids requiring an R2 bucket just to deploy.
export default defineCloudflareConfig();
