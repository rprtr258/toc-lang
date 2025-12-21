import {defineConfig} from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: "/toc-lang/",
  assetsInclude: ["**/*.peggy"],
  server: {
    watch: {
      ignored: ["**/.jj/**"],
    },
  },
  // TODO: remove, required now since vue-codemirror dependencies conflicts with direct codemirror imports
  resolve: {
    dedupe: [
      "@codemirror/state",
      "@codemirror/view",
      "@codemirror/language",
      "@codemirror/lint",
      "@codemirror/autocomplete",
    ],
  },
});
