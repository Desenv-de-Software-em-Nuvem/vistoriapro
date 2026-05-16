import React from 'react';
import styled, { keyframes } from 'styled-components';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const SnackbarContainer = styled.div<{ type: 'success' | 'error' | 'info' }>`
  position: fixed;
  left: 50%;
  bottom: calc(var(--vistoriapro-vv-bottom, 0px) + 82px);
  transform: translateX(-50%);
  min-width: 220px;
  max-width: min(92vw, 520px);
  background: ${({ theme, type }) =>
    type === 'success' ? 'rgba(16, 185, 129, 0.16)' :
    type === 'error' ? 'rgba(239, 68, 68, 0.16)' : theme.colors.backgroundCard};
  border: 1px solid ${({ theme, type }) =>
    type === 'success' ? 'rgba(16, 185, 129, 0.45)' :
    type === 'error' ? 'rgba(239, 68, 68, 0.45)' : theme.colors.border};
  color: ${({ theme }) => theme.colors.textWhite};
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  padding: 0.85rem 0.9rem;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: 0 4px 24px ${({ theme }) => theme.colors.shadowDark};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  z-index: 13000;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: ${slideUp} 0.4s cubic-bezier(0.4,0,0.2,1);

  svg {
    flex: 0 0 auto;
    color: ${({ theme, type }) =>
      type === 'success' ? theme.colors.success :
      type === 'error' ? theme.colors.error : theme.colors.primaryLight};
  }

  @media (max-width: 600px) {
    left: 1rem;
    right: 1rem;
    width: auto;
    max-width: none;
    transform: none;
  }
`;

const Message = styled.span`
  flex: 1;
  min-width: 0;
  line-height: 1.4;
`;

const CloseButton = styled.button`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundGlass};
    color: ${({ theme }) => theme.colors.text};
  }
`;

interface SnackbarProps {
  open: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose?: () => void;
  duration?: number;
}

export const Snackbar: React.FC<SnackbarProps> = ({ open, message, type = 'info', onClose, duration = 3000 }) => {
  React.useEffect(() => {
    if (open && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, duration]);

  if (!open) return null;

  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;

  return (
    <SnackbarContainer type={type} role="alert" aria-live="assertive">
      <Icon size={19} />
      <Message>{message}</Message>
      {onClose && (
        <CloseButton type="button" onClick={onClose} aria-label="Fechar aviso">
          <X size={16} />
        </CloseButton>
      )}
    </SnackbarContainer>
  );
};
