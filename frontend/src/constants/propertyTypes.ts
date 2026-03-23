// Tipos de imóveis padronizados para todo o sistema
export interface PropertyType {
  value: string
  label: string
  description?: string
}

// Categorias padrão de imóveis - usar em todas as páginas relacionadas
export const PROPERTY_TYPES: PropertyType[] = [
  { 
    value: 'APARTAMENTO', 
    label: 'Apartamento',
    description: 'Unidade residencial em edifício com múltiplos pavimentos'
  },
  { 
    value: 'CASA_RESIDENCIAL', 
    label: 'Casa Residencial',
    description: 'Residência unifamiliar com área externa própria'
  },
  { 
    value: 'CASA_COMERCIAL', 
    label: 'Casa Comercial',
    description: 'Imóvel residencial adaptado para uso comercial'
  },
  { 
    value: 'LOJA', 
    label: 'Loja',
    description: 'Espaço comercial para varejo ou prestação de serviços'
  },
  { 
    value: 'SALA_COMERCIAL', 
    label: 'Sala Comercial',
    description: 'Espaço destinado a atividades comerciais e empresariais'
  },
  { 
    value: 'GALPAO', 
    label: 'Galpão',
    description: 'Construção ampla destinada a armazenamento ou indústria'
  }
]

// Mapeamento para exibição dos tipos (usar em getTipoDisplay)
export const PROPERTY_TYPE_DISPLAY: Record<string, string> = {
  'APARTAMENTO': 'Apartamento',
  'CASA_RESIDENCIAL': 'Casa',  // Corrigido para coincidir com o banco
  'CASA_COMERCIAL': 'Casa Comercial',
  'LOJA': 'Loja',
  'SALA_COMERCIAL': 'Sala Comercial',
  'GALPAO': 'Galpão',
  // Manter compatibilidade com tipos antigos
  'CASA': 'Casa',
  'COMERCIAL': 'Comercial',
  'TERRENO': 'Terreno',
  'OUTRO': 'Outro'
}

// Função utilitária para obter o nome de exibição de um tipo
export const getTipoDisplay = (tipo: string): string => {
  if (!tipo) return 'Não informado'
  
  // Força a conversão para string e busca no mapeamento
  const tipoString = String(tipo).toUpperCase()
  
  return PROPERTY_TYPE_DISPLAY[tipoString] || tipo
}
