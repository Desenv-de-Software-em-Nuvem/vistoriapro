import React, { useState } from 'react';
import styled from 'styled-components';
import { Plus, LogOut, Building2, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { VistoriaProLogo } from '../components/VistoriaProLogo';
import { v4 as uuidv4 } from 'uuid';
import AdminSidebarMotion from '../components/AdminSidebarMotion';

const Container = styled.div<{ sidebarOpen: boolean }>`
  min-height: 100dvh;
  height: 100dvh;
  background: ${({ theme }) => theme.colors.background};
  width: 100vw;
  max-width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding-left: ${({ sidebarOpen }) => (sidebarOpen ? '220px' : '0')};
  transition: padding-left 0.3s cubic-bezier(0.4,0,0.2,1);
  will-change: transform;
  @media (max-width: 640px) {
    padding-left: 0;
  }
`

const FixedHeader = styled.header`
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: clamp(0.75rem, 3vw, 2rem) clamp(1rem, 6vw, 3rem);
  box-shadow: 0 4px 20px ${({ theme }) => theme.colors.shadowDark};
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100vw;
  max-width: 100vw;
  will-change: transform;
  @media (max-width: 640px) {
    padding: clamp(0.5rem, 4vw, 1.25rem) clamp(0.5rem, 6vw, 1.5rem);
    box-shadow: none;
    backdrop-filter: none;
  }
`

const Logo = styled.div`
  display: flex;
  align-items: center;
`

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  @media (max-width: 640px) {
    display: none;
  }
`

const UserName = styled.span`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const UserEmail = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`

const LogoutButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: transparent;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.2s ease-in-out;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.error};
  }
`

const Main = styled.main`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(1rem, 4vw, 2rem);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 2rem);
  will-change: transform;
  @media (max-width: 768px) {
    padding: clamp(0.5rem, 4vw, 1rem);
    gap: clamp(0.5rem, 2vw, 1rem);
  }
`

const WelcomeSection = styled.section`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: clamp(1rem, 4vw, 2rem);
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  margin-bottom: clamp(1rem, 3vw, 2rem);
  box-shadow: 0 4px 16px ${({ theme }) => theme.colors.shadowDark};
  will-change: transform;
  @media (max-width: 640px) {
    box-shadow: none;
    backdrop-filter: none;
    border-radius: ${({ theme }) => theme.borderRadius.lg};
    padding: clamp(0.75rem, 3vw, 1.5rem);
  }
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 100vw;
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${({ theme }) => theme.colors.gradient.primary};
    border-radius: ${({ theme }) => theme.borderRadius['2xl']} ${({ theme }) => theme.borderRadius['2xl']} 0 0;
    @media (max-width: 640px) {
      border-radius: ${({ theme }) => theme.borderRadius.lg} ${({ theme }) => theme.borderRadius.lg} 0 0;
    }
  }
`

const WelcomeTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  background: ${({ theme }) => theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: 800;
  letter-spacing: -0.02em;
  
  @media (max-width: 640px) {
    font-size: ${({ theme }) => theme.fontSizes['3xl']};
  }
`

const WelcomeSubtitle = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ActionGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: clamp(1rem, 3vw, 2.5rem);
  margin-bottom: clamp(1rem, 3vw, 2rem);
  width: 65%;
  margin-left: auto;
  margin-right: auto;
  @media (max-width: 1024px) {
    width: 80%;
  }
  @media (max-width: 768px) {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(0.75rem, 2vw, 1.5rem);
    margin-bottom: clamp(0.75rem, 2vw, 1.5rem);
  }
`

const ActionIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.backgroundGlass};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.primary};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
`

const ActionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`

const ActionDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin: 0;
  line-height: 1.6;
  transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);
`

const ActionCard = styled.button<{ disabled?: boolean }>`
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.border};
  padding: clamp(1.25rem, 4vw, 2.5rem);
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: 0 4px 20px ${({ theme }) => theme.colors.shadowDark};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 1.2rem;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  min-width: 0;
  min-height: 120px;
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${({ theme }) => theme.colors.gradient.primary};
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  &:hover {
    transform: translateY(-8px);
    box-shadow: 
      0 20px 40px ${({ theme }) => theme.colors.shadowDark},
      0 0 40px ${({ theme }) => theme.colors.shadowGlow};
    border-color: ${({ theme }) => theme.colors.primary};
    &:before {
      transform: scaleX(1);
    }
    ${ActionIcon} {
      background: ${({ theme }) => theme.colors.gradient.primary};
      color: ${({ theme }) => theme.colors.textWhite};
      transform: scale(1.1);
    }
    ${ActionTitle} {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
  @media (max-width: 768px) {
    padding: clamp(1rem, 3vw, 1.5rem);
    gap: clamp(0.5rem, 2vw, 1rem);
    backdrop-filter: none;
    box-shadow: 0 2px 10px ${({ theme }) => theme.colors.shadowDark};
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px ${({ theme }) => theme.colors.shadowDark};
    }
  }
  @media (max-width: 480px) {
    padding: clamp(0.75rem, 2vw, 1rem);
    gap: clamp(0.25rem, 1vw, 0.5rem);
    border-radius: ${({ theme }) => theme.borderRadius.lg};
    box-shadow: 0 1px 5px ${({ theme }) => theme.colors.shadowDark};
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px ${({ theme }) => theme.colors.shadowDark};
    }
    &:active {
      transform: scale(0.98);
    }
  }
