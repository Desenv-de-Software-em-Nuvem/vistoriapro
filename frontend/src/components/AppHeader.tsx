import React from 'react';
import styled from 'styled-components';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
}

const Header = styled.header`
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding: 0 0 0 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  max-width: 100vw;
  z-index: 100;
  border-radius: 0;
`;

const BackButton = styled.button`
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.2s ease-in-out;
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  &:hover {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  background: ${({ theme }) => theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  flex: 1;
  font-weight: 700;
`;

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  rightContent,
  children
}) => {
  const navigate = useNavigate();
  return (
    <Header>
      {showBackButton && (
        <BackButton onClick={onBack || (() => navigate(-1))} aria-label="Voltar">
          <ArrowLeft size={20} />
        </BackButton>
      )}
      {/* <ImobLogo size="small" variant="icon-only" withBackground /> */}
      <Title>{title}</Title>
      {rightContent}
      {children}
    </Header>
  );
};
