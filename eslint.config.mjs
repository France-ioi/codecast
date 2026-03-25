import { defineConfig } from "eslint/config";
import react from "eslint-plugin-react";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import jambitTypedReduxSaga from "@jambit/eslint-plugin-typed-redux-saga";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: compat.extends("plugin:react/recommended"),

    plugins: {
        react,
        "@typescript-eslint": typescriptEslint,
        "@jambit/typed-redux-saga": jambitTypedReduxSaga,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
        },

        parser: tsParser,
        ecmaVersion: 12,
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
            ecmaFeatures: {
                jsx: true,
            },
        },
    },

    settings: {
        react: {
            createClass: "createReactClass",
            pragma: "React",
            fragment: "Fragment",
            version: "detect",
            flowVersion: "0.53",
        },

        propWrapperFunctions: ["forbidExtraProps", {
            property: "freeze",
            object: "Object",
        }, {
            property: "myFavoriteWrapper",
        }],

        linkComponents: ["Hyperlink", {
            name: "Link",
            linkAttribute: "to",
        }],
    },

    rules: {
        "react/prop-types": "off",

        "react/no-unescaped-entities": ["error", {
            forbid: [">", "}"],
        }],

        indent: ["error", 4, {
            SwitchCase: 1,
        }],
    },
}, {
    files: ["./**/*.ts", "./**/*.tsx"],
    ignores: ["./**/*.spec.ts"],

    rules: {
        "@jambit/typed-redux-saga/use-typed-effects": ["error"],
        "@jambit/typed-redux-saga/delegate-effects": "error",
    },
}]);
