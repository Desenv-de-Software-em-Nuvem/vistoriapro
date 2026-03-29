import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';

const ProgressBar = styled.div<{ width: string }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: ${({ theme }) => theme.colors.gradient.primary};
  width: ${props => props.width};
  z-index: 1000;
  transition: width 0.2s ease-in-out;
`;

function NavigationProgress() {
  const [width, setWidth] = useState('0%');
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setVisible(true);
    setWidth('30%');
    
    const timer1 = setTimeout(() => setWidth('90%'), 100);
    const timer2 = setTimeout(() => {
      setWidth('100%');
      const timer3 = setTimeout(() => {
        setVisible(false);
        setWidth('0%');
      }, 200);
      return () => clearTimeout(timer3);
    }, 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [location.pathname]);

  if (!visible) return null;
  
  return <ProgressBar width={width} />;
};

export default NavigationProgress;
