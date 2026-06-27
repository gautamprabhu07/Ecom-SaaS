import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'serif'],
  sans:    ['Inter', 'var(--font-inter)', 'sans-serif'],
  mono:    ['"JetBrains Mono"', 'var(--font-mono)', 'monospace'],
      },
    },
  },
} satisfies Config;