import { useState } from 'react'
import api from '../services/api'
import { useAuth } from './useAuth'

interface PhotoUploadData {
  vistoria_id: string
  caminho_arquivo: string
  descricao: string
  comodo_nome?: string
  comodo_id?: number
}

interface TranscriptionData {
  vistoria_id: string
  texto: string
  foto_id?: number
  comodo_nome?: string
}

interface VistoriaData {
  descricao: string
  data: string
  imovel_id: number
  status?: string
}

interface ComodoData {
  vistoria_id: string
  nome: string
  observacoes: string
  estado_geral?: string
}

export const useVistoriaUpload = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  // Converte base64 para FormData
  const base64ToFormData = (base64: string, filename: string = 'photo.jpg'): FormData => {
    const formData = new FormData()
    
    // Remove o prefixo data:image/...;base64,
    const base64Data = base64.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: 'image/jpeg' })
    
    formData.append('foto', blob, filename)
    return formData
  }

  // Cria uma vistoria no backend
  const criarVistoria = async (dados: VistoriaData) => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.post('/vistorias', {
        ...dados,
        empresa_id: user?.empresa_id,
        usuario_id: user?.id
      })

      return response.data.vistoria
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Erro ao criar vistoria'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Salva cômodo da vistoria
  const salvarComodo = async (dados: ComodoData) => {
    try {
      const response = await api.post('/comodos-vistoria', dados)
      return response.data
    } catch (err: any) {
      console.error('Erro ao salvar cômodo:', err)
      throw err
    }
  }

  // Upload de foto com informações do cômodo
  const uploadFoto = async (dados: PhotoUploadData) => {
    try {
      // Se for base64, converte para FormData
      if (dados.caminho_arquivo.startsWith('data:image')) {
        const formData = base64ToFormData(dados.caminho_arquivo)
        formData.append('vistoria_id', dados.vistoria_id)
        formData.append('descricao', dados.descricao)
        
        if (dados.comodo_nome) {
          formData.append('comodo_nome', dados.comodo_nome)
        }
        if (dados.comodo_id) {
          formData.append('comodo_id', dados.comodo_id.toString())
        }

        const response = await api.post('/fotos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        return response.data.foto
      } else {
        // Upload via JSON (para URLs)
        const response = await api.post('/fotos', dados)
        return response.data.foto
      }
    } catch (err: any) {
      console.error('Erro ao fazer upload da foto:', err)
      throw err
    }
  }

  // Salva transcrição
  const salvarTranscricao = async (dados: TranscriptionData) => {
    try {
      const response = await api.post('/transcricoes/upload', {
        ...dados,
        url_audio: 'transcricao-audio' // Placeholder para áudio
      })
      return response.data.transcricao
    } catch (err: any) {
      console.error('Erro ao salvar transcrição:', err)
      throw err
    }
  }

  // Função principal para salvar vistoria completa
  const salvarVistoriaCompleta = async (inspectionData: any, imovelId: number) => {
    try {
      setLoading(true)
      setError(null)

      // 1. Criar vistoria
      const vistoria = await criarVistoria({
        descricao: inspectionData.title,
        data: new Date().toISOString().split('T')[0],
        imovel_id: imovelId,
        status: 'em_andamento'
      })

      const vistoriaId = vistoria.id

      // 2. Salvar cômodos únicos
      const comodosUnicos = Array.from(
        new Set(inspectionData.photos.map((p: any) => p.roomName))
      ).filter(Boolean) as string[]

      const comodosMap = new Map()
      for (const nomeComodo of comodosUnicos) {
        const comodo = await salvarComodo({
          vistoria_id: vistoriaId,
          nome: nomeComodo,
          observacoes: `Cômodo vistoriado com ${inspectionData.photos.filter((p: any) => p.roomName === nomeComodo).length} fotos`,
          estado_geral: 'Bom'
        })
        comodosMap.set(nomeComodo, comodo.id)
      }

      // 3. Upload das fotos com informações do cômodo
      const fotosUpload = []
      for (const photo of inspectionData.photos) {
        try {
          const foto = await uploadFoto({
            vistoria_id: vistoriaId,
            caminho_arquivo: photo.src,
            descricao: `Foto do cômodo ${photo.roomName}`,
            comodo_nome: photo.roomName,
            comodo_id: comodosMap.get(photo.roomName)
          })

          fotosUpload.push(foto)

          // 4. Salvar transcrições da foto
          if (photo.transcriptions && photo.transcriptions.length > 0) {
            for (const transcription of photo.transcriptions) {
              await salvarTranscricao({
                vistoria_id: vistoriaId,
                texto: transcription.text,
                foto_id: foto.id,
                comodo_nome: photo.roomName
              })
            }
          }
        } catch (photoError) {
          console.error(`Erro ao fazer upload da foto ${photo.id}:`, photoError)
        }
      }

      return {
        vistoria,
        fotos: fotosUpload,
        message: `Vistoria salva com sucesso! ${fotosUpload.length} fotos enviadas.`
      }

    } catch (err: any) {
      const errorMsg = err.message || 'Erro ao salvar vistoria completa'
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    criarVistoria,
    uploadFoto,
    salvarTranscricao,
    salvarComodo,
    salvarVistoriaCompleta,
    clearError: () => setError(null)
  }
}
