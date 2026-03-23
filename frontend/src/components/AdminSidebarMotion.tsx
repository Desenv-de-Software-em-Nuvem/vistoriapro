import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import AdminMenuItem from './AdminMenuItem';
import { Users, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SidebarContainer = styled(motion.aside)`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: #18171c;
  box-shadow: 2px 0 8px rgba(0,0,0,0.08);
  z-index: 100;
  display: flex;
  flex-direction: column;
  will-change: transform;
  
  @media (max-width: 640px) {
    box-shadow: 0 0 15px rgba(0,0,0,0.3);
    top: 0;
    bottom: 0;
    width: 250px !important;
    max-width: 80% !important;
    transform: translateX(${props => props.animate === 'closed' ? '-100%' : '0'}) !important;
  }
`;

const MenuList = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin-top: 40px;
  width: 100%;
  
  @media (max-width: 640px) {
    margin-top: 20px;
    padding: 0 10px;
  }
`;

const sidebarVariants = {
  open: { 
    width: 220, 
    transition: { 
      type: 'spring' as const, 
      stiffness: 300, 
      damping: 30 
    } 
  },
  closed: { 
    width: 60, 
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
  z-index: 99;
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
      {/* Botão de fechar visível só no mobile */}
      <button
        aria-label="Fechar menu"
        onClick={() => setSidebarOpen(false)}
        style={{
          background: 'rgba(255,102,0,0.1)',
          border: 'none',
          color: '#ff6600',
          fontSize: '1.5rem',
          cursor: 'pointer',
          outline: 'none',
          zIndex: 101,
          alignSelf: 'flex-end',
          margin: '16px 16px 0 0',
          display: 'none',
          padding: '4px 12px',
          borderRadius: '4px',
          fontWeight: 'bold',
        }}
        className="sidebar-close-mobile"
      >
        ←
      </button>
      <style>{`
        @media (max-width: 640px) {
          .sidebar-close-mobile {
            display: flex !important;
            align-items: center;
            justify-content: center;
          }
        }
      `}</style>
      <MenuList
        initial={false}
        animate={sidebarOpen ? 'open' : 'closed'}
        variants={menuVariants}
      >
        <AdminMenuItem icon={<Users size={22} />} label="Gerenciar Usuários" onClick={() => navigate('/admin/users')} />
        <AdminMenuItem icon={<Building2 size={22} />} label="Cadastrar Empresa" onClick={() => navigate('/admin/company')} />
      </MenuList>
    </SidebarContainer>
    </>
  );
};

export default AdminSidebarMotion;
