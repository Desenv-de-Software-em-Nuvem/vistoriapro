import React from 'react'
import styled from 'styled-components'

interface LogoProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'horizontal' | 'icon-only'
  className?: string
  withBackground?: boolean
  inHeader?: boolean
}

const LogoWrapper = styled.div<{ size: string; inHeader?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: ${({ inHeader }) => inHeader ? '0.2rem 0 0.2rem 0' : '0'};
`

const SystemTitle = styled.div<{ size: string }>`
  text-align: center;
  font-size: ${({ theme, size }) => 
    size === 'small' ? theme.fontSizes.sm : 
    size === 'medium' ? theme.fontSizes.lg : theme.fontSizes.xl};
  font-weight: 600;
  background: ${({ theme }) => theme.colors.gradient.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`

const LogoFrame = styled.div<{ size: string; withBackground?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  ${({ withBackground }) => withBackground && `
    background: rgba(255,255,255,0.85);
    border-radius: 0.75em;
    padding: clamp(0.5em, 2vw, 1.2em);
    box-shadow: 0 8px 32px rgba(255, 69, 0, 0.10), 0 2px 8px rgba(0,0,0,0.08);
    border: 1.5px solid rgba(255,69,0,0.08);
    animation: fadeInLogo 1.2s cubic-bezier(0.4,0,0.2,1);
  `}
  @keyframes fadeInLogo {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
`

const LogoImage = styled.img<{ size: string }>`
  height: ${({ size }) =>
    size === 'small' ? '32px' :
    size === 'medium' ? 'clamp(60px, 18vw, 115px)' :
    'clamp(90px, 28vw, 172px)'};
  width: auto;
  object-fit: contain;
  margin: 0 auto;
  display: block;
  filter: drop-shadow(0 2px 18px rgba(255, 69, 0, 0.18));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  border-radius: 0.75em;
  box-shadow: none;
  padding: 0.2em;
  &:hover {
    transform: scale(1.04);
    filter: drop-shadow(0 0 24px rgba(255, 69, 0, 0.22));
  }
  @media (min-width: 768px) {
    height: ${({ size }) => size === 'small' ? '40px' : ''};
  }
`

export const VistoriaProLogo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'horizontal',
  className,
  withBackground = false,
  inHeader = false
}) => {
  if (variant === 'icon-only') {
    return (
      <LogoFrame size={size} className={className} withBackground={withBackground}>
        <LogoImage 
          src="/VistoriaPro.png" 
          alt="VistoriaPro" 
          size={size}
        />
      </LogoFrame>
    )
  }

  return (
  <LogoWrapper size={size} className={className} inHeader={inHeader}>
      <SystemTitle size={size}>
        Vistorias Sistema Profissional
      </SystemTitle>
      <LogoFrame size={size} withBackground={withBackground}>
        <LogoImage 
          src="/VistoriaPro.png" 
          alt="VistoriaPro" 
          size={size}
        />
      </LogoFrame>
    </LogoWrapper>
  )
}
