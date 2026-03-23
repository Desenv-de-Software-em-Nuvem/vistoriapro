import React from 'react';
import styled from 'styled-components';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

const BreadcrumbContainer = styled.nav`
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow-x: auto;
  white-space: nowrap;
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const BreadcrumbItem = styled.span`
  display: flex;
  align-items: center;
`;

const BreadcrumbLink = styled(Link)`
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  transition: color 0.2s;
  
  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const routeMap: Record<string, string> = {
  dashboard: 'Dashboard',
  'property-list': 'Lista de Imóveis',
  'property-registration': 'Cadastrar Imóvel',
  'property-category': 'Categorias',
  inspection: 'Vistoria',
  'property-laudo': 'Laudo',
  'admin': 'Administração',
  'users': 'Usuários'
};

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  
  return (
    <BreadcrumbContainer aria-label="breadcrumb">
      <BreadcrumbItem>
        <BreadcrumbLink to="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      
      {pathnames.map((value, index) => {
        const isLast = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const displayName = routeMap[value] || value;
        
        return (
          <BreadcrumbItem key={to}>
            <ChevronRight size={16} style={{ margin: '0 0.5rem' }} />
            {isLast ? (
              <span>{displayName}</span>
            ) : (
              <BreadcrumbLink to={to}>{displayName}</BreadcrumbLink>
            )}
          </BreadcrumbItem>
        );
      })}
    </BreadcrumbContainer>
  );
};

export default Breadcrumbs;
