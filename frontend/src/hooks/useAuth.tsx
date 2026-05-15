import { useState, useEffect, useContext } from 'react'
import type { ReactNode } from 'react'
import api from '../services/api'
import { AuthContext } from './authContext'
import type { AuthContextType, User, UserRole } from './authContext'

interface AuthProviderProps {
  children: ReactNode
}

interface ApiUsuario {
  id: string | number
  nome: string
  email: string
  empresa_id: number
  papel?: UserRole
  permitidoVistoria?: boolean
}

interface JwtPayload {
  papel?: UserRole
  exp?: number
}

function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return false
  return payload.exp * 1000 <= Date.now()
}

function clearStoredSession() {
  localStorage.removeItem('vistoriapro_user')
  localStorage.removeItem('vistoriapro_token')
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedBase64 = base64.padEnd(base64.length + ((4 - base64.length % 4) % 4), '=')
    const json = window.atob(paddedBase64)
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

function normalizeUser(usuario: ApiUsuario, token?: string | null): User | null {
  const papel = usuario.papel || (token ? decodeJwtPayload(token)?.papel : undefined)
  if (!papel) return null

  return {
    id: String(usuario.id),
    name: usuario.nome,
    email: usuario.email,
    empresa_id: usuario.empresa_id,
    papel,
    permitidoVistoria: usuario.permitidoVistoria,
  }
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('vistoriapro_user')
    const token = localStorage.getItem('vistoriapro_token')

    if (!savedUser || !token || isTokenExpired(token)) {
      clearStoredSession()
      setLoading(false)
      return
    }

    try {
      const parsedUser = JSON.parse(savedUser) as Partial<User> & { nome?: string }
      const restoredUser = normalizeUser({
        id: parsedUser.id || '',
        nome: parsedUser.name || parsedUser.nome || '',
        email: parsedUser.email || '',
        empresa_id: parsedUser.empresa_id || 0,
        papel: parsedUser.papel,
        permitidoVistoria: parsedUser.permitidoVistoria,
      }, token)

      if (!restoredUser) {
        clearStoredSession()
        setLoading(false)
        return
      }

      setUser(restoredUser)
      localStorage.setItem('vistoriapro_user', JSON.stringify(restoredUser))
    } catch (error) {
      console.error('Erro ao carregar usuário salvo:', error)
      clearStoredSession()
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null)
    }

    window.addEventListener('vistoriapro:session-expired', handleSessionExpired)
    return () => window.removeEventListener('vistoriapro:session-expired', handleSessionExpired)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/usuarios/login', {
        email: email.trim(),
        senha: password.trim(),
      })
      const { token, usuario } = response.data
      const normalizedUser = normalizeUser(usuario, token)
      if (!normalizedUser) {
        throw new Error('Usuário autenticado sem papel de acesso.')
      }

      setUser(normalizedUser)
      localStorage.setItem('vistoriapro_user', JSON.stringify(normalizedUser))
      localStorage.setItem('vistoriapro_token', token)
      return true
    } catch (error) {
      console.error('Erro no login:', error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    clearStoredSession()
    localStorage.removeItem('vistoriapro_current_page')

    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('vistoriapro_form_')) {
        localStorage.removeItem(key)
      }
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
