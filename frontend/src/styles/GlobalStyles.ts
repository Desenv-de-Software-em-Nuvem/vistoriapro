import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    scrollbar-gutter: stable;
  }

  html {
    font-size: 16px;
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    scroll-behavior: smooth;
    min-width: 320px;
    width: 100%;
    min-height: 100%;
    overflow-x: hidden;
    max-width: 100%;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.colors.primary} transparent;
  }
  body {
    font-family: ${({ theme }) => theme.fonts.primary};
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.background};
    background-image: 
      radial-gradient(circle at 20% 80%, rgba(255, 69, 0, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 140, 66, 0.08) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(255, 107, 53, 0.05) 0%, transparent 50%);
    background-attachment: scroll;
    overflow-x: hidden;
    min-height: 100vh;
    min-height: 100svh;
    min-height: var(--vistoriapro-app-height, 100dvh);
    width: 100%;
    max-width: 100%;
    scrollbar-gutter: stable;
    font-size: 1rem;
  }

  #root {
    min-height: 100vh;
    min-height: 100svh;
    min-height: var(--vistoriapro-app-height, 100dvh);
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
    overflow-x: hidden;
    scrollbar-gutter: stable;
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    background: none;
    color: inherit;
    padding: 0;
    
    &:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  }
  input, textarea, select {
    font-family: inherit;
    font-size: clamp(1rem, 2vw, 1.125rem);
    border: none;
    outline: none;
    background: none;
    min-height: 48px;
    padding: clamp(0.5em, 2vw, 1em);
    border-radius: 0.5em;
    
    &:focus {
      outline: 2px solid ${({ theme }) => theme.colors.primary};
      outline-offset: 2px;
      box-shadow: 0 0 20px ${({ theme }) => theme.colors.shadowGlow};
    }
  }

  a {
    color: inherit;
    text-decoration: none;
    transition: color 0.2s ease-in-out;
  }

  img, picture, video, canvas, svg {
    max-width: 100%;
    height: auto;
    display: block;
  }

  /* Scroll bar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 0;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary};
    border-radius: ${({ theme }) => theme.borderRadius.full};
    
    &:hover {
      background: ${({ theme }) => theme.colors.primaryLight};
    }
  }

  ::-webkit-scrollbar:horizontal {
    display: none;
    height: 0;
  }

  html::-webkit-scrollbar,
  body::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }

  html,
  body {
    scrollbar-width: none;
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    html {
      font-size: 15px;
    }
    body {
      font-size: clamp(1rem, 2vw, 1.05rem);
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
    }
    ::-webkit-scrollbar {
      width: 4px;
      height: 0;
    }
    /* Prevent zoom on input focus */
    input, select, textarea {
      font-size: 16px;
      -webkit-appearance: none;
      appearance: none;
    }
    /* Optimize for touch */
    * {
      -webkit-tap-highlight-color: rgba(255, 69, 0, 0.2);
    }
  }

  /* Tablet optimizations */
  @media (min-width: 769px) and (max-width: 1024px) {
    html {
      font-size: 15px;
    }
  }

  /* PWA optimizations */
  @media (display-mode: standalone) {
    body {
      padding: 0;
    }
    
    html {
      overflow-x: hidden;
      overflow-y: auto;
      min-height: 100%;
    }
    
    body {
      overflow: auto;
      min-height: var(--vistoriapro-app-height, 100dvh);
    }
  }

  /* Landscape mobile optimizations */
  @media (max-width: 768px) and (orientation: landscape) {
    html {
      font-size: 12px;
    }
    
    body {
      padding: 0;
    }
  }

  /* High DPI displays */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    /* Crisp rendering for high-DPI screens */
    * {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  }
  /* Loading animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes glowPulse {
    0%, 100% {
      box-shadow: 0 0 15px rgba(255, 69, 0, 0.2);
    }
    50% {
      box-shadow: 0 0 30px rgba(255, 69, 0, 0.3), 0 0 45px rgba(255, 107, 53, 0.2);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .fade-in {
    animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .slide-in-left {
    animation: slideInFromLeft 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .glow-pulse {
    animation: glowPulse 3s ease-in-out infinite;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  .pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  .float {
    animation: float 3s ease-in-out infinite;
  }
`
