import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#12232E",
        amber: "#F2A93B",
        teal: "#1F7A6C",
        sand: "#F7F3EC",
        fog: "#8CA0AA",
      },
    },
  },
  plugins: [],
};

export default config;
