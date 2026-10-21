import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: "No insertes HTML sin sanitizar: usa texto como hijo de JSX.",
        },
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: "No asignes innerHTML: usa textContent o un componente de React.",
        },
      ],
    },
  },
]);
