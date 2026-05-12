import React from 'react'
import { AppHeader } from '../components/AppHeader'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  min-height: var(--vistoriapro-app-height, 100dvh);
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  box-sizing: border-box;
  padding-top: 88px;
  @media (max-width: 600px) {
    padding-top: 80px;
  }
`

export const ReportPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <AppHeader
        title="Relatório de Vistoria"
        showBackButton
        onBack={() => navigate('/dashboard')}
      />
    </Container>
  );
}
