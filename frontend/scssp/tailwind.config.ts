import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#00D4AA',
          glow: 'rgba(0, 212, 170, 0.15)',
          hover: '#05C091',
        },
        surface: {
          DEFAULT: '#080A14',
          card: '#0D1022',
          elevated: '#131736',
          hover: '#181D40',
        },
        border: {
          DEFAULT: '#1C2150',
          light: '#252A5A',
        },
        text: {
          primary: '#EEF0F7',
          secondary: '#9098B8',
          muted: '#5A6380',
        },
      },
    },
  },
  plugins: [],
}

export default config
