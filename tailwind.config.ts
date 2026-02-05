import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        status: {
          green: "#22c55e",
          yellow: "#eab308",
          red: "#ef4444"
        }
      },
      fontFamily: {
        monoDisplay: ["var(--font-space-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"]
      },
      backgroundImage: {
        "grid-pattern": "radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.12) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
