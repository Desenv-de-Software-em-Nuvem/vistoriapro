import React, { useState } from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.aside<{ open: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: ${({ open }) => (open ? '220px' : '60px')};
  background: #18171c;
  box-shadow: 2px 0 8px rgba(0,0,0,0.08);
  transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: ${({ open }) => (open ? 'flex-start' : 'center')};
`;

const ToggleButton = styled.button`
  margin: 16px 0 0 16px;
  background: none;
  border: none;
  color: #ff6600;
  font-size: 2rem;
  cursor: pointer;
  outline: none;
`;

const MenuList = styled.ul<{ open: boolean }>`
  list-style: none;
  padding: 0;
  margin-top: 40px;
  width: 100%;
  opacity: ${({ open }) => (open ? 1 : 0)};
  transition: opacity 0.2s;
`;

const MenuItem = styled.li`
  padding: 16px 24px;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
  &:hover {
    background: #23212b;
    color: #ff6600;
  }
`;

const AdminSidebar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <SidebarContainer open={open}>
      <ToggleButton
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        onClick={() => setOpen((prev) => !prev)}
      >
        {open ? '←' : '☰'}
      </ToggleButton>
      <MenuList open={open}>
        <MenuItem>Cadastrar Usuário</MenuItem>
        <MenuItem>Editar Usuário</MenuItem>
        <MenuItem>Deletar Usuário</MenuItem>
        <MenuItem>Permissões de Vistoria</MenuItem>
        <MenuItem>Atribuir a Empresa</MenuItem>
      </MenuList>
    </SidebarContainer>
  );
};

export default AdminSidebar;
