import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import { templateCompilerOptions } from "@tresjs/core";
import VueRouter from 'vue-router/vite'

// https://vite.dev/config/
export default defineConfig({
  base: "/threejs-learn/",
  plugins: [
    VueRouter(),
    vue(templateCompilerOptions), tailwindcss()],
});
