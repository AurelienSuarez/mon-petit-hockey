import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

// eslint-config-next@15 still ships its config in the legacy .eslintrc shape
// (`{extends, rules}`, not a flat-config array), so it's loaded through FlatCompat —
// the standard bridge Next.js itself uses for ESLint 9 flat config on Next 15.
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", ".open-next/**", ".wrangler/**"],
  },
];

export default eslintConfig;
