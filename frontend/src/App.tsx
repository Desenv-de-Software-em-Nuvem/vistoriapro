import { useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { AppRoutes } from './routes/AppRoutes'
import { GlobalStyles } from './styles/GlobalStyles'
import { theme } from './styles/theme'
import { AuthProvider } from './hooks/useAuth'
import InstallPWAButton from './components/InstallPWAButton'

function App() {
  useEffect(() => {
    const updateVisualViewportVars = () => {
      const viewport = window.visualViewport
      const root = document.documentElement

      if (!viewport) {
        root.style.setProperty('--vistoriapro-vv-top', '0px')
        root.style.setProperty('--vistoriapro-vv-bottom', '0px')
        return
      }

      const top = Math.max(0, viewport.offsetTop)
      const bottom = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)

      root.style.setProperty('--vistoriapro-vv-top', `${top}px`)
      root.style.setProperty('--vistoriapro-vv-bottom', `${bottom}px`)
    }

    updateVisualViewportVars()
    window.visualViewport?.addEventListener('resize', updateVisualViewportVars)
    window.visualViewport?.addEventListener('scroll', updateVisualViewportVars)
    window.addEventListener('resize', updateVisualViewportVars)
    window.addEventListener('orientationchange', updateVisualViewportVars)

    return () => {
      window.visualViewport?.removeEventListener('resize', updateVisualViewportVars)
      window.visualViewport?.removeEventListener('scroll', updateVisualViewportVars)
      window.removeEventListener('resize', updateVisualViewportVars)
      window.removeEventListener('orientationchange', updateVisualViewportVars)
    }
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
        <InstallPWAButton />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
