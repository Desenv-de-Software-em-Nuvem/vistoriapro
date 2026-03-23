import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { AppRoutes } from './routes/AppRoutes'
import { GlobalStyles } from './styles/GlobalStyles'
import { theme } from './styles/theme'
import { AuthProvider } from './hooks/useAuth'
import InstallPWAButton from './components/InstallPWAButton'

function App() {
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
