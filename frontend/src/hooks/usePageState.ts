import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Hook para salvar e restaurar o estado da página atual
export const usePageState = () => {
  const location = useLocation()

  useEffect(() => {
    // Salva a URL atual no localStorage
    localStorage.setItem('vistoriapro_current_page', location.pathname + location.search)
  }, [location])

  const getCurrentPage = (): string => {
    return localStorage.getItem('vistoriapro_current_page') || '/dashboard'
  }

  const clearCurrentPage = () => {
    localStorage.removeItem('vistoriapro_current_page')
  }

  return {
    getCurrentPage,
    clearCurrentPage
  }
}

// Hook para preservar dados de formulário
export const useFormState = <T>(key: string, initialValue: T) => {
  const saveFormData = (data: T) => {
    localStorage.setItem(`vistoriapro_form_${key}`, JSON.stringify(data))
  }

  const getFormData = (): T => {
    const saved = localStorage.getItem(`vistoriapro_form_${key}`)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return initialValue
      }
    }
    return initialValue
  }

  const clearFormData = () => {
    localStorage.removeItem(`vistoriapro_form_${key}`)
  }

  return {
    saveFormData,
    getFormData,
    clearFormData
  }
}
