import React from 'react';
import { createPortal } from 'react-dom';
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
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: fixed;
  top: var(--vistoriapro-vv-top, 0px);
  left: 0;
  right: 0;
  width: 100%;
  z-index: 1100;
  border-radius: 0;
  box-sizing: border-box;
  padding: env(safe-area-inset-top, 0px) clamp(0.75rem, 3vw, 1.25rem) 0;
  box-shadow: 0 10px 26px ${({ theme }) => theme.colors.shadow};
  transform: translateZ(0);
  will-change: transform;
  isolation: isolate;
`;

const HeaderContent = styled.div`
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  min-width: 0;

  @media (max-width: 768px) {
    height: 56px;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`;

const BackButton = styled.button`
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  padding: 0;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: all 0.2s ease-in-out;
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundTertiary};
    color: ${({ theme }) => theme.colors.text};
  }

  &:active {
    transform: scale(0.96);
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
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
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  onBack,
  rightContent,
  children
}) => {
  const navigate = useNavigate();

  const header = (
    <Header>
      <HeaderContent>
        {showBackButton && (
          <BackButton onClick={onBack || (() => navigate(-1))} aria-label="Voltar">
            <ArrowLeft size={20} />
          </BackButton>
        )}
        {/* <ImobLogo size="small" variant="icon-only" withBackground /> */}
        <Title>{title}</Title>
        {rightContent}
        {children}
      </HeaderContent>
    </Header>
  );

  if (typeof document === 'undefined') {
    return header;
  }

  return createPortal(header, document.body);
};
