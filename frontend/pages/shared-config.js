// Shared Tailwind config for all Sumary Japanese pages
// Primary color: #6caba0 (soft sage teal)
// Clean, modern, accessible design
tailwind.config = {
  theme: {
    extend: {
      colors: {
        // Primary palette
        "primary": "#6caba0",
        "primary-light": "#8fc4bb",
        "primary-dark": "#4d8a80",
        "primary-50": "#f0f7f6",
        "primary-100": "#d9edea",
        "primary-200": "#b3dbd5",
        "primary-300": "#8fc4bb",
        "primary-400": "#6caba0",
        "primary-500": "#4d8a80",
        "primary-600": "#3d6e66",
        "primary-700": "#2d524d",

        // Secondary (warm amber/orange)
        "secondary": "#f0a868",
        "secondary-light": "#f5c28e",
        "secondary-dark": "#d98b42",

        // Success / Error / Warning
        "success": "#4caf50",
        "success-light": "#e8f5e9",
        "error": "#ef5350",
        "error-light": "#ffebee",
        "warning": "#ff9800",
        "warning-light": "#fff3e0",

        // Neutrals (light theme)
        "surface": "#ffffff",
        "surface-dim": "#f8fafb",
        "surface-container": "#f1f4f6",
        "surface-container-low": "#f5f7f9",
        "surface-container-high": "#eaedf0",
        "surface-variant": "#e8ebee",
        "background": "#f8fafb",

        // Text colors
        "on-surface": "#1a2332",
        "on-surface-variant": "#5f6b7a",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-background": "#1a2332",

        // Borders
        "outline": "#d1d5db",
        "outline-variant": "#e5e7eb",
      },
      fontFamily: {
        "headline": ["Plus Jakarta Sans", "sans-serif"],
        "body": ["Be Vietnam Pro", "sans-serif"],
        "label": ["Be Vietnam Pro", "sans-serif"],
        "japanese": ["Noto Sans JP", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.75rem",
        "lg": "1rem",
        "xl": "1.25rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)",
        "elevated": "0 8px 24px rgba(0,0,0,0.12)",
      },
    },
  },
};
