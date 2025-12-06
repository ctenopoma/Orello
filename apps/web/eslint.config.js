import baseConfig, { restrictEnvAccess } from "@orello/eslint-config/base";
import nextjsConfig from "@orello/eslint-config/nextjs";
import reactConfig from "@orello/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
