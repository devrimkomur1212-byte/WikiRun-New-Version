import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-mono)', 'Menlo', 'monospace'],
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			'3xl': '1.5rem',
  			'2xl': '1rem',
  			'xl': '0.75rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontSize: {
  			'display': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
  			'display-sm': ['2.25rem', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
  			'h1': ['2rem', { lineHeight: '1.25', fontWeight: '600' }],
  			'h2': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
  			'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
  			'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
  			'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
  			'caption': ['0.8125rem', { lineHeight: '1.4', fontWeight: '400' }],
  		},
  		spacing: {
  			'18': '4.5rem',
  			'22': '5.5rem',
  			'88': '22rem',
  		},
  		boxShadow: {
  			'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.04)',
  			'soft-lg': '0 4px 16px -4px rgba(0, 0, 0, 0.1), 0 8px 32px -8px rgba(0, 0, 0, 0.06)',
  			'glow': '0 0 20px -5px hsl(var(--primary) / 0.4), 0 0 40px -10px hsl(var(--primary) / 0.2)',
  			'glow-lg': '0 0 30px -5px hsl(var(--primary) / 0.5), 0 0 60px -10px hsl(var(--primary) / 0.3)',
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.3s ease-out',
  			'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  			'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  			'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  			'shimmer': 'shimmer 2s linear infinite',
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			slideUp: {
  				'0%': { opacity: '0', transform: 'translateY(12px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			slideDown: {
  				'0%': { opacity: '0', transform: 'translateY(-12px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			scaleIn: {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' },
  			},
  			shimmer: {
  				'0%': { backgroundPosition: '-200% 0' },
  				'100%': { backgroundPosition: '200% 0' },
  			},
  		},
  		transitionDuration: {
  			'175': '175ms',
  			'225': '225ms',
  		},
  		backdropBlur: {
  			xs: '2px',
  		}
  	}
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};

export default config;
