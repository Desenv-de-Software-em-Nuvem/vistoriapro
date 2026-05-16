import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface AdminMenuItemProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  endIcon?: React.ReactNode;
  onClick?: () => void;
}

const Item = styled.li`
  padding: 0 12px;
`;

const ItemButton = styled(motion.button)`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  color: #fff;
  font-size: 0.98rem;
  cursor: pointer;
  border-radius: 12px;
  border: 1px solid rgba(255, 69, 0, 0.14);
  background: rgba(255, 69, 0, 0.08);
  text-align: left;
  transition: background 0.2s, border-color 0.2s, color 0.2s;

  &:hover {
    background: rgba(255, 69, 0, 0.14);
    border-color: rgba(255, 69, 0, 0.35);
    color: #ff6600;
  }

  &:focus-visible {
    outline: 2px solid #ff6b35;
    outline-offset: 2px;
  }
  
  @media (max-width: 640px) {
    padding: 13px;
    font-size: 1rem;
    
    &:active {
      transform: scale(0.98);
    }
  }
`;

const IconWrapper = styled.span`
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(255, 69, 0, 0.14);
  color: #ff6b35;
`;

const LabelBlock = styled.span`
  min-width: 0;
  flex: 1;
  display: grid;
  gap: 2px;
`;

const Label = styled.span`
  font-weight: 800;
  line-height: 1.2;
`;

const Description = styled.span`
  color: #a8a4b8;
  font-size: 0.78rem;
  line-height: 1.3;
`;

const EndIcon = styled.span`
  flex: 0 0 auto;
  color: #a8a4b8;
`;

const AdminMenuItem: React.FC<AdminMenuItemProps> = ({ icon, label, description, endIcon, onClick }) => (
  <Item>
    <ItemButton type="button" whileHover={{ scale: 1.02 }} onClick={onClick}>
      <IconWrapper>{icon}</IconWrapper>
      <LabelBlock>
        <Label>{label}</Label>
        {description && <Description>{description}</Description>}
      </LabelBlock>
      {endIcon && <EndIcon>{endIcon}</EndIcon>}
    </ItemButton>
  </Item>
);

export default AdminMenuItem;
