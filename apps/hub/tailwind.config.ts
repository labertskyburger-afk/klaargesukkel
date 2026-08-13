import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Existing tokens are within a hex digit or two of the Get It
        // Sorted brief's suggested palette (e.g. its "deep navy" #142632 vs
        // ink #12232E) — same colors restated from memory, not a deliberate
        // second palette, so reused as-is rather than adding near-duplicates.
        ink: "#12232E",
        amber: "#F2A93B",
        teal: "#1F7A6C",
        sand: "#F7F3EC",
        fog: "#8CA0AA",
        // Genuinely new tokens from the brief, no existing equivalent.
        "teal-panel": "#E6F2F0",
        slate: "#66737C",
      },
    },
  },
  plugins: [],
};

export default config;
