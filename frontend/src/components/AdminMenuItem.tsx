import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';

interface AdminMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const Item = styled(motion.li)`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s, color 0.2s;
  &:hover {
    background: #23212b;
    color: #ff6600;
  }
  
  @media (max-width: 640px) {
    background: #23212b;
    margin-bottom: 8px;
    padding: 12px 16px;
    font-size: 1rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    
    &:active {
      transform: scale(0.98);
    }
  }
`;

const IconWrapper = styled.span`
  display: flex;
  align-items: center;
  font-size: 1.5rem;
`;

const AdminMenuItem: React.FC<AdminMenuItemProps> = ({ icon, label, onClick }) => (
  <Item whileHover={{ scale: 1.05 }} onClick={onClick}>
    <IconWrapper>{icon}</IconWrapper>
    {label}
  </Item>
);

export default AdminMenuItem;
