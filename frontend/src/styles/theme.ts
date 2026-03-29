export const theme = {
  colors: {
    primary: '#ff4500',
    primaryDark: '#e63900',
    primaryLight: '#ff6b35',
    secondary: '#ff7f50',
    accent: '#ff8c42',
    success: '#10b981',
    error: '#ef4444',
    warning: '#ffa500',
    
    background: '#0a0a0f',
    backgroundSecondary: '#151520',
    backgroundTertiary: '#1a1a2e',
    backgroundCard: 'rgba(21, 21, 32, 0.8)',
    backgroundGlass: 'rgba(255, 69, 0, 0.1)',
    
    text: '#ffffff',
    textSecondary: '#b0b0c3',
    textLight: '#8888a3',
    textMuted: '#6666833',
    textWhite: '#ffffff',
    
    border: 'rgba(255, 69, 0, 0.2)',
    borderLight: 'rgba(255, 69, 0, 0.1)',
    borderGlow: 'rgba(255, 69, 0, 0.5)',
    
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.6)',
    shadowGlow: 'rgba(255, 69, 0, 0.3)',
    
    gradient: {
      primary: 'linear-gradient(135deg, #ff4500 0%, #ff6b35 50%, #ff8c42 100%)',
      secondary: 'linear-gradient(135deg, #151520 0%, #1a1a2e 100%)',
      card: 'linear-gradient(135deg, rgba(21, 21, 32, 0.9) 0%, rgba(26, 26, 46, 0.7) 100%)',
      glow: 'linear-gradient(135deg, rgba(255, 69, 0, 0.1) 0%, rgba(255, 140, 66, 0.05) 100%)',
    }
  },
  
  fonts: {
    primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
}
