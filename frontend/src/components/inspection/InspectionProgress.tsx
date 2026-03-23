import React from 'react';
import styled from 'styled-components';
import { CheckCircle } from 'lucide-react';

const ProgressSection = styled.section`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  backdrop-filter: blur(20px);
`;

const ProgressTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ProgressBar = styled.div`
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  height: 8px;
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ProgressFill = styled.div<{ percentage: number }>`
  background: ${({ theme }) => theme.colors.gradient.primary};
  height: 100%;
  width: ${({ percentage }) => percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin: 0;
`;

interface InspectionProgressProps {
  completed: number;
  total: number;
}

export const InspectionProgress: React.FC<InspectionProgressProps> = ({ completed, total }) => (
  <ProgressSection>
    <ProgressTitle>
      <CheckCircle size={20} />
      Progresso da Vistoria
    </ProgressTitle>
    <ProgressBar>
      <ProgressFill percentage={total > 0 ? (completed / total) * 100 : 0} />
    </ProgressBar>
    <ProgressText>
      {completed} de {total} cômodos concluídos
      {completed === total && ' • Vistoria completa! Salve para finalizar.'}
    </ProgressText>
  </ProgressSection>
);
