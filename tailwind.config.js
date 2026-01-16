import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.blade.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                // Neutral palette - warm, paper-like
                'paper': {
                    50: '#FEFDFB',
                    100: '#FAF9F7',
                    200: '#F5F3F0',
                    300: '#E8E6E3',
                    400: '#D4D2CF',
                    500: '#A8A6A3',
                    600: '#787673',
                    700: '#585654',
                    800: '#383735',
                    900: '#1C1B1A',
                    950: '#0E0D0D',
                },
                // The punchy accent - a friendly, energetic coral-orange
                'punch': {
                    50: '#FFF5F2',
                    100: '#FFE8E1',
                    200: '#FFD4C7',
                    300: '#FFB39E',
                    400: '#FF8A6B',
                    500: '#FF6B47', // Primary accent
                    600: '#E8523A',
                    700: '#C4412E',
                    800: '#9E3526',
                    900: '#7A2D22',
                },
                // Secondary accent - a calm, trustworthy teal
                'calm': {
                    50: '#F0FDFC',
                    100: '#CCFBF6',
                    200: '#99F6ED',
                    300: '#5EEADB',
                    400: '#2DD4C3',
                    500: '#14B8A9',
                    600: '#0D9488',
                    700: '#0F766D',
                    800: '#115E57',
                    900: '#134E48',
                },
            },
            fontFamily: {
                // Clean geometric sans for UI
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                // Characterful display font for headings
                display: ['Space Grotesk', ...defaultTheme.fontFamily.sans],
                // Monospace for code/scripts
                mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
            },
            fontSize: {
                // Slightly chunkier type scale
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.875rem', { lineHeight: '1.25rem' }],
                'base': ['1rem', { lineHeight: '1.6' }],
                'lg': ['1.125rem', { lineHeight: '1.6' }],
                'xl': ['1.25rem', { lineHeight: '1.5' }],
                '2xl': ['1.5rem', { lineHeight: '1.4' }],
                '3xl': ['1.875rem', { lineHeight: '1.3' }],
                '4xl': ['2.25rem', { lineHeight: '1.2' }],
                '5xl': ['3rem', { lineHeight: '1.1' }],
                '6xl': ['3.75rem', { lineHeight: '1.05' }],
            },
            borderRadius: {
                'soft': '0.625rem',
                'card': '1rem',
                'pill': '9999px',
            },
            boxShadow: {
                'soft': '0 2px 8px -2px rgba(28, 27, 26, 0.08), 0 4px 16px -4px rgba(28, 27, 26, 0.12)',
                'lifted': '0 4px 12px -2px rgba(28, 27, 26, 0.1), 0 8px 24px -4px rgba(28, 27, 26, 0.15)',
                'card': '0 1px 3px rgba(28, 27, 26, 0.04), 0 4px 12px rgba(28, 27, 26, 0.06)',
                'card-hover': '0 4px 8px rgba(28, 27, 26, 0.06), 0 8px 24px rgba(28, 27, 26, 0.1)',
            },
            animation: {
                'wobble': 'wobble 0.5s ease-in-out',
                'bounce-soft': 'bounce-soft 0.4s ease-out',
                'fade-in': 'fade-in 0.3s ease-out',
                'slide-up': 'slide-up 0.4s ease-out',
            },
            keyframes: {
                'wobble': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(-2deg)' },
                    '75%': { transform: 'rotate(2deg)' },
                },
                'bounce-soft': {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '50%': { transform: 'scale(1.02)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'slide-up': {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },

    plugins: [forms],
};
