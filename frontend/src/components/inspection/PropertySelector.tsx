import React from 'react';
import styled from 'styled-components';
import { Building2 } from 'lucide-react';
import type { Imovel } from '../../services/imovelService';

const SectionTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const RoomCard = styled.button<{ isSelected: boolean; isCompleted: boolean }>`
  background: ${({ theme, isSelected, isCompleted }) => 
    isCompleted ? theme.colors.success + '20' :
    isSelected ? theme.colors.primary + '20' : 
    theme.colors.backgroundGlass};
  border: 2px solid ${({ theme, isSelected, isCompleted }) => 
    isCompleted ? theme.colors.success :
    isSelected ? theme.colors.primary : 
    theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: 72px;
  min-width: 100px;
  @media (max-width: 600px) {
    min-height: 56px;
    min-width: 80px;
    padding: ${({ theme }) => theme.spacing.md};
  }
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  backdrop-filter: blur(10px);
`;

const RoomIcon = styled.div<{ isCompleted: boolean }>`
  font-size: 2rem;
  color: ${({ theme, isCompleted }) => 
    isCompleted ? theme.colors.success : theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const RoomName = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: center;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

interface PropertySelectorProps {
  imoveis: Imovel[];
  tipoSelecionado: string;
  loadingImoveis: boolean;
  onSelect: (imovel: Imovel) => void;
}

export const PropertySelector: React.FC<PropertySelectorProps> = ({ imoveis, tipoSelecionado, loadingImoveis, onSelect }) => (
  <section>
    <SectionTitle>
      <Building2 size={24} /> Selecione o imóvel a ser vistoriado
    </SectionTitle>
    {loadingImoveis ? (
      <p>Carregando imóveis...</p>
    ) : imoveis.filter(imovel => tipoSelecionado ? imovel.tipo === tipoSelecionado : true).length === 0 ? (
      <EmptyState>
        <Building2 size={48} />
        <p>
          {tipoSelecionado 
            ? `Nenhum imóvel do tipo "${tipoSelecionado}" encontrado.` 
            : 'Nenhum imóvel cadastrado.'}
        </p>
        <p>Cadastre um imóvel primeiro para iniciar uma vistoria.</p>
      </EmptyState>
    ) : (
      <RoomGrid>
        {imoveis
          .filter(imovel => tipoSelecionado
            ? String(imovel.tipo).toLowerCase() === String(tipoSelecionado).toLowerCase()
            : true)
          .map(imovel => (
            <RoomCard
              key={imovel.id}
              isSelected={false}
              isCompleted={false}
              onClick={() => onSelect(imovel)}
            >
              <RoomIcon isCompleted={false}>
                <Building2 size={32} />
              </RoomIcon>
              <RoomName>{imovel.nome}</RoomName>
              <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{imovel.tipo}</div>
            </RoomCard>
          ))}
      </RoomGrid>
    )}
  </section>
);
