import React from 'react'
import styled from 'styled-components'

interface VistoriaProIconProps {
  size?: number
  className?: string
}

const IconContainer = styled.div<{ size: number }>`
  width: ${({ size }) => `clamp(24px, ${size}px, 96px)`};
  height: ${({ size }) => `clamp(18px, ${size * 0.75}px, 72px)`};
  display: flex;
  align-items: flex-end;
  gap: clamp(0.5px, 0.5vw, 2px);
  filter: drop-shadow(0 0 8px ${({ theme }) => theme.colors.primary}40);
`

const Building = styled.div<{ height: number; size: number }>`
  width: ${({ size }) => `clamp(6px, ${size * 0.2}px, 32px)`};
  height: ${({ height, size }) => `clamp(10px, ${size * height}px, 64px)`};
  background: linear-gradient(180deg, #ff6b35 0%, #ff4500 100%);
  position: relative;
  border-radius: clamp(1px, 0.2vw, 3px) clamp(1px, 0.2vw, 3px) 0 0;
  
  &:before {
    content: '';
    position: absolute;
    top: 15%;
    left: 15%;
    right: 15%;
    bottom: 15%;
    background: repeating-linear-gradient(
      0deg,
      transparent 0px,
      transparent 2px,
      rgba(255, 255, 255, 0.1) 2px,
      rgba(255, 255, 255, 0.1) 4px
    );
    border-radius: clamp(1px, 0.2vw, 3px);
  }
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: clamp(1px, 0.2vw, 3px);
    background: #e63900;
    border-radius: 0 0 clamp(1px, 0.2vw, 3px) clamp(1px, 0.2vw, 3px);
  }
`

export const VistoriaProIcon: React.FC<VistoriaProIconProps> = ({ size = 32, className }) => {
  return (
    <IconContainer size={size} className={className}>
      <Building height={0.6} size={size} />
      <Building height={0.8} size={size} />
      <Building height={0.5} size={size} />
      <Building height={0.9} size={size} />
      <Building height={0.4} size={size} />
    </IconContainer>
  )
}
