import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import AdminMenuItem from './AdminMenuItem';
import { ChevronRight, Settings, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SidebarContainer = styled(motion.aside)`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: linear-gradient(180deg, rgba(24, 23, 31, 0.98) 0%, rgba(13, 13, 19, 0.98) 100%);
  border-right: 1px solid rgba(255, 69, 0, 0.16);
  box-shadow: 18px 0 42px rgba(0, 0, 0, 0.34);
  z-index: 200;
  display: flex;
  flex-direction: column;
  will-change: transform;
  padding: 18px 0;
  
  @media (max-width: 640px) {
    box-shadow: 18px 0 46px rgba(0,0,0,0.55);
    top: 0;
    bottom: 0;
    width: 292px !important;
    max-width: 86% !important;
    transform: translateX(${props => props.animate === 'closed' ? '-100%' : '0'}) !important;
  }
`;

const SidebarTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0 16px 18px;
`;

const SidebarTitle = styled.div`
  display: grid;
  gap: 2px;
`;

const SidebarEyebrow = styled.span`
  color: #ff6b35;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const SidebarHeading = styled.strong`
  color: #fff;
  font-size: 1rem;
  line-height: 1.2;
`;

const CloseButton = styled.button`
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  display: none;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid rgba(255, 69, 0, 0.18);
  background: rgba(255, 69, 0, 0.08);
  color: #ff6b35;
  cursor: pointer;

  @media (max-width: 640px) {
    display: inline-flex;
  }
`;

const MenuList = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: 0;
  width: 100%;
  
  @media (max-width: 640px) {
    padding: 0;
  }
`;

const sidebarVariants = {
  open: { 
    width: 280, 
    transition: { 
      type: 'spring' as const, 
      stiffness: 300, 
      damping: 30 
    } 
  },
  closed: { 
    width: 0, 
    transition: { 
      type: 'spring' as const, 
      stiffness: 300, 
      damping: 30 
    } 
  },
};

const menuVariants = {
  open: { 
    opacity: 1, 
    transition: { 
      delay: 0.1 
    } 
  },
  closed: { 
    opacity: 0 
  },
};

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 190;
  display: none;
  
  @media (max-width: 640px) {
    display: block;
  }
`;

interface AdminSidebarMotionProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminSidebarMotion: React.FC<AdminSidebarMotionProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const openAdmin = () => {
    setSidebarOpen(false);
    navigate('/admin/users');
  };

  return (
    <>
      {sidebarOpen && (
        <Overlay 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <SidebarContainer
        initial={false}
        animate={sidebarOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
      >
      <SidebarTop>
        <SidebarTitle>
          <SidebarEyebrow>Admin</SidebarEyebrow>
          <SidebarHeading>VistoriaPro</SidebarHeading>
        </SidebarTitle>
        <CloseButton type="button" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </CloseButton>
      </SidebarTop>
      <MenuList
        initial={false}
        animate={sidebarOpen ? 'open' : 'closed'}
        variants={menuVariants}
      >
        <AdminMenuItem
          icon={<Settings size={20} />}
          label="Administração"
          description="Usuários e empresas"
          endIcon={<ChevronRight size={16} />}
          onClick={openAdmin}
        />
      </MenuList>
    </SidebarContainer>
    </>
  );
};

export default AdminSidebarMotion;
