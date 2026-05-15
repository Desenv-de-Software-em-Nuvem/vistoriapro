import { createContext } from 'react'

export type UserRole = 'admin' | 'vistoriador' | 'cliente'

export interface User {
  id: string
  name: string
  email: string
  empresa_id: number
  papel: UserRole
  permitidoVistoria?: boolean
}

export interface LoginResult {
  success: boolean
  message?: string
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)