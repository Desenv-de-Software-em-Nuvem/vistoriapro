import React, { useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface PrefetchLinkProps {
  to: string;
  prefetch?: boolean;
  prefetchTimeout?: number;
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

/**
 * Componente de Link com prefetch para melhorar a performance de navegação
 * Quando o mouse passa sobre o link (ou após um timeout), carrega os chunks
 * relacionados à página de destino antecipadamente
 */
const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  children,
  to,
  prefetch = true,
  prefetchTimeout = 0,
  onMouseEnter,
  ...props
}) => {
  const navigate = useNavigate();
  
  const prefetchPage = useCallback(() => {
    // Simula uma navegação para a rota sem realmente navegar
    // Isso faz o React Router carregar os chunks Lazy relacionados
    const tempNavigate = () => {
      const currentPath = window.location.pathname;
      
      if (typeof to === 'string' && to !== currentPath) {
        navigate(to, { replace: false, state: { prefetch: true } });
        navigate(-1);
      }
    };
    
    // Se timeout for definido, espera o tempo antes de prefetch
    if (prefetchTimeout > 0) {
      setTimeout(tempNavigate, prefetchTimeout);
    } else {
      tempNavigate();
    }
  }, [navigate, prefetchTimeout, to]);
  
  useEffect(() => {
    // Se prefetch automático após renderização for habilitado
    if (prefetch && prefetchTimeout > 0) {
      const timer = setTimeout(prefetchPage, prefetchTimeout);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [prefetch, prefetchPage, prefetchTimeout]);
  
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetch) {
      prefetchPage();
    }
    if (onMouseEnter) {
      onMouseEnter(e);
    }
  };
  
  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      {...props}
    >
      {children}
    </Link>
  );
};

export default PrefetchLink;
