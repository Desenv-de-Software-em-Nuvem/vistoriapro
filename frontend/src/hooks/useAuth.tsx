import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import api from '../services/api'

interface User {
  id: string
  name: string
  email: string
  empresa_id: number
  permitidoVistoria?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há um usuário logado no localStorage
    const savedUser = localStorage.getItem('vistoriapro_user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Erro ao carregar usuário salvo:', error)
        localStorage.removeItem('vistoriapro_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      console.log('Tentando login com:', { email, senha: password })
      console.log('URL da API:', import.meta.env.VITE_API_URL)
      
      const response = await api.post('/usuarios/login', { 
        email, 
        senha: password 
      })
      
      console.log('Resposta do login:', response.data)
      const { token, usuario } = response.data
      setUser({
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        empresa_id: usuario.empresa_id,
        permitidoVistoria: usuario.permitidoVistoria
      })
      localStorage.setItem('vistoriapro_user', JSON.stringify({
        id: usuario.id,
        name: usuario.nome,
        email: usuario.email,
        empresa_id: usuario.empresa_id,
        permitidoVistoria: usuario.permitidoVistoria
      }))
      localStorage.setItem('vistoriapro_token', token)
      setLoading(false)
      return true
    } catch (error: any) {
      console.error('Erro no login:', error)
      if (error.response) {
        console.error('Dados da resposta de erro:', error.response.data)
        console.error('Status da resposta:', error.response.status)
      }
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    // Guarda o ID do usuário antes de removê-lo para manter a referência nas vistorias salvas
    const userJson = localStorage.getItem('vistoriapro_user');
    let userId = null;
    try {
      if (userJson) {
        const userData = JSON.parse(userJson);
        userId = userData.id;
      }
    } catch (error) {
      console.error('Erro ao processar dados do usuário durante logout:', error);
    }

    setUser(null);
    localStorage.removeItem('vistoriapro_user');
    localStorage.removeItem('vistoriapro_token');
    localStorage.removeItem('vistoriapro_current_page');
    
    // Limpar outros dados de estado se necessário, mas manter dados de vistoria
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('vistoriapro_form_')) {
        localStorage.removeItem(key);
      }
    });
    
    // Log para indicar que o logout foi concluído
    console.log('Logout realizado, ID de usuário preservado para recuperação de vistorias:', userId);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
