import { createContext } from 'react'

export interface User {
  id: string
  name: string
  email: string
  empresa_id: number
  papel: 'admin' | 'vistoriador' | 'cliente'
  permitidoVistoria?: boolean
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)