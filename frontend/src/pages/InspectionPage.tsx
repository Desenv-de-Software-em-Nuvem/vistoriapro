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
  const [successData, setSuccessData] = useState<{ vistoriaId: string; imovelId: string; imovelNome: string; totalComodos: number; totalFotos: number } | null>(null);
  const [photoUploadStatus, setPhotoUploadStatus] = useState<Record<string, 'uploading' | 'done' | 'error'>>({});
  const vistoriaIdRef = useRef<string>('');
  const vistoriaCreatingRef = useRef<Promise<string> | null>(null);
  const pendingUploadsRef = useRef<Set<Promise<void>>>(new Set());
  const inspectionRef = useRef<InspectionData | null>(null);

  const photoKey = (src: string) => src.startsWith('data:') ? src.slice(0, 300) : src;
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
  // Ref sempre atualizado: evita closure stale em funções async (ex: handleFinalizarVistoria)
  useEffect(() => { inspectionRef.current = inspection; }, [inspection]);

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


  const ensureVistoriaExists = (): Promise<string> => {
    if (vistoriaIdRef.current) return Promise.resolve(vistoriaIdRef.current);
    if (!vistoriaCreatingRef.current) {
      vistoriaCreatingRef.current = criarVistoria({
        imovel_id: selectedImovel!.id,
        descricao: `Vistoria do imóvel ${selectedImovel!.nome}`,
        data: new Date().toISOString().slice(0, 10),
        status: 'em_andamento',
      }).then(created => {
        const id = String(created.id ?? '');
        if (!id) throw new Error('API não retornou ID da vistoria');
        vistoriaIdRef.current = id;
        setInspection(prev => prev ? { ...prev, id } : prev);
        return id;
      });
    }
    return vistoriaCreatingRef.current;
  };

  const uploadPhotoBackground = (dataUrl: string, roomId: string, roomName: string) => {
    const key = photoKey(dataUrl);
    setPhotoUploadStatus(prev => ({ ...prev, [key]: 'uploading' }));
    const promise: Promise<void> = (async () => {
      try {
        const vId = await ensureVistoriaExists();
        const resized = await resizeImageForUpload(dataUrl);
        const file = base64ToFile(resized, `comodo_${roomId}_${Date.now()}.jpg`);
        const uploaded = await uploadFoto({ vistoria_id: vId, file, descricao: '', comodo_nome: roomName });
        const storedUrl = uploaded?.url;
        if (storedUrl) {
          setInspection(prev => prev ? {
            ...prev,
            rooms: prev.rooms.map((r: RoomAccordionType) => r.id === roomId ? {
              ...r, photos: r.photos.map((p: string) => p === dataUrl ? storedUrl : p)
            } : r)
          } : prev);
        }
        setPhotoUploadStatus(prev => ({ ...prev, [key]: 'done' }));
      } catch {
        setPhotoUploadStatus(prev => ({ ...prev, [key]: 'error' }));
      }
    })();
    pendingUploadsRef.current.add(promise);
    promise.finally(() => pendingUploadsRef.current.delete(promise));
  };

  // Adiciona foto ao cômodo e inicia upload imediato em background
  const handleCapturePhoto = (roomId: string, dataUrl: string) => {
    const roomName = inspection?.rooms.find((r: RoomAccordionType) => r.id === roomId)?.name || roomId;
    setInspection((prev: InspectionData | null) => prev ? {
      ...prev,
      rooms: prev.rooms.map((room: RoomAccordionType) =>
        room.id === roomId
          ? { ...room, photos: [...(room.photos || []), dataUrl], completed: false }
          : room
      )
    } : prev);
    uploadPhotoBackground(dataUrl, roomId, roomName);
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

      const roomName = inspection?.rooms.find((r: RoomAccordionType) => r.id === roomId)?.name || roomId;

      // createImageBitmap: decodifica a imagem na GPU (não bloqueia main thread).
      // Canvas de 128px apenas para gerar um thumbnail leve para exibição.
      // O File original é mantido para upload direto — Sharp no backend faz compressão real.
      const THUMB_SIZE = 128;
      const entries = await Promise.all(files.map(async (file) => {
        try {
          const bitmap = await createImageBitmap(file);
          const scale = THUMB_SIZE / Math.max(bitmap.width, bitmap.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(bitmap.width * scale);
          canvas.height = Math.round(bitmap.height * scale);
          canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          bitmap.close();
          return { thumb: canvas.toDataURL('image/jpeg', 0.75), file };
        } catch {
          // Fallback: lê como data URL pequena
          return new Promise<{ thumb: string; file: File }>((resolve) => {
            const reader = new FileReader();
            reader.onload = ev => resolve({ thumb: ev.target?.result as string, file });
            reader.onerror = () => resolve({ thumb: '', file });
            reader.readAsDataURL(file);
          });
        }
      }));

      const validEntries = entries.filter(e => e.thumb);
      const thumbs = validEntries.map(e => e.thumb);

      // Um único setInspection para todas as fotos (um render só)
      setInspection((prev: InspectionData | null) => prev ? {
        ...prev,
        rooms: prev.rooms.map((room: RoomAccordionType) =>
          room.id === roomId
            ? { ...room, photos: [...(room.photos || []), ...thumbs], completed: false }
            : room
        )
      } : prev);

      // Uma única atualização de status para todas
      const statusUpdate: Record<string, 'uploading'> = {};
      validEntries.forEach(({ thumb }) => { statusUpdate[photoKey(thumb)] = 'uploading'; });
      setPhotoUploadStatus(prev => ({ ...prev, ...statusUpdate }));

      // Upload do File original em background para cada foto
      validEntries.forEach(({ thumb, file }) => {
        const key = photoKey(thumb);
        const promise: Promise<void> = (async () => {
          try {
            const vId = await ensureVistoriaExists();
            const uploaded = await uploadFoto({ vistoria_id: vId, file, descricao: '', comodo_nome: roomName });
            const storedUrl = uploaded?.url;
            if (storedUrl) {
              setInspection(prev => prev ? {
                ...prev,
                rooms: prev.rooms.map((r: RoomAccordionType) => r.id === roomId ? {
                  ...r, photos: r.photos.map((p: string) => p === thumb ? storedUrl : p)
                } : r)
              } : prev);
            }
            setPhotoUploadStatus(prev => ({ ...prev, [key]: 'done' }));
          } catch {
            setPhotoUploadStatus(prev => ({ ...prev, [key]: 'error' }));
          }
        })();
        pendingUploadsRef.current.add(promise);
        promise.finally(() => pendingUploadsRef.current.delete(promise));
      });

      setSnackbar({
        open: true,
        message: validEntries.length > 1 ? `${validEntries.length} fotos adicionadas ao cômodo.` : 'Foto adicionada ao cômodo.',
        type: 'success'
      });
    };
    input.click();
  };

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

  const handleFinalizarVistoria = async () => {
    if (!inspection || !selectedImovel) {
      setSnackbar({ open: true, message: 'Selecione um imóvel antes de salvar o checklist.', type: 'error' });
      return;
    }

    setSaving(true);

    try {
      // 1. Garante que existe uma vistoria
      let vistoriaId = vistoriaIdRef.current || inspection.id;
      if (!vistoriaId) {
        const created = await criarVistoria({
          imovel_id: selectedImovel.id,
          descricao: `Vistoria do imóvel ${selectedImovel.nome}`,
          data: new Date().toISOString().slice(0, 10),
          status: 'em_andamento',
        });
        vistoriaId = String(created.id ?? '');
        if (!vistoriaId) throw new Error('API não retornou o ID da vistoria criada.');
        vistoriaIdRef.current = vistoriaId;
        setInspection((prev: InspectionData | null) => prev ? { ...prev, id: vistoriaId } : prev);
      }

      // 2. Salva descrições de todos os cômodos em paralelo (rápido)
      await Promise.all(inspection.rooms.map((room: RoomAccordionType) =>
        criarOuAtualizarComodoVistoria({
          vistoria_id: vistoriaId!,
          nome: room.name,
          descricao: room.description,
        })
      ));

      // 3. Atualiza status da vistoria
      const vistoriaAtual = await buscarVistoriaPorId(vistoriaId);
      if (vistoriaAtual?.status !== 'finalizada') {
        await atualizarVistoria(vistoriaId, { status: 'finalizada' });
      }

      // Fotos continuam subindo em background — não bloqueamos o save nelas.
      // O upload já está em andamento desde que cada foto foi adicionada.
      const comodosPreenchidos = inspection.rooms.filter(
        (r: RoomAccordionType) => r.photos.length > 0 || (r.description && r.description.trim().length > 0)
      );
      const totalFotos = comodosPreenchidos.reduce((acc: number, r: RoomAccordionType) => acc + r.photos.length, 0);
      await removeProgress();
      setSuccessData({
        vistoriaId,
        imovelId: String(selectedImovel.id),
        imovelNome: selectedImovel.nome,
        totalComodos: comodosPreenchidos.length,
        totalFotos,
      });
    } catch (e) {
      console.error('Erro ao salvar checklist:', e);
      setSnackbar({ open: true, message: 'Erro ao salvar checklist: ' + (e as Error).message, type: 'error' });
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
            photoUploadStatus={photoUploadStatus}
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
              Salvar Checklist
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
        @keyframes popIn {
          0%   { transform: scale(0.7); opacity: 0; }
          70%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes checkDraw {
          0%   { stroke-dashoffset: 60; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
      </Main>
      {successData && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#1a1a2e', borderRadius: 24, padding: '40px 32px',
            maxWidth: 380, width: '100%', textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            animation: 'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
          }}>
            {/* Checkmark animado */}
            <div style={{ marginBottom: 24 }}>
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#2ecc40" strokeWidth="5" opacity="0.2" />
                <circle cx="40" cy="40" r="36" fill="none" stroke="#2ecc40" strokeWidth="5"
                  strokeDasharray="226" strokeDashoffset="0" strokeLinecap="round"
                  style={{ animation: 'checkDraw 0.6s ease forwards' }} />
                <polyline points="24,42 35,53 57,29" fill="none" stroke="#2ecc40" strokeWidth="5"
                  strokeLinecap="round" strokeLinejoin="round"
                  strokeDasharray="60" strokeDashoffset="0"
                  style={{ animation: 'checkDraw 0.5s 0.3s ease both' }} />
              </svg>
            </div>

            <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px' }}>
              Checklist Salvo!
            </h2>
            <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0 0 4px' }}>
              {successData.imovelNome}
            </p>
            <p style={{ color: '#888', fontSize: '0.82rem', margin: '0 0 20px' }}>
              Agora preencha os dados para finalizar a vistoria.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#2ecc40', fontSize: '1.8rem', fontWeight: 800 }}>{successData.totalComodos}</div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>cômodos</div>
              </div>
              <div style={{ width: 1, background: '#333' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#2ecc40', fontSize: '1.8rem', fontWeight: 800 }}>{successData.totalFotos}</div>
                <div style={{ color: '#888', fontSize: '0.8rem' }}>fotos</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                onClick={() => { setSuccessData(null); navigate(`/property-laudo/${successData.imovelId}`); }}
                style={{
                  padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: '#2ecc40', color: '#fff', fontWeight: 700, fontSize: '1rem',
                }}
              >
                Ver Vistoria
              </button>
              <button
                onClick={() => { setSuccessData(null); navigate(-1); }}
                style={{
                  padding: '14px', borderRadius: 12, border: '1px solid #333', cursor: 'pointer',
                  background: 'transparent', color: '#aaa', fontWeight: 600, fontSize: '0.95rem',
                }}
              >
                Nova Vistoria
              </button>
            </div>
          </div>
        </div>
      )}
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