import { Plugin } from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const config: { plugins: Plugin[] } = {
  plugins: [
    tailwindcss({
      config: "./src/css/tailwind.config.js",
    }) as Plugin,
    autoprefixer() as Plugin,
  ],
};

export default config;
