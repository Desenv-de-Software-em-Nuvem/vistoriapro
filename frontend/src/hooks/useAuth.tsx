import { useState, useEffect, useContext } from 'react'
import type { ReactNode } from 'react'
import api from '../services/api'
import { AuthContext } from './authContext'
import type { AuthContextType, User } from './authContext'

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
      // Não logar credenciais nem respostas em produção
      const response = await api.post('/usuarios/login', { 
        email, 
        senha: password 
      })
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
    let userId: string | null = null;
    try {
      if (userJson) {
        const userData = JSON.parse(userJson);
        userId = userData.id;
      }
    } catch (error) {
      console.error('Erro ao processar dados do usuário durante logout:', error);
    }

    // Referencia userId para evitar TS6133 (declarado mas não lido).
    // Mantemos a variável caso futuramente seja usada para preservar vistorias.
    void userId;

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
    
    // Logout concluído (não logar dados sensíveis)
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
