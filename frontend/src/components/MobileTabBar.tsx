import React from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, FileText, Building2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { useAuth } from '../hooks/useAuth'
import { useFeedback } from './FeedbackProvider'

// Barra inferior fixa para UX estilo aplicativo (mobile-first)
// Itens: Dashboard, Imóveis, Nova Vistoria

const TabBar = styled.nav`
  position: fixed;
  bottom: var(--vistoriapro-vv-bottom, 0px);
  left: 0;
  right: 0;
  width: 100%;
  max-width: 100vw;
  height: calc(64px + env(safe-area-inset-bottom, 0px));
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  z-index: 1090;
  padding-bottom: env(safe-area-inset-bottom, 0);
  padding-top: 0;
  box-sizing: border-box;
  overflow: hidden;
  overscroll-behavior: none;
  transform: translateZ(0);
  will-change: transform;
  isolation: isolate;
  contain: layout paint;

  &::-webkit-scrollbar {
    display: none;
    width: 0;
    height: 0;
  }
`;

const TabButton = styled.button<{ $active?: boolean }>`
  flex: 1 1 0;
  width: 33.333%;
  max-width: 33.333%;
  min-width: 0;
  min-height: 0;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  color: ${({ theme, $active }) => ($active ? theme.colors.primary : theme.colors.textSecondary)};
  font-size: 11px;
  font-weight: 600;
  padding: 6px 10px;
  margin: 0;
  border-radius: 12px;
  transition: color 0.2s ease, background 0.2s ease, transform 0.1s ease;
  overflow: hidden;
  box-sizing: border-box;
  contain: paint;

  &::before {
    content: none;
    display: none;
  }

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
  const { notify } = useFeedback()

  // Se o backend não popular 'permitidoVistoria', permitimos por padrão
  const permitidoVistoria = user?.permitidoVistoria !== false

  const go = (path: string) => () => navigate(path)

  const isInspection = pathname.startsWith('/inspection') || pathname.startsWith('/property-category')
  const isDashboard = pathname.startsWith('/dashboard')
  const isList = pathname.startsWith('/property-list') || (pathname.startsWith('/property-') && !isInspection)

  const startInspectionFlow = () => {
    if (!permitidoVistoria) {
      notify({ message: 'Você está bloqueado para iniciar novas vistorias.', type: 'error' })
      return
    }
    const inspectionId = uuidv4()
    navigate(`/property-category/${inspectionId}`)
  }

  const tabBar = (
    <TabBar role="navigation" aria-label="Navegação principal">
      <TabButton $active={isDashboard} onClick={go('/dashboard')} aria-current={isDashboard ? 'page' : undefined}>
        <Home />
        <span>Início</span>
      </TabButton>

      <TabButton $active={isList} onClick={go('/property-list')} aria-current={isList ? 'page' : undefined}>
        <Building2 />
        <span>Imóveis</span>
      </TabButton>

      <TabButton $active={isInspection} onClick={startInspectionFlow} aria-current={isInspection ? 'page' : undefined}>
        <FileText />
        <span>Vistoria</span>
      </TabButton>
    </TabBar>
  )

  if (typeof document === 'undefined') {
    return tabBar;
  }

  return createPortal(tabBar, document.body)
}

export default MobileTabBar
