const SearchInput = styled.input`
  width: 100%;
  padding: 1.25rem 1.25rem 1.25rem 3rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: 0.98rem;
  background: ${({ theme }) => theme.colors.backgroundCard};
  color: ${({ theme }) => theme.colors.text};
  transition: all 0.3s ease;
  padding-left: 2.5rem;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary}40;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.sm} 2.5rem;
  }
`;
import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Search, MapPin, Building2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { AppHeader } from '../components/AppHeader'
import { MobileTabBar } from '../components/MobileTabBar'

const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  height: 100dvh;
  background: ${({ theme }) => theme.colors.background};
  width: 100vw;
  max-width: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  box-sizing: border-box;
  padding: ${({ theme }) => theme.spacing.lg};
  padding-top: 80px;
  padding-bottom: 88px; /* espaço para tab bar fixa */

  @media (max-width: 768px) {
    padding: ${({ theme }) => theme.spacing.md};
    padding-top: 72px;
  }
`



const SearchContainer = styled.div`
  position: relative;
  max-width: 400px;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 768px) {
    max-width: 100%;
    margin-bottom: ${({ theme }) => theme.spacing.md};
  }
`

const SearchIcon = styled.div`
  position: absolute;
  left: ${({ theme }) => theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
`

const FiltersRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 16px 0;
`;

const FilterChip = styled.button<{active?: boolean}>`
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme, active }) => active ? theme.colors.primary + '20' : theme.colors.backgroundTertiary};
  color: ${({ theme, active }) => active ? theme.colors.primary : theme.colors.textSecondary};
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
`;

const StatsBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: row;
    gap: ${({ theme }) => theme.spacing.xs};
    padding: ${({ theme }) => theme.spacing.sm};
    justify-content: center;
  }
`

const StatItem = styled.div`
  text-align: center;
  min-width: 90px;
  white-space: nowrap;
  @media (max-width: 768px) {
    min-width: 70px;
    font-size: 0.92em;
  }
`

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.primary};
`

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
  min-width: 0;
  overflow-x: auto;
  box-sizing: border-box;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.md};
  }
`

const PropertyCard = styled.div`
  background: ${({ theme }) => theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border: 2px solid ${({ theme }) => theme.colors.primary}40;
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  padding: ${({ theme }) => theme.spacing.xl};
  transition: box-shadow 0.3s, border-color 0.3s;
  position: relative;
  box-shadow: 0 8px 32px ${({ theme }) => theme.colors.shadowGlow};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover {
    box-shadow: 0 16px 48px ${({ theme }) => theme.colors.primary}40;
    border-color: ${({ theme }) => theme.colors.primary};
    transform: translateY(-2px) scale(1.01);
  }
`

const PropertyHeader = styled.div`
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const PropertyActionsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

const LaudoButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  min-width: 160px;
  padding: 0 24px;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary} 0%, ${({ theme }) => theme.colors.primaryDark || theme.colors.primary} 100%);
  color: #fff;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.5px;
  transition: background 0.2s, transform 0.2s;
  cursor: pointer;
  margin-left: 0;
  white-space: nowrap;
  gap: 8px;

  &:hover {
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.primaryDark || theme.colors.primary} 0%, ${({ theme }) => theme.colors.primary} 100%);
    transform: translateY(-2px) scale(1.04);
  }

  @media (max-width: 600px) {
    height: 28px;
    font-size: 13px;
    min-width: 110px;
    padding: 0 12px;
  }
`

const PropertyAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  margin: ${({ theme }) => theme.spacing.md} 0;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.4;
`

