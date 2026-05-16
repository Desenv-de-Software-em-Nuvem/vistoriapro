import React, { useState } from 'react'
import styled from 'styled-components'
import { ArrowRight, Building, Home, Building2, Store, Briefcase, Warehouse } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { PROPERTY_TYPES } from '../constants/propertyTypes'
import { AppHeader } from '../components/AppHeader'

interface PropertyCategory {
  id: string
  name: string
  description: string
  icon: React.ReactNode
}

const getIconForType = (value: string) => {
  switch(value) {
    case 'APARTAMENTO': return <Building size={32} />
    case 'CASA_RESIDENCIAL': return <Home size={32} />
    case 'CASA_COMERCIAL': return <Building2 size={32} />
    case 'LOJA': return <Store size={32} />
    case 'SALA_COMERCIAL': return <Briefcase size={32} />
    case 'GALPAO': return <Warehouse size={32} />
    default: return <Building size={32} />
  }
}

const propertyCategories: PropertyCategory[] = PROPERTY_TYPES.map(type => ({
  id: type.value,
  name: type.label,
  description: type.description || '',
  icon: getIconForType(type.value)
}))

const Container = styled.div`
  min-height: 100vh;
  min-height: 100dvh;
  background:
    radial-gradient(circle at top left, rgba(255, 69, 0, 0.18), transparent 34rem),
    radial-gradient(circle at bottom right, rgba(255, 140, 66, 0.11), transparent 28rem),
    ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  padding: 82px clamp(1rem, 4vw, 2.5rem) calc(96px + env(safe-area-inset-bottom, 0px));

  @media (max-width: 768px) {
    height: var(--vistoriapro-app-height, 100dvh);
    min-height: 0;
    overflow: hidden;
    overscroll-behavior: none;
    padding: calc(56px + env(safe-area-inset-top, 0px) + 0.75rem) 0.9rem calc(64px + env(safe-area-inset-bottom, 0px) + 5.25rem);
  }
`

const Main = styled.main`
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (max-width: 768px) {
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }
`

const CategoryScroll = styled.section`
  min-height: 0;

  @media (max-width: 768px) {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    touch-action: pan-y;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.25rem;
  }
`

const CategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 1rem;

  @media (max-width: 980px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`

const CategoryCard = styled.button<{ $selected: boolean }>`
  width: 100%;
  min-height: 132px;
  background: ${({ theme, $selected }) => 
    $selected ? 'rgba(255, 69, 0, 0.13)' : theme.colors.backgroundCard};
  backdrop-filter: blur(20px);
  border: 1px solid ${({ theme, $selected }) => 
    $selected ? theme.colors.borderGlow : theme.colors.borderLight};
  padding: 1.05rem;
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: ${({ theme, $selected }) => 
    $selected 
      ? `0 18px 36px ${theme.colors.shadowDark}, 0 0 28px ${theme.colors.shadowGlow}`
      : `0 10px 24px ${theme.colors.shadow}`};
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
  text-align: left;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  color: inherit;

  &:before {
    content: '';
    position: absolute;
    top: 0.9rem;
    left: 0;
    width: 4px;
    bottom: 0.9rem;
    border-radius: 0 999px 999px 0;
    background: ${({ theme }) => theme.colors.gradient.primary};
    opacity: ${({ $selected }) => $selected ? 1 : 0};
    transition: opacity 0.2s ease;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: ${({ theme }) => theme.colors.borderGlow};
    box-shadow: 
      0 18px 36px ${({ theme }) => theme.colors.shadowDark},
      0 0 26px ${({ theme }) => theme.colors.shadowGlow};

    &:before {
      opacity: 1;
    }
  }

  @media (max-width: 680px) {
    min-height: auto;
    padding: 0.9rem;
    gap: 0.75rem;
  }

  @media (hover: none) {
    &:hover {
      transform: none;
    }

    &:active {
      transform: scale(0.98);
    }
  }
`

const CategoryIcon = styled.div<{ $selected: boolean }>`
  width: 54px;
  height: 54px;
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: ${({ theme, $selected }) => 
    $selected 
      ? theme.colors.gradient.primary 
      : theme.colors.backgroundGlass};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme, $selected }) => 
    $selected ? theme.colors.textWhite : theme.colors.primary};
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);

  @media (max-width: 480px) {
    width: 48px;
    height: 48px;

    svg {
      width: 26px;
      height: 26px;
    }
  }