`

// Estilos de "Estatísticas" removidos

export const UserHeader: React.FC = () => {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <FixedHeader>
      <Logo>
  <VistoriaProLogo size="small" variant="icon-only" withBackground={true} />
      </Logo>

      <UserSection>
        <UserInfo>
          <UserName>{user?.name}</UserName>
          <UserEmail>{user?.email}</UserEmail>
        </UserInfo>

        <LogoutButton onClick={handleLogout}>
          <LogOut size={20} />
        </LogoutButton>
      </UserSection>
    </FixedHeader>
  )
}

export const DashboardPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Adiciona permitidoVistoria à tipagem do usuário
  type UserWithPermissao = typeof user & { permitidoVistoria?: boolean }
  const userWithPermissao = user as UserWithPermissao

  const handleNewInspection = () => {
    if (!userWithPermissao?.permitidoVistoria) return;
    const inspectionId = uuidv4();
    navigate(`/property-category/${inspectionId}`);
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {sidebarOpen && <AdminSidebarMotion sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />}
      <Container sidebarOpen={sidebarOpen}>
        <FixedHeader>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setSidebarOpen((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: '#ff6600',
                fontSize: '2rem',
                cursor: 'pointer',
                outline: 'none',
                zIndex: 101,
                position: 'relative',
                display: 'block',
              }}
            >
              {sidebarOpen ? '←' : '☰'}
            </button>
            <Logo>
              <VistoriaProLogo size="small" variant="icon-only" withBackground={true} />
            </Logo>
          </div>
          <UserSection>
            <UserInfo>
              <UserName>{user?.name}</UserName>
              <UserEmail>{user?.email}</UserEmail>
            </UserInfo>
            <LogoutButton onClick={handleLogout}>
              <LogOut size={20} />
            </LogoutButton>
          </UserSection>
        </FixedHeader>
        <Main>
          <WelcomeSection>
            <WelcomeTitle>Bem-vindo, {user?.name?.split(' ')[0]}!</WelcomeTitle>
            <WelcomeSubtitle>
              O que você gostaria de fazer hoje?
            </WelcomeSubtitle>
            <ActionGrid>
              <ActionCard onClick={() => navigate('/property-registration')}>
                <ActionIcon>
                  <Building2 size={24} />
                </ActionIcon>
                <div>
                  <ActionTitle>Cadastrar Imóvel</ActionTitle>
                  <ActionDescription>
                    Cadastre um novo imóvel no sistema para futuras vistorias
                  </ActionDescription>
                </div>
              </ActionCard>
              <ActionCard
                onClick={handleNewInspection}
                disabled={!userWithPermissao?.permitidoVistoria}
              >
                <ActionIcon>
                  <Plus size={24} />
                </ActionIcon>
                <div>
                  <ActionTitle>Nova Vistoria</ActionTitle>
                  <ActionDescription>
                    Inicie uma nova vistoria de imóvel com captura de fotos e áudio
                  </ActionDescription>
                </div>
              </ActionCard>
              {!userWithPermissao?.permitidoVistoria && (
                <p style={{ color: 'red', marginTop: 8 }}>
                  Você está bloqueado para iniciar novas vistorias.
                </p>
              )}
              <ActionCard onClick={() => navigate('/property-list')}>
                <ActionIcon>
                  <List size={24} />
                </ActionIcon>
                <div>
                  <ActionTitle>Listar Imóveis</ActionTitle>
                  <ActionDescription>
                    Visualize e gerencie todos os imóveis cadastrados
                  </ActionDescription>
                </div>
              </ActionCard>
            </ActionGrid>
          </WelcomeSection>
          {/* Estatísticas removidas a pedido do cliente */}
        </Main>
      </Container>
    </>
  );
};
