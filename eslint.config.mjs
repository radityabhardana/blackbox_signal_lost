import nextConfig from "eslint-config-next";
import prettier from "eslint-config-prettier";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: [
      ".next/**",
      "playwright-report/**",
      "test-results/**",
      "node_modules/**",
      "next-env.d.ts",
    ],
  },
  ...nextConfig.flat(),
  prettier,
];

export default config;