const PropertyUnit = styled.div`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PropertyMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textLight};
`

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.text};
`

const EmptyDescription = styled.p`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${({ theme }) => theme.spacing['3xl']};
`

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

interface Imovel {
  id: number
  nome: string
  endereco_completo: string
  unidade?: string
  cidade: string
  uf: string
  cep?: string
  tipo: string
  observacoes?: string
  created_at: string
}

export const PropertyListPage: React.FC = () => {
  const navigate = useNavigate()
  const [imoveis, setImoveis] = useState<Imovel[]>([])
  const [filteredImoveis, setFilteredImoveis] = useState<Imovel[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imovelToDelete, setImovelToDelete] = useState<{id: number, nome: string} | null>(null)
  const [activeType, setActiveType] = useState<string>('')

  const loadImoveis = async () => {
    try {
      setLoading(true)
      const response = await api.get('/imoveis')
      setImoveis(response.data.imoveis)
      setFilteredImoveis(response.data.imoveis)
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadImoveis()
  }, [])


  // Filtro de busca
  useEffect(() => {
    const base = activeType ? imoveis.filter(i => i.tipo === activeType) : imoveis
    if (searchTerm.trim() === '') {
      setFilteredImoveis(base)
    } else {
      const filtered = base.filter(imovel =>
        imovel.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imovel.endereco_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imovel.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        imovel.tipo.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredImoveis(filtered)
    }
  }, [searchTerm, imoveis, activeType])

  const handleDelete = (id: number, nome: string) => {
    setImovelToDelete({ id, nome })
    setIsModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!imovelToDelete) return
    
    try {
      await api.delete(`/imoveis/${imovelToDelete.id}`)
      setIsModalOpen(false)
      setImovelToDelete(null)
      await loadImoveis() // Recarregar lista
    } catch (error) {
      console.error('Erro ao excluir imóvel:', error)
      alert('Erro ao excluir imóvel')
      setIsModalOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  return (
    <Container>
      <AppHeader
        title="Imóveis Cadastrados"
        showBackButton
        onBack={() => navigate('/dashboard')}
      />
      <SearchRow>
        <SearchContainer style={{flex: 1}}>
          <SearchIcon>
            <Search size={20} />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Pesquisar imóvel, endereço, cidade ou tipo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="Pesquisar imóveis"
          />
        </SearchContainer>
      </SearchRow>

      {imoveis.length > 0 && (
        <FiltersRow>
          <FilterChip active={!activeType} onClick={() => setActiveType('')}>Todos</FilterChip>
          {Array.from(new Set(imoveis.map(i => i.tipo))).map(tipo => (
            <FilterChip key={tipo} active={activeType === tipo} onClick={() => setActiveType(tipo)}>
              {tipo.toUpperCase()}
            </FilterChip>
          ))}
        </FiltersRow>
      )}

      <StatsBar>
        <StatItem>
          <StatNumber>{imoveis.length}</StatNumber>
          <StatLabel>Total de Imóveis</StatLabel>
        </StatItem>
        <StatItem>
          <StatNumber>{filteredImoveis.length}</StatNumber>
          <StatLabel>Resultados</StatLabel>
        </StatItem>
        <StatItem>
          <StatNumber>{new Set(imoveis.map(i => i.tipo)).size}</StatNumber>
          <StatLabel>Tipos Diferentes</StatLabel>
        </StatItem>
      </StatsBar>

      {loading ? (
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      ) : filteredImoveis.length === 0 ? (
        <EmptyState>
          <EmptyIcon>🏠</EmptyIcon>
          <EmptyTitle>
            {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhum imóvel cadastrado'}
          </EmptyTitle>
          <EmptyDescription>
            {searchTerm 
              ? 'Tente ajustar sua busca ou cadastre um novo imóvel.'
              : 'Use o botão "Novo Imóvel" acima para cadastrar imóveis.'
            }
          </EmptyDescription>
        </EmptyState>
      ) : (
        <PropertyGrid>
          {filteredImoveis.map((imovel) => (
            <PropertyCard key={imovel.id}>
              <PropertyHeader>
                <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
                  <LaudoButton onClick={() => navigate(`/property-laudo/${imovel.id}`)}>
                    Laudo de Vistoria
                  </LaudoButton>
                </div>
                <PropertyActionsRow>
                  <ActionButton 
                    variant="edit" 
                    title="Editar"
                    onClick={() => navigate(`/property-edit/${imovel.id}`)}
                  >
                    ✏️
                  </ActionButton>
                  <ActionButton 
                    variant="delete" 
                    title="Excluir"
                    onClick={() => handleDelete(imovel.id, imovel.nome)}
                  >
                    🗑️
                  </ActionButton>
                </PropertyActionsRow>
              </PropertyHeader>

              <PropertyAddress>
                <MapPin size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  {imovel.endereco_completo}
                  <br />
                  {imovel.cidade} - {imovel.uf}
                  {imovel.cep && ` • CEP: ${imovel.cep}`}
                </div>
              </PropertyAddress>

              {imovel.unidade && (
                <PropertyUnit>
                  <strong>Unidade:</strong> {imovel.unidade}
                </PropertyUnit>
              )}

              <PropertyMeta>
                <span>Cadastrado em {formatDate(imovel.created_at)}</span>
                <Building2 size={14} />
              </PropertyMeta>
            </PropertyCard>
          ))}
        </PropertyGrid>
      )}
    
      {imovelToDelete && (
        <ConfirmationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setImovelToDelete(null)
          }}
          onConfirm={confirmDelete}
          title="Confirmar exclusão"
          message={`Tem certeza que deseja excluir o imóvel "${imovelToDelete.nome}"? Esta ação não pode ser desfeita.`}
          confirmButtonText="Excluir"
          cancelButtonText="Cancelar"
        />
      )}

      <FabButton onClick={() => navigate('/property-registration')} aria-label="Novo Imóvel">+
      </FabButton>

      <MobileTabBar />
    </Container>
  )
}

const SearchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 32px 0 24px 0;
  width: 100%;
  max-width: 1000px;
`;

const FabButton = styled.button`
  position: fixed;
  right: 20px;
  bottom: 84px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: 28px;
  font-weight: 700;
  box-shadow: 0 12px 24px ${({ theme }) => theme.colors.shadowGlow};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const ActionButton = styled.button<{ variant?: 'view' | 'edit' | 'delete' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: #444;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s, transform 0.2s;
  cursor: pointer;
  font-size: 18px;
  margin-right: 4px;
  padding: 0;
  min-width: 0;
  min-height: 0;
  box-shadow: none;

  &:hover {
    background: #f3f3f3;
    color: ${({ variant }) =>
      variant === 'edit' ? '#f59e0b' : variant === 'delete' ? '#ef4444' : '#2563eb'};
    transform: scale(1.1);
  }

  @media (max-width: 600px) {
    width: 22px;
    height: 22px;
    margin-right: 6px;
    margin-bottom: 6px;
    font-size: 16px;
  }
`;
