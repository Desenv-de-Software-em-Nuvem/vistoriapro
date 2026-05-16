// Utilitário para extrair dados serializáveis do inspection
function serializeInspection(inspection: InspectionData | null) {
  if (!inspection) return null;
  return {
    id: inspection.id,
    title: inspection.title,
    category: inspection.category,
    photos: Array.isArray(inspection.photos) ? [...inspection.photos] : [],
    rooms: inspection.rooms.map((room: RoomAccordionType) => ({
      id: room.id,
      name: room.name,
      photos: Array.isArray(room.photos) ? [...room.photos] : [],
      description: room.description || '',
      completed: room.completed || false,
    })),
    createdAt: inspection.createdAt,
  };
}

function isStoredPhotoUrl(photo: string) {
  return photo.startsWith('http') || photo.startsWith('/uploads/');
}

function getApiAssetBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
}

function resolvePhotoUrl(photo: string) {
  if (photo.startsWith('/')) {
    return `${getApiAssetBaseUrl()}${photo}`;
  }
  return photo;
}

import React, { useState, useEffect, useRef } from 'react';
import { useVistoriaProgress } from '../hooks/useVistoriaProgress';
import { PropertySelector } from '../components/inspection/PropertySelector';
import { RoomChecklist } from '../components/inspection/RoomChecklist';
import { InspectionProgress } from '../components/inspection/InspectionProgress';
import { listarImoveis } from '../services/imovelService';
import { criarVistoria, buscarVistoriaPorId, atualizarVistoria } from '../services/vistoriaService';
import { criarOuAtualizarComodoVistoria } from '../services/comodoVistoriaService';
import { listarFotosPorVistoria, uploadFoto } from '../services/fotoService';
import type { Foto } from '../services/fotoService';
import { deletarFoto } from '../services/deletarFotoService';
import { descreverFotoComIa } from '../services/iaService';
import type { Imovel } from '../services/imovelService';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCanonicalPropertyType } from '../constants/propertyTypes';
import { roomChecklists } from '../data/roomChecklists';
import { AppHeader } from '../components/AppHeader';
import { MobileTabBar } from '../components/MobileTabBar';
import { Snackbar } from '../components/Snackbar';


const Container = styled.div`
  min-height: 100dvh;
  height: var(--vistoriapro-app-height, 100dvh);
  min-height: 0;
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  width: 100%;
  max-width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  box-sizing: border-box;
  padding-top: 88px;
  padding-bottom: 96px;
  will-change: transform;
  @media (max-width: 600px) {
    padding-top: 80px;
    padding-bottom: 96px;
  }
`

const Main = styled.main`
  flex: 1;
  padding: 0;
  max-width: 800px;
  margin: 0 auto;
  width: calc(100% - 2rem);
  min-width: 0;
  box-sizing: border-box;
  will-change: transform;
  @media (max-width: 768px) {
    width: calc(100% - 2rem);
  }
  @media (max-width: 480px) {
    width: calc(100% - 2rem);
  }
`

// Tipos auxiliares (pode ser movido para um arquivo types.ts futuramente)
export interface Transcription {
  id: string;
  text: string;
}

export interface PhotoData {
  id: string;
  src: string;
  transcriptions: Transcription[];
  roomId: string;
  roomName: string;
  timestamp: Date;
}

export interface RoomAccordionType {
  id: string;
  name: string;
  icon: React.ReactNode;
  completed: boolean;
  photos: string[];
  description: string;
}

export interface InspectionData {
  id: string;
  title: string;
  category: string;
  photos: PhotoData[];
  rooms: RoomAccordionType[];
  createdAt: Date;
}

type RoomChecklistDefinition = Pick<RoomAccordionType, 'id' | 'name' | 'icon'>;


