/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['media', 'class'],
  theme: {
  	extend: {
  		colors: {
  			primary: {
  				'50': 'rgb(var(--color-primary), 0.05)',
  				'100': 'rgb(var(--color-primary), 0.1)',
  				'200': 'rgb(var(--color-primary), 0.2)',
  				'300': 'rgb(var(--color-primary), 0.3)',
  				'400': 'rgb(var(--color-primary), 0.4)',
  				'500': 'rgb(var(--color-primary), 0.5)',
  				'600': 'rgb(var(--color-primary), 0.6)',
  				'700': 'rgb(var(--color-primary), 0.7)',
  				'800': 'rgb(var(--color-primary), 0.8)',
  				'900': 'rgb(var(--color-primary), 0.9)',
  				'950': 'rgb(var(--color-primary), 0.95)',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				'50': 'rgb(var(--color-secondary), 0.05)',
  				'100': 'rgb(var(--color-secondary), 0.1)',
  				'200': 'rgb(var(--color-secondary), 0.2)',
  				'300': 'rgb(var(--color-secondary), 0.3)',
  				'400': 'rgb(var(--color-secondary), 0.4)',
  				'500': 'rgb(var(--color-secondary), 0.5)',
  				'600': 'rgb(var(--color-secondary), 0.6)',
  				'700': 'rgb(var(--color-secondary), 0.7)',
  				'800': 'rgb(var(--color-secondary), 0.8)',
  				'900': 'rgb(var(--color-secondary), 0.9)',
  				'950': 'rgb(var(--color-secondary), 0.95)',
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			accent: {
  				'50': 'rgb(var(--color-accent), 0.05)',
  				'100': 'rgb(var(--color-accent), 0.1)',
  				'200': 'rgb(var(--color-accent), 0.2)',
  				'300': 'rgb(var(--color-accent), 0.3)',
  				'400': 'rgb(var(--color-accent), 0.4)',
  				'500': 'rgb(var(--color-accent), 0.5)',
  				'600': 'rgb(var(--color-accent), 0.6)',
  				'700': 'rgb(var(--color-accent), 0.7)',
  				'800': 'rgb(var(--color-accent), 0.8)',
  				'900': 'rgb(var(--color-accent), 0.9)',
  				'950': 'rgb(var(--color-accent), 0.95)',
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
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
  		animation: {
  			'fade-in': 'fadeIn 0.2s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'slide-down': 'slideDown 0.3s ease-out',
  			'scale-in': 'scaleIn 0.2s ease-in-out'
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': {
  					opacity: '0'
  				},
  				'100%': {
  					opacity: '1'
  				}
  			},
  			slideUp: {
  				'0%': {
  					transform: 'translateY(10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			slideDown: {
  				'0%': {
  					transform: 'translateY(-10px)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: '1'
  				}
  			},
  			scaleIn: {
  				'0%': {
  					transform: 'scale(0.95)',
  					opacity: '0'
  				},
  				'100%': {
  					transform: 'scale(1)',
  					opacity: '1'
  				}
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};