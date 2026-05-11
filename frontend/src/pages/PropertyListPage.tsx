import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { Building2, FileText, Home, ListFilter, MapPin, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ConfirmationModal } from '../components/ConfirmationModal'
import { AppHeader } from '../components/AppHeader'
import { MobileTabBar } from '../components/MobileTabBar'
import { PROPERTY_TYPES, getCanonicalPropertyType, getTipoDisplay } from '../constants/propertyTypes'

const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(circle at top left, rgba(255, 69, 0, 0.16), transparent 32rem),
    ${({ theme }) => theme.colors.background};
  width: 100vw;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
  padding: 80px clamp(1rem, 4vw, 2.5rem) 96px;

  @media (max-width: 768px) {
    padding: 76px 1rem 96px;
  }
`

const ContentWrapper = styled.main`
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const PageIntro = styled.section`
  display: flex;
  justify-content: flex-end;
`

const PrimaryAction = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border: 0;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme }) => theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.textWhite};
  padding: 0.9rem 1.15rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 24px ${({ theme }) => theme.colors.shadowGlow};
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 22px 45px ${({ theme }) => theme.colors.shadowGlow};
  }

  @media (max-width: 860px) {
    width: 100%;
  }
`

const StatsGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const StatCard = styled.div`
  background: ${({ theme }) => theme.colors.gradient.card};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 0.85rem 1rem;
  box-shadow: 0 10px 24px ${({ theme }) => theme.colors.shadow};
`

const StatNumber = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  line-height: 1;
`

const StatLabel = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 700;
  margin-top: 0.35rem;
`

const ControlsPanel = styled.section`
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: 0 14px 34px ${({ theme }) => theme.colors.shadow};
  padding: 1rem;
  backdrop-filter: blur(18px);
`

const SearchContainer = styled.label`
  position: relative;
  width: 100%;
  display: block;
`

const SearchIcon = styled.div`
  position: absolute;
  left: 0.95rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.textLight};
  pointer-events: none;
`

const SearchInput = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme }) => theme.colors.text};
  padding: 0.95rem 1rem 0.95rem 2.8rem;
  font-size: ${({ theme }) => theme.fontSizes.base};
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primaryLight};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.backgroundGlass};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }

  @media (max-width: 768px) {
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`

const FiltersRow = styled.div`
  display: flex;
  gap: 0.55rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.15rem;

  @media (min-width: 900px) {
    flex-wrap: wrap;
    overflow: visible;
  }
`

const FilterChip = styled.button<{ $active?: boolean }>`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid ${({ theme, $active }) => $active ? theme.colors.borderGlow : theme.colors.borderLight};
  background: ${({ theme, $active }) => $active ? theme.colors.backgroundGlass : theme.colors.backgroundSecondary};
  color: ${({ theme, $active }) => $active ? theme.colors.primaryLight : theme.colors.textSecondary};
  padding: 0.58rem 0.85rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 800;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, color 0.2s, transform 0.2s;

  &:hover {
    transform: translateY(-1px);
    color: ${({ theme }) => theme.colors.textWhite};
    background: ${({ theme }) => theme.colors.backgroundGlass};
  }
`

const ResultsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }

  @media (max-width: 640px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.35rem;
  }
`

const PropertyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.9rem;
`

const PropertyCard = styled.div`
  background: ${({ theme }) => theme.colors.gradient.card};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  padding: 1rem;
  transition: box-shadow 0.25s, border-color 0.25s, transform 0.25s;
  position: relative;
  box-shadow: 0 10px 28px ${({ theme }) => theme.colors.shadow};
  display: grid;
  grid-template-columns: minmax(220px, 0.9fr) minmax(260px, 1.2fr) minmax(220px, auto);
  gap: 1rem;
  align-items: center;
  min-width: 0;

  &:hover {
    box-shadow: 0 14px 36px ${({ theme }) => theme.colors.shadowDark};
    border-color: ${({ theme }) => theme.colors.borderGlow};
    transform: translateY(-1px);
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
`

const PropertyHeader = styled.div`
  display: flex;
  align-items: flex-start;
`

const PropertyTitleBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;
`

const PropertyName = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  line-height: 1.2;
  margin: 0;
  overflow-wrap: anywhere;
`

const TypeBadge = styled.span`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 0.35rem;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.primaryLight};
  padding: 0.35rem 0.7rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
`

const PropertyAddress = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.45;
  overflow-wrap: anywhere;
`

const PropertyUnit = styled.div`
  padding: 0.75rem;
  background: ${({ theme }) => theme.colors.backgroundTertiary};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PropertyMeta = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 0.45rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textLight};
`

const CardActions = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 0.55rem;
  align-items: center;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const LaudoButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 42px;
  padding: 0 1rem;
  background: ${({ theme }) => theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.textWhite};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-weight: 800;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 24px ${({ theme }) => theme.colors.shadowGlow};
  }
`

const ActionButton = styled.button<{ $variant?: 'edit' | 'delete' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 42px;
  min-width: 42px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.backgroundSecondary};
  color: ${({ theme, $variant }) => $variant === 'delete' ? theme.colors.error : theme.colors.textSecondary};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  transition: background 0.2s, color 0.2s, transform 0.2s;
  cursor: pointer;
  font-weight: 800;

  &:hover {
    background: ${({ theme, $variant }) => $variant === 'delete' ? 'rgba(239, 68, 68, 0.12)' : theme.colors.backgroundGlass};
    color: ${({ theme, $variant }) => $variant === 'delete' ? theme.colors.error : theme.colors.primaryLight};
    transform: translateY(-1px);
  }

  @media (max-width: 420px) {
    width: 100%;
  }
`

const PropertyDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  min-width: 0;
`

const EmptyState = styled.div`
  text-align: center;
  padding: clamp(2rem, 8vw, 4rem) 1rem;
  background: ${({ theme }) => theme.colors.backgroundCard};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  color: ${({ theme }) => theme.colors.textSecondary};
  box-shadow: 0 22px 55px ${({ theme }) => theme.colors.shadowDark};
`

const EmptyIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 68px;
  height: 68px;
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  margin-bottom: 1rem;
  background: ${({ theme }) => theme.colors.backgroundGlass};
  color: ${({ theme }) => theme.colors.primaryLight};
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
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imovelToDelete, setImovelToDelete] = useState<{id: number, nome: string} | null>(null)
  const [activeType, setActiveType] = useState<string>('')
  const categoryOptions = PROPERTY_TYPES

  const loadImoveis = useCallback(async () => {
    try {
      setLoading(true)
      const response = await api.get('/imoveis')
      setImoveis(response.data.imoveis || [])
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadImoveis()
  }, [loadImoveis])

  const filteredImoveis = useMemo(() => {
    const base = activeType
      ? imoveis.filter(i => getCanonicalPropertyType(i.tipo) === activeType)
      : imoveis

    const normalizedSearch = searchTerm.trim().toLowerCase()
    if (!normalizedSearch) return base

    return base.filter(imovel =>
      imovel.nome.toLowerCase().includes(normalizedSearch) ||
      imovel.endereco_completo.toLowerCase().includes(normalizedSearch) ||
      imovel.cidade.toLowerCase().includes(normalizedSearch) ||
      getTipoDisplay(imovel.tipo).toLowerCase().includes(normalizedSearch)
    )
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
      await loadImoveis()
    } catch (error) {
      console.error('Erro ao excluir imóvel:', error)
      alert('Erro ao excluir imóvel')
      setIsModalOpen(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const selectedTypeLabel = activeType
    ? categoryOptions.find(tipo => tipo.value === activeType)?.label || activeType
    : 'Todos os tipos'

  return (
    <Container>
      <AppHeader
        title="Imóveis Cadastrados"
        showBackButton
        onBack={() => navigate('/dashboard')}
      />

      <ContentWrapper>
        <PageIntro>
          <PrimaryAction onClick={() => navigate('/property-registration')}>
            <Plus size={18} />
            Novo imóvel
          </PrimaryAction>
        </PageIntro>

        <StatsGrid>
          <StatCard>
            <StatNumber>{imoveis.length}</StatNumber>
            <StatLabel>Total de imóveis</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{filteredImoveis.length}</StatNumber>
            <StatLabel>Resultados exibidos</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{new Set(imoveis.map(i => getCanonicalPropertyType(i.tipo))).size}</StatNumber>
            <StatLabel>Tipos diferentes</StatLabel>
          </StatCard>
        </StatsGrid>

        <ControlsPanel>
          <SearchContainer>
            <SearchIcon>
              <Search size={20} />
            </SearchIcon>
            <SearchInput
              type="search"
              placeholder="Pesquisar por imóvel, endereço, cidade ou tipo..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              aria-label="Pesquisar imóveis"
            />
          </SearchContainer>

          {imoveis.length > 0 && (
            <FiltersRow aria-label="Filtrar imóveis por tipo">
              <FilterChip $active={!activeType} onClick={() => setActiveType('')}>
                <ListFilter size={15} />
                Todos
              </FilterChip>
              {categoryOptions.map(tipo => (
                <FilterChip key={tipo.value} $active={activeType === tipo.value} onClick={() => setActiveType(tipo.value)}>
                  {tipo.label}
                </FilterChip>
              ))}
            </FiltersRow>
          )}
        </ControlsPanel>

        <ResultsHeader>
          <span><strong>{filteredImoveis.length}</strong> resultado{filteredImoveis.length === 1 ? '' : 's'} em {selectedTypeLabel}</span>
          {searchTerm && <span>Busca: "{searchTerm}"</span>}
        </ResultsHeader>

        {loading ? (
          <LoadingContainer>
            <LoadingSpinner />
          </LoadingContainer>
        ) : filteredImoveis.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <Home size={34} />
            </EmptyIcon>
            <EmptyTitle>
              {searchTerm || activeType ? 'Nenhum resultado encontrado' : 'Nenhum imóvel cadastrado'}
            </EmptyTitle>
            <EmptyDescription>
              {searchTerm || activeType
                ? 'Tente ajustar sua busca ou limpar os filtros para ver mais imóveis.'
                : 'Cadastre seu primeiro imóvel para iniciar as vistorias.'
              }
            </EmptyDescription>
          </EmptyState>
        ) : (
          <PropertyGrid>
            {filteredImoveis.map((imovel) => (
              <PropertyCard key={imovel.id}>
                <PropertyHeader>
                  <PropertyTitleBlock>
                    <PropertyName>{imovel.nome}</PropertyName>
                    <TypeBadge>
                      <Building2 size={14} />
                      {getTipoDisplay(imovel.tipo)}
                    </TypeBadge>
                  </PropertyTitleBlock>
                </PropertyHeader>

                <PropertyDetails>
                  <PropertyAddress>
                    <MapPin size={17} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      {imovel.endereco_completo}
                      <br />
                      {imovel.cidade} - {imovel.uf}
                    </div>
                  </PropertyAddress>

                  {imovel.unidade && (
                    <PropertyUnit>
                      <strong>Unidade:</strong> {imovel.unidade}
                    </PropertyUnit>
                  )}

                  <PropertyMeta>
                    <Home size={15} />
                    <span>Cadastrado em {formatDate(imovel.created_at)}</span>
                  </PropertyMeta>
                </PropertyDetails>

                <CardActions>
                  <LaudoButton onClick={() => navigate(`/property-laudo/${imovel.id}`)}>
                    <FileText size={17} />
                    Laudo de vistoria
                  </LaudoButton>
                  <ActionButton
                    $variant="edit"
                    title="Editar imóvel"
                    aria-label={`Editar ${imovel.nome}`}
                    onClick={() => navigate(`/property-edit/${imovel.id}`)}
                  >
                    <Pencil size={17} />
                  </ActionButton>
                  <ActionButton
                    $variant="delete"
                    title="Excluir imóvel"
                    aria-label={`Excluir ${imovel.nome}`}
                    onClick={() => handleDelete(imovel.id, imovel.nome)}
                  >
                    <Trash2 size={17} />
                  </ActionButton>
                </CardActions>
              </PropertyCard>
            ))}
          </PropertyGrid>
        )}
      </ContentWrapper>
    
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

      <MobileTabBar />
    </Container>
  )
}