`

const CategoryText = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`

const CategoryName = styled.h3<{ $selected: boolean }>`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 800;
  color: ${({ theme, $selected }) => 
    $selected ? theme.colors.primaryLight : theme.colors.text};
  margin: 0;
  transition: color 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 480px) {
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`

const CategoryDescription = styled.p`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin: 0;
  line-height: 1.45;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`

const ActionPanel = styled.section`
  position: sticky;
  bottom: 1rem;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: rgba(21, 21, 32, 0.92);
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius['2xl']};
  box-shadow: 0 18px 42px ${({ theme }) => theme.colors.shadowDark};
  padding: 0.9rem;
  backdrop-filter: blur(18px);

  @media (max-width: 768px) {
    position: fixed;
    left: 0.9rem;
    right: 0.9rem;
    bottom: calc(var(--vistoriapro-vv-bottom, 0px) + 64px + env(safe-area-inset-bottom, 0px) + 0.75rem);
    z-index: 1095;
    align-items: stretch;
    flex-direction: column;
    gap: 0.65rem;
  }
`

const SelectedSummary = styled.div`
  min-width: 0;

  @media (max-width: 768px) {
    display: none;
  }
`

const SelectedLabel = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`

const SelectedValue = styled.strong`
  display: block;
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.base};
  margin-top: 0.2rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ContinueButton = styled.button<{ $disabled: boolean }>`
  background: ${({ theme, $disabled }) => 
    $disabled ? 'rgba(136, 136, 163, 0.32)' : theme.colors.gradient.primary};
  color: ${({ theme }) => theme.colors.textWhite};
  border: 0;
  padding: 0.95rem 1.25rem;
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  min-width: 190px;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 
      0 10px 25px ${({ theme }) => theme.colors.shadowDark},
      0 0 30px ${({ theme }) => theme.colors.shadowGlow};
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @media (max-width: 480px) {
    width: 100%;
    padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
    font-size: ${({ theme }) => theme.fontSizes.base};
  }
`

export const PropertyCategoryPage: React.FC = () => {
  const navigate = useNavigate()
  const { inspectionId } = useParams<{ inspectionId: string }>()
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const selectedCategoryDetails = propertyCategories.find(category => category.id === selectedCategory)

  const handleContinue = () => {
    if (selectedCategory && inspectionId) {
      // Salvar a categoria selecionada no localStorage ou context
      localStorage.setItem(`inspection_${inspectionId}_category`, selectedCategory)
      navigate(`/inspection/${inspectionId}`, { state: { tipoSelecionado: selectedCategory } })
    }
  }

  return (
    <Container>
      <AppHeader
        title="Selecionar Categoria do Imóvel"
        showBackButton
        onBack={() => navigate(-1)}
      />

      <Main>
        <CategoryScroll>
          <CategoryGrid>
            {propertyCategories.map((category) => (
              <CategoryCard
                key={category.id}
                $selected={selectedCategory === category.id}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CategoryIcon $selected={selectedCategory === category.id}>
                  {category.icon}
                </CategoryIcon>
                <CategoryText>
                  <CategoryName $selected={selectedCategory === category.id}>
                    {category.name}
                  </CategoryName>
                  <CategoryDescription>
                    {category.description}
                  </CategoryDescription>
                </CategoryText>
              </CategoryCard>
            ))}
          </CategoryGrid>
        </CategoryScroll>

        <ActionPanel>
          <SelectedSummary>
            <SelectedLabel>Categoria selecionada</SelectedLabel>
            <SelectedValue>{selectedCategoryDetails?.name || 'Escolha uma categoria para continuar'}</SelectedValue>
          </SelectedSummary>

          <ContinueButton
            $disabled={!selectedCategory}
            disabled={!selectedCategory}
            onClick={handleContinue}
          >
            Continuar
            <ArrowRight size={20} />
          </ContinueButton>
        </ActionPanel>
      </Main>
    </Container>
  )
}
