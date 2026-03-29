import React from 'react'
import styled from 'styled-components'
import { AlertTriangle, X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmButtonText?: string
  cancelButtonText?: string
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.lg};
`

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  width: 100%;
  max-width: min(450px, 96vw);
  box-shadow: 0 20px 32px -5px rgba(0, 0, 0, 0.13), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  overflow: auto;
  max-height: 100dvh;
  box-sizing: border-box;
`;

const ModalHeader = styled.div`
  padding: clamp(1em, 4vw, 2em);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundTertiary};
    color: ${({ theme }) => theme.colors.text};
  }
`

const ModalBody = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
`

const Message = styled.p`
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.base};
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.5;
`

const ModalFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Button = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ variant, theme }) => {
    switch (variant) {
      case 'danger':
        return `
          background: #ef4444;
          color: white;
          &:hover {
            background: #b91c1c;
          }
        `;
      case 'primary':
        return `
          background: ${theme.colors.primary};
          color: white;
          &:hover {
            background: ${theme.colors.primaryDark};
          }
        `;
      default:
        return `
          background: ${theme.colors.backgroundTertiary};
          color: ${theme.colors.text};
          &:hover {
            background: ${theme.colors.border};
          }
        `;
    }
  }}
`

export const ConfirmationModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar'
}) => {
  if (!isOpen) return null
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <AlertTriangle size={20} color="#ef4444" />
            {title}
          </ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={18} />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <Message>{message}</Message>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>{cancelButtonText}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmButtonText}</Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  )
}
