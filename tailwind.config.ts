import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#B91C1C',
          green: '#15803D',
          gold: '#FBBF24',
          cream: '#FEF3C7',
        }
      },
      backgroundImage: {
        'snow-pattern': "url('/snow-bg.png')",
      }
    },
  },
  plugins: [],
}
export default config