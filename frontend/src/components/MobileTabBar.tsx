import React from 'react'
import styled from 'styled-components'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, Building2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../hooks/useAuth'

// Barra inferior fixa para UX estilo aplicativo (mobile-first)
// Itens: Dashboard, Imóveis, Nova Vistoria

const TabBar = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom, 0);
`;

const TabButton = styled.button<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: ${({ theme, active }) => (active ? theme.colors.primary : theme.colors.textSecondary)};
  font-size: 11px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 12px;
  transition: color 0.2s ease, background 0.2s ease, transform 0.1s ease;
  min-width: 80px;

  &:active {
    transform: scale(0.96);
  }

  svg {
    width: 22px;
    height: 22px;
  }
`;

export const MobileTabBar: React.FC = () => {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  // Se o backend não popular 'permitidoVistoria', permitimos por padrão
  const permitidoVistoria = (user as any)?.permitidoVistoria !== false

  const go = (path: string) => () => navigate(path)

  const isDashboard = pathname.startsWith('/dashboard')
  const isList = pathname.startsWith('/property-list') || pathname.startsWith('/property-')
  const isInspection = pathname.startsWith('/inspection') || pathname.startsWith('/property-category')

  const startInspectionFlow = () => {
    if (!permitidoVistoria) {
      alert('Você está bloqueado para iniciar novas vistorias.')
      return
    }
    const inspectionId = uuidv4()
    navigate(`/property-category/${inspectionId}`)
  }

  return (
    <TabBar role="navigation" aria-label="Navegação principal">
      <TabButton active={isDashboard} onClick={go('/dashboard')} aria-current={isDashboard ? 'page' : undefined}>
        <Home />
        <span>Início</span>
      </TabButton>

      <TabButton active={isList} onClick={go('/property-list')} aria-current={isList ? 'page' : undefined}>
        <Building2 />
        <span>Imóveis</span>
      </TabButton>

      <TabButton active={isInspection} onClick={startInspectionFlow} aria-current={isInspection ? 'page' : undefined}>
        <FileText />
        <span>Vistoria</span>
      </TabButton>
    </TabBar>
  )
}

export default MobileTabBar
