import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/daily-routine-tracker/", // <-- important for gh-pages
  plugins: [react()],
});