export const InspectionPage: React.FC = () => {
  // Snackbar state
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info'; duration?: number }>({ open: false, message: '', type: 'info' });
  const [saving, setSaving] = useState(false);
  // Recupera o tipo de imóvel selecionado na página anterior via state do React Router
  const location = useLocation();
  // O tipo selecionado vem como enum (ex: 'CASA_RESIDENCIAL'), precisa converter para o label do banco (ex: 'Casa Residencial')
  const tipoSelecionadoEnum = location.state?.tipoSelecionado || '';
  const tipoSelecionadoKey = tipoSelecionadoEnum ? getCanonicalPropertyType(tipoSelecionadoEnum) : '';
  
  // Imóveis
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [selectedImovel, setSelectedImovel] = useState<Imovel | null>(null);
  const [loadingImoveis, setLoadingImoveis] = useState(true);
  const [aiLoadingRooms, setAiLoadingRooms] = useState<Record<string, boolean>>({});
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const aiCompletedSignaturesRef = useRef<Record<string, string>>({});
  const aiPendingSignaturesRef = useRef<Set<string>>(new Set());
  // Removido: tipo de imóvel selecionado (não é mais usado)
  // Carregar imóveis ao abrir a página
  useEffect(() => {
    const fetchImoveis = async () => {
      setLoadingImoveis(true);
      try {
        const data = await listarImoveis();
        setImoveis(data);
      } catch {
        setSnackbar({ open: true, message: 'Erro ao carregar imóveis.', type: 'error' });
        setImoveis([]);
      } finally {
        setLoadingImoveis(false);
      }
    };
    fetchImoveis();
  }, []);
  const navigate = useNavigate()


  // Só inicializa inspection e category depois do imóvel ser selecionado
  const [inspection, setInspection] = useState<InspectionData | null>(null);

  // Integração com persistência local
  const userJson = window.localStorage.getItem('vistoriapro_user');
  const user = userJson ? JSON.parse(userJson) : null;
  const idUsuario = user?.id || 'anon';
  
  const { progress, saveProgress, removeProgress } = useVistoriaProgress({
    idImovel: selectedImovel ? String(selectedImovel.id) : '',
    idUsuario,
  });




  // Quando selectedImovel ou idUsuario mudar, inicializa a inspection com os cômodos do tipo
  useEffect(() => {
    if (selectedImovel) {
      // Se houver progresso salvo, carrega
      if (progress && progress.data) {
        setInspection(progress.data);
        return;
      }
      // Tenta pegar os cômodos pelo tipo do imóvel
      const tipo = getCanonicalPropertyType(selectedImovel.tipo || 'CASA');
      const defaultRooms = (roomChecklists[tipo] || roomChecklists['CASA']).map((room: RoomChecklistDefinition) => ({
        ...room,
        photos: [],
        description: '',
        completed: false,
      }));
      setInspection({
        id: '',
        title: `Vistoria - ${selectedImovel.nome}`,
        category: tipo,
        photos: [],
        rooms: defaultRooms,
        createdAt: new Date(),
      });
    } else {
      setInspection(null);
    }
  }, [selectedImovel, progress, idUsuario]);


  // Novo: recebe roomId e dataUrl, adiciona a foto ao cômodo

  const handleCapturePhoto = (roomId: string, dataUrl: string) => {
    setInspection((prev: InspectionData | null) => prev ? {
      ...prev,
      rooms: prev.rooms.map((room: RoomAccordionType) =>
        room.id === roomId
          ? { ...room, photos: [...(room.photos || []), dataUrl], completed: false }
          : room
      )
    } : prev);
  };

  // Novo: handler para deletar foto de um cômodo
  // Remove foto localmente e do backend se já existir
  const handleDeletePhoto = async (roomId: string, photoIdx: number) => {
    const room = inspection?.rooms.find((r: RoomAccordionType) => r.id === roomId);
    if (!room) return;
    const photo = room.photos[photoIdx];
    // Se for uma URL (começa com http), tenta extrair o id da foto e deletar do backend
    if (photo && isStoredPhotoUrl(photo)) {
      // Busca id da foto no backend (ideal: salvar id junto, mas aqui tentamos buscar por URL)
      try {
        // Busca todas as fotos da vistoria
        if (!inspection?.id) throw new Error('Vistoria não encontrada para deletar foto.');
        const fotos = await listarFotosPorVistoria(inspection.id);
        const found = fotos.find((f: Foto) => f.url === photo);
        if (found) await deletarFoto(found.id);
      } catch (e) {
        setSnackbar({ open: true, message: 'Erro ao deletar foto do backend: ' + (e as Error).message, type: 'error' });
      }
    }
    // Remove localmente
    setInspection((prev: InspectionData | null) => prev ? {
      ...prev,
      rooms: prev.rooms.map((room: RoomAccordionType) =>
        room.id === roomId
          ? { ...room, photos: room.photos.filter((_photo: string, i: number) => i !== photoIdx), completed: false }
          : room
      )
    } : prev);
  };

  const handleSelectFromGallery = (roomId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      if (!files.length) return;
      try {
        const results = await Promise.all(files.map(fileToDataUrl));
        setInspection((prev: InspectionData | null) => prev ? {
          ...prev,
          rooms: prev.rooms.map((room: RoomAccordionType) =>
            room.id === roomId
              ? { ...room, photos: [...(room.photos || []), ...results], completed: false }
              : room
          )
        } : prev);
        setSnackbar({
          open: true,
          message: results.length > 1 ? `${results.length} fotos adicionadas ao cômodo.` : 'Foto adicionada ao cômodo.',
          type: 'success'
        });
      } catch (error) {
        setSnackbar({
          open: true,
          message: error instanceof Error ? error.message : 'Erro ao carregar imagens da galeria.',
          type: 'error'
        });
      }
    };
    input.click();
  };

  const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Não foi possível ler a imagem selecionada.'));
    };
    reader.onerror = () => reject(new Error('Erro ao carregar imagem da galeria.'));
    reader.readAsDataURL(file);
  });

  const handleChangeDescription = (roomId: string, desc: string) => {
    setInspection((prev: InspectionData | null) => prev ? {
      ...prev,
      rooms: prev.rooms.map((room: RoomAccordionType) =>
        room.id === roomId
          ? { ...room, description: desc, completed: false }
          : room
      )
    } : prev);
  };

  const resizeImageForAi = (dataUrl: string, maxSize = 640, quality = 0.68) => new Promise<string>((resolve) => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        resolve(dataUrl);
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });

  const loadImageForCanvas = (dataUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível preparar o mosaico de fotos para IA.'));
    image.src = dataUrl;
  });

  const createPhotoContactSheetForAi = async (dataUrls: string[]) => {
    if (dataUrls.length === 1) return dataUrls[0];

    const images = await Promise.all(dataUrls.map(loadImageForCanvas));
    const columns = Math.min(3, Math.ceil(Math.sqrt(images.length)));
    const rows = Math.ceil(images.length / columns);
    const cellWidth = 360;
    const cellHeight = 270;
    const gap = 12;
    const labelHeight = 28;
    const canvas = document.createElement('canvas');
    canvas.width = columns * cellWidth + (columns + 1) * gap;
    canvas.height = rows * (cellHeight + labelHeight) + (rows + 1) * gap;

    const context = canvas.getContext('2d');
    if (!context) return dataUrls[0];

    context.fillStyle = '#111827';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '700 16px Arial';
    context.textBaseline = 'middle';

    images.forEach((image, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x = gap + column * (cellWidth + gap);
      const y = gap + row * (cellHeight + labelHeight + gap);
      const scale = Math.min(cellWidth / image.width, cellHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const drawX = x + (cellWidth - drawWidth) / 2;
      const drawY = y + labelHeight + (cellHeight - drawHeight) / 2;

      context.fillStyle = '#ffffff';
      context.fillText(`Foto ${index + 1}`, x + 8, y + labelHeight / 2);
      context.fillStyle = '#0f172a';
      context.fillRect(x, y + labelHeight, cellWidth, cellHeight);
      context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    });

    return canvas.toDataURL('image/jpeg', 0.72);
  };

  const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
        return;
      }
      reject(new Error('Não foi possível preparar a imagem para IA.'));
    };
    reader.onerror = () => reject(new Error('Erro ao preparar imagem para IA.'));
    reader.readAsDataURL(blob);
  });

  const preparePhotoForAi = async (photo: string) => {
    if (photo.startsWith('data:image/')) {
      return resizeImageForAi(photo);
    }

    const response = await fetch(resolvePhotoUrl(photo));
    if (!response.ok) {
      throw new Error('Não foi possível carregar uma das fotos para análise da IA.');
    }

    const dataUrl = await blobToDataUrl(await response.blob());
    return resizeImageForAi(dataUrl);
  };

  const buildPhotoFingerprint = (photo: string) => {
    if (isStoredPhotoUrl(photo)) return photo;
    return `${photo.length}:${photo.slice(0, 96)}:${photo.slice(-96)}`;
  };

  const buildAiRequestSignature = (roomId: string, photos: string[], instrucoes?: string) => JSON.stringify({
    roomId,
    instrucoes: (instrucoes || '').trim(),
    photos: photos.map(buildPhotoFingerprint).sort()
  });

  const aplicarDescricaoIa = (roomId: string, descricao: string) => {
    const texto = descricao.trim();
    if (!texto) return;

    setInspection((prev: InspectionData | null) => prev ? {
      ...prev,
      rooms: prev.rooms.map((room: RoomAccordionType) => {
        if (room.id !== roomId) return room;
        const atual = room.description?.trim();
        return {
          ...room,
          description: atual ? `${atual}\n${texto}` : texto,
          completed: false,
        };
      })
    } : prev);
  };

  const gerarDescricaoFotoComIa = async (roomId: string, instrucoes?: string) => {
    if (aiUnavailable) return;

    const room = inspection?.rooms.find((item: RoomAccordionType) => item.id === roomId);
    const photos = room?.photos || [];
    if (!photos.length) {
      setSnackbar({
        open: true,
        message: 'Adicione ao menos uma foto antes de gerar a descrição com IA.',
        type: 'info'
      });
      return;
    }

    const roomName = room?.name || 'Cômodo';
    const signature = buildAiRequestSignature(roomId, photos, instrucoes);
    if (aiPendingSignaturesRef.current.has(signature)) {
      setSnackbar({
        open: true,
        message: 'A IA já está analisando esse mesmo conjunto de fotos.',
        type: 'info'
      });
      return;
    }

    if (aiCompletedSignaturesRef.current[roomId] === signature) {
      setSnackbar({
        open: true,
        message: 'Essa descrição já foi gerada para as mesmas fotos e instruções.',
        type: 'info'
      });
      return;
    }

    aiPendingSignaturesRef.current.add(signature);
    setAiLoadingRooms((prev) => ({ ...prev, [roomId]: true }));

    try {
      const fotosPreparadas = await Promise.all(
        photos.map(preparePhotoForAi)
      );
      const mosaico = await createPhotoContactSheetForAi(fotosPreparadas);
      const instrucoesComContexto = [
        photos.length > 1
          ? `A imagem enviada é um mosaico com ${photos.length} fotos do mesmo cômodo, identificadas como Foto 1, Foto 2 etc. Analise o conjunto completo.`
          : '',
        instrucoes || ''
      ].filter(Boolean).join('\n');
      const descricao = await descreverFotoComIa({
        imagem: mosaico,
        comodo_nome: roomName,
        instrucoes: instrucoesComContexto,
      });
      aplicarDescricaoIa(roomId, descricao);
      aiCompletedSignaturesRef.current[roomId] = signature;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setSnackbar({
          open: true,
          message: 'Limite temporário da IA atingido. Aguarde alguns instantes antes de tentar novamente. As fotos continuam salvas para descrição manual.',
          type: 'error',
          duration: 12000
        });
        return;
      }

      if (status === 503) {
        setAiUnavailable(true);
        setSnackbar({
          open: true,
          message: 'IA de descrição ainda não configurada. A vistoria continua em modo manual.',
          type: 'info',
          duration: 9000
        });
        return;
      }
      setSnackbar({
        open: true,
        message: err?.response?.data?.error || err?.message || 'Não foi possível gerar a descrição automática dessas fotos.',
        type: 'info',
        duration: 9000
      });
    } finally {
      aiPendingSignaturesRef.current.delete(signature);
      setAiLoadingRooms((prev) => ({ ...prev, [roomId]: false }));
    }
  };

  // Handler para marcar/desmarcar cômodo como concluído

  // Integração backend: ao concluir cômodo, salva fotos e descrição no backend
  // Integração backend: ao concluir cômodo, salva descrição do cômodo na vistoria e faz upload das fotos
  // Agora só marca/desmarca localmente
  const handleToggleComplete = (roomId: string, completed: boolean) => {
    setInspection((prev: InspectionData | null) => {
      if (!prev) return prev;
      const updated = {
        ...prev,
        rooms: prev.rooms.map((room: RoomAccordionType) =>
          room.id === roomId ? { ...room, completed } : room
        ),
      };
      // Salva apenas dados serializáveis
      saveProgress(serializeInspection(updated));
      return updated;
    });
  };

  /**
   * Handler para finalizar a vistoria
   * Este processo:
   * 1. Cria uma nova vistoria ou usa a existente (status inicial: em_andamento)
   * 2. Salva/atualiza todos os cômodos no backend
   * 3. Faz upload de todas as fotos para o backend
   * 4. Atualiza o status da vistoria para "finalizada" quando todo o processo é concluído
   * 5. Remove o progresso local ao finalizar com sucesso
   */
  const handleFinalizarVistoria = async () => {
    if (!inspection || !selectedImovel) {
      setSnackbar({ open: true, message: 'Selecione um imóvel antes de finalizar a vistoria.', type: 'error' });
      return;
    }

    // Validação geral (comentada para testes)
    /*
    for (const room of inspection.rooms) {
      if (!room.completed) {
        setSnackbar({ open: true, message: `Finalize todos os cômodos antes de salvar a vistoria.`, type: 'error' });
        return;
      }
      if (!room.description || room.description.trim().length < 3) {
        setSnackbar({ open: true, message: `Adicione uma descrição para o cômodo \"${room.name}\".`, type: 'error' });
        return;
      }
      if (!room.photos || room.photos.length === 0) {
        setSnackbar({ open: true, message: `Adicione pelo menos uma foto ao cômodo \"${room.name}\".`, type: 'error' });
        return;
      }
    }
    */

    setSaving(true);

    try {
      // 1. Garante que existe uma vistoria (cria se necessário)
      let vistoriaId = inspection.id;
      if (!vistoriaId) {
        const created = await criarVistoria({
          imovel_id: selectedImovel.id,
          descricao: `Vistoria do imóvel ${selectedImovel.nome}`,
          data: new Date().toISOString().slice(0, 10),
          status: 'em_andamento',
        });
        vistoriaId = String(created.id ?? '');
        if (!vistoriaId) {
          throw new Error('API não retornou o ID da vistoria criada.');
        }
        setInspection((prev: InspectionData | null) => prev ? { ...prev, id: String(vistoriaId) } : prev);
      }

      // 2. Salva/atualiza cada cômodo no backend
      for (const room of inspection.rooms) {
        await criarOuAtualizarComodoVistoria({
          vistoria_id: vistoriaId!,
          nome: room.name,
          descricao: room.description,
        });
      }

      // 3. Faz upload das fotos de todos os cômodos (paralelo, máx 3 simultâneos)
      const todasFotos: { photo: string; roomId: string; roomName: string }[] = [];
      for (const room of inspection.rooms) {
        for (const photo of room.photos) {
          if (!isStoredPhotoUrl(photo)) {
            todasFotos.push({ photo, roomId: room.id, roomName: room.name });
          }
        }
      }

      const CONCORRENCIA = 3;
      let idx = 0;
      async function uploadWorker() {
        while (idx < todasFotos.length) {
          const { photo, roomId, roomName } = todasFotos[idx++];
          const resized = await resizeImageForUpload(photo);
          const file = base64ToFile(resized, `comodo_${roomId}_${Date.now()}.jpg`);
          const comodoIdNum = Number(roomId);
          const params: { vistoria_id: string; file: File; descricao: string; comodo_nome: string; comodo_id?: number } = {
            vistoria_id: vistoriaId!,
            file,
            descricao: '',
            comodo_nome: roomName,
          };
          if (!isNaN(comodoIdNum)) params.comodo_id = comodoIdNum;
          await uploadFoto(params);
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCORRENCIA, todasFotos.length) }, uploadWorker));

      // 4. Atualiza o status da vistoria para "finalizada"
      const vistoriaAtual = await buscarVistoriaPorId(vistoriaId);
      if (vistoriaAtual?.status !== 'finalizada') {
        await atualizarVistoria(vistoriaId, { status: 'finalizada' });
      }
      
      setSnackbar({ open: true, message: 'Vistoria finalizada e salva com sucesso!', type: 'success' });
      // Remove progresso local ao finalizar
      await removeProgress();
    } catch (e) {
      console.error('Erro ao finalizar vistoria:', e);
      setSnackbar({ open: true, message: 'Erro ao finalizar vistoria: ' + (e as Error).message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Utilitário para converter base64 em File
  function base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  function resizeImageForUpload(dataUrl: string, maxSize = 2000) {
    return new Promise<string>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const maxDim = Math.max(image.width, image.height);
        if (maxDim <= maxSize) {
          resolve(dataUrl);
          return;
        }
        const scale = maxSize / maxDim;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');
        if (!context) {
          resolve(dataUrl);
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        // Qualidade alta: só redimensiona, compressão real fica pro Sharp no backend
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      image.onerror = () => resolve(dataUrl);
      image.src = dataUrl;
    });
  }

  return (
    <Container>
      <AppHeader
        title={selectedImovel && inspection ? inspection.title : 'Nova Vistoria'}
        showBackButton
        onBack={() => navigate(-1)}
      />

      <Main>
        {/* Progresso da vistoria */}
        {inspection && selectedImovel && (
          <InspectionProgress
            completed={inspection.rooms.filter((room: RoomAccordionType) => room.completed).length}
            total={inspection.rooms.length}
          />
        )}

        {/* Seleção de imóvel modularizada */}
        {!selectedImovel ? (
          <PropertySelector
            imoveis={imoveis}
              tipoSelecionado={tipoSelecionadoKey}
            loadingImoveis={loadingImoveis}
            onSelect={setSelectedImovel}
          />
        ) : (
          <RoomChecklist
            rooms={inspection?.rooms || []}
            aiLoadingRooms={aiLoadingRooms}
            onCapturePhoto={handleCapturePhoto}
            onSelectFromGallery={handleSelectFromGallery}
            onGenerateAiDescription={gerarDescricaoFotoComIa}
            onChangeDescription={handleChangeDescription}
            onToggleComplete={handleToggleComplete}
            onDeletePhoto={handleDeletePhoto}
          />
        )}
        {/* ...outros fluxos, se necessário... */}
        {/* Botão de finalizar vistoria */}
        {selectedImovel && inspection && (
          saving ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0 0 0' }}>
              <div className="loader" style={{ marginBottom: 12 }} />
              <span style={{ color: '#2ecc40', fontWeight: 600, fontSize: '1.1rem' }}>Salvando vistoria...</span>
            </div>
          ) : (
            <button
              style={{
                width: '100%',
                padding: '18px',
                fontSize: '1.2rem',
                fontWeight: 700,
                background: '#2ecc40',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                margin: '32px 0 0 0',
                boxShadow: '0 2px 8px #0002',
                cursor: 'pointer',
              }}
              onClick={handleFinalizarVistoria}
              disabled={saving}
            >
              Finalizar Vistoria e Salvar
            </button>
          )
        )}
      {/* Loader CSS */}
      <style>{`
        .loader {
          border: 6px solid #e0e0e0;
          border-top: 6px solid #2ecc40;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      </Main>
      <Snackbar
        open={snackbar.open}
        message={snackbar.message}
        type={snackbar.type}
        duration={snackbar.duration}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      />
      <MobileTabBar />
    </Container>
  )
}