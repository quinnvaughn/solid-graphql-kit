import { defineConfig } from "tsup"
import { solidPlugin } from "esbuild-plugin-solid"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,

  external: [
    "solid-js",
    "solid-js/jsx-runtime",
    "@urql/core",
    "graphql-ws",
    "wonka",
  ],

  esbuildPlugins: [solidPlugin()],

  esbuildOptions(options) {
    options.jsxImportSource = "solid-js"
  },
})
