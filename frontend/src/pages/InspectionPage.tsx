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
import {
  roomChecklists,
  applyComodoLabels,
  buildComodoConfigMap,
  getDefaultRoomName,
  getRoomIcon,
} from '../data/roomChecklists';
import {
  listarComodosConfigEmpresa,
  restaurarComodoConfigPadrao,
  salvarComodoConfigEmpresa,
} from '../services/empresaComodoConfigService';
import { AppHeader } from '../components/AppHeader';
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

  const photoKey = (src: string) => {
    if (src.startsWith('blob:') || src.startsWith('http')) return src;
    return src.slice(0, 300); // data URL camera: fatia para chave de status
  };
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




  const [comodoConfigMap, setComodoConfigMap] = useState<Record<string, string>>({});

  // Quando selectedImovel ou progresso mudar, carrega config da empresa e monta o checklist
  useEffect(() => {
    if (!selectedImovel) {
      setInspection(null);
      setComodoConfigMap({});
      return;
    }

    let cancelled = false;
    const tipo = getCanonicalPropertyType(selectedImovel.tipo || 'CASA');

    const initInspection = async () => {
      let configMap: Record<string, string> = {};
      try {
        const configs = await listarComodosConfigEmpresa(tipo);
        if (!cancelled) {
          configMap = buildComodoConfigMap(configs);
          setComodoConfigMap(configMap);
        }
      } catch {
        if (!cancelled) setComodoConfigMap({});
      }

      if (cancelled) return;

      if (progress?.data) {
        const saved = progress.data as InspectionData;
        const roomsWithIcons = (saved.rooms || []).map((room) => ({
          ...room,
          icon: getRoomIcon(tipo, room.id),
        }));
        setInspection({
          ...saved,
          rooms: applyComodoLabels(roomsWithIcons, configMap),
        });
        return;
      }

      const defaultRooms = (roomChecklists[tipo] || roomChecklists.CASA).map((room: RoomChecklistDefinition) => ({
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
        rooms: applyComodoLabels(defaultRooms, configMap),
        createdAt: new Date(),
      });
    };

    initInspection();
    return () => { cancelled = true; };
  }, [selectedImovel, progress, idUsuario]);

  const handleRenameRoom = async (roomId: string, newName: string) => {
    if (!selectedImovel || !inspection) return;

    const tipo = getCanonicalPropertyType(selectedImovel.tipo || 'CASA');
    const trimmed = newName.trim();
    if (!trimmed) {
      setSnackbar({ open: true, message: 'Informe um nome para o cômodo.', type: 'error' });
      return;
    }

    const defaultName = getDefaultRoomName(tipo, roomId);
    const nextMap = { ...comodoConfigMap };

    setInspection((prev) => {
      if (!prev) return prev;
      const updated: InspectionData = {
        ...prev,
        rooms: prev.rooms.map((room) =>
          room.id === roomId ? { ...room, name: trimmed } : room
        ),
        photos: prev.photos.map((photo) =>
          photo.roomId === roomId ? { ...photo, roomName: trimmed } : photo
        ),
      };
      saveProgress(serializeInspection(updated));
      return updated;
    });

    try {
      if (defaultName && trimmed === defaultName) {
        await restaurarComodoConfigPadrao(tipo, roomId);
        delete nextMap[roomId];
        setSnackbar({ open: true, message: 'Nome padrão restaurado para sua empresa.', type: 'success' });
      } else {
        await salvarComodoConfigEmpresa({
          tipo_imovel: tipo,
          comodo_key: roomId,
          nome_exibicao: trimmed,
        });
        nextMap[roomId] = trimmed;
        setSnackbar({ open: true, message: 'Nome salvo para todos da sua empresa.', type: 'success' });
      }
      setComodoConfigMap(nextMap);
    } catch {
      setSnackbar({ open: true, message: 'Erro ao salvar nome do cômodo.', type: 'error' });
    }
  };


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
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []);
      if (!files.length) return;

      const roomName = inspection?.rooms.find((r: RoomAccordionType) => r.id === roomId)?.name || roomId;

      // Blob URLs: ponteiro direto ao arquivo, zero cópia, zero processamento.
      // Funciona como background-image CSS (não depende de src em <img>).
      const blobUrls = files.map(f => URL.createObjectURL(f));

      setInspection((prev: InspectionData | null) => prev ? {
        ...prev,
        rooms: prev.rooms.map((room: RoomAccordionType) =>
          room.id === roomId
            ? { ...room, photos: [...(room.photos || []), ...blobUrls], completed: false }
            : room
        )
      } : prev);

      const statusUpdate: Record<string, 'uploading'> = {};
      blobUrls.forEach(url => { statusUpdate[url] = 'uploading'; });
      setPhotoUploadStatus(prev => ({ ...prev, ...statusUpdate }));

      const uploadOnePhoto = async (file: File, i: number) => {
        const blobUrl = blobUrls[i];
        try {
          const vId = await ensureVistoriaExists();
          const uploadFile = await prepareImageFileForUpload(file);
          const uploaded = await uploadFoto({ vistoria_id: vId, file: uploadFile, descricao: '', comodo_nome: roomName });
          const storedUrl = uploaded?.url;
          if (storedUrl) {
            setInspection(prev => prev ? {
              ...prev,
              rooms: prev.rooms.map((r: RoomAccordionType) => r.id === roomId ? {
                ...r, photos: r.photos.map((p: string) => p === blobUrl ? storedUrl : p)
              } : r)
            } : prev);
            URL.revokeObjectURL(blobUrl);
          }
          setPhotoUploadStatus(prev => ({ ...prev, [blobUrl]: 'done' }));
        } catch {
          setPhotoUploadStatus(prev => ({ ...prev, [blobUrl]: 'error' }));
        }
      };

      const uploadQueue: Promise<void> = (async () => {
        let nextIndex = 0;
        const workers = Array.from({ length: Math.min(3, files.length) }, async () => {
          while (nextIndex < files.length) {
            const currentIndex = nextIndex++;
            await uploadOnePhoto(files[currentIndex], currentIndex);
          }
        });
        await Promise.all(workers);
      })();
      pendingUploadsRef.current.add(uploadQueue);
      uploadQueue.finally(() => pendingUploadsRef.current.delete(uploadQueue));

      setSnackbar({
        open: true,
        message: files.length > 1 ? `${files.length} fotos adicionadas ao cômodo.` : 'Foto adicionada ao cômodo.',
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

  const resizeImageForAi = (dataUrl: string, maxSize = 1280, quality = 0.82) => new Promise<string>((resolve) => {
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

  const MOSAIC_BATCH_SIZE = 9; // fotos por lote — encaixa num grid 3×3
  const MOSAIC_LABEL_H = 18;
  const MOSAIC_GAP = 8;
  const MOSAIC_QUALITY = 0.60;

  // Layout adaptativo: mantém canvas abaixo de ~700×610px independente do número de fotos
  const getMosaicLayout = (count: number) => {
    if (count <= 2) return { cols: count, cellW: 380, cellH: 285 };
    if (count <= 4) return { cols: 2, cellW: 280, cellH: 210 };
    if (count <= 6) return { cols: 3, cellW: 220, cellH: 165 };
    return { cols: 3, cellW: 200, cellH: 150 }; // 7–9 fotos
  };

  const loadImageForCanvas = (dataUrl: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Não foi possível preparar o mosaico de fotos para IA.'));
    image.src = dataUrl;
  });

  const createPhotoMosaicForAi = async (dataUrls: string[]): Promise<string> => {
    if (dataUrls.length === 1) return dataUrls[0];

    const { cols, cellW, cellH } = getMosaicLayout(dataUrls.length);
    const rows = Math.ceil(dataUrls.length / cols);
    const images = await Promise.all(dataUrls.map(loadImageForCanvas));

    const canvas = document.createElement('canvas');
    canvas.width = cols * cellW + (cols + 1) * MOSAIC_GAP;
    canvas.height = rows * (cellH + MOSAIC_LABEL_H) + (rows + 1) * MOSAIC_GAP;

    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrls[0];

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 11px Arial';
    ctx.textBaseline = 'middle';

    images.forEach((img, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = MOSAIC_GAP + col * (cellW + MOSAIC_GAP);
      const y = MOSAIC_GAP + row * (cellH + MOSAIC_LABEL_H + MOSAIC_GAP);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(`Foto ${i + 1}`, x + 5, y + MOSAIC_LABEL_H / 2);

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y + MOSAIC_LABEL_H, cellW, cellH);

      const scale = Math.min(cellW / img.width, cellH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, x + (cellW - dw) / 2, y + MOSAIC_LABEL_H + (cellH - dh) / 2, dw, dh);
    });

    return canvas.toDataURL('image/jpeg', MOSAIC_QUALITY);
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

  const preparePhotoForAi = async (photo: string, maxSize = 1280, quality = 0.82) => {
    if (photo.startsWith('data:image/')) {
      return resizeImageForAi(photo, maxSize, quality);
    }

    const response = await fetch(resolvePhotoUrl(photo));
    if (!response.ok) {
      throw new Error('Não foi possível carregar uma das fotos para análise da IA.');
    }

    const dataUrl = await blobToDataUrl(await response.blob());
    return resizeImageForAi(dataUrl, maxSize, quality);
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
      // Divide todas as fotos em lotes de MOSAIC_BATCH_SIZE e processa sequencialmente.
      // Nenhuma foto é ignorada — lotes adicionais geram mais linhas de laudo.
      const lotes: string[][] = [];
      for (let i = 0; i < photos.length; i += MOSAIC_BATCH_SIZE) {
        lotes.push(photos.slice(i, i + MOSAIC_BATCH_SIZE));
      }

      const parciais: string[] = [];
      for (let li = 0; li < lotes.length; li++) {
        const lote = lotes[li];
        const { cellW } = getMosaicLayout(lote.length);
        const fotosPrep = await Promise.all(
          lote.map(p => preparePhotoForAi(p, cellW * 2, 0.80))
        );
        const mosaico = await createPhotoMosaicForAi(fotosPrep);
        const grupoCtx = lotes.length > 1
          ? `Grupo ${li + 1} de ${lotes.length}: fotos ${li * MOSAIC_BATCH_SIZE + 1} a ${Math.min((li + 1) * MOSAIC_BATCH_SIZE, photos.length)} de ${photos.length} no total do cômodo.`
          : '';
        const inst = [
          lote.length > 1 ? `A imagem é um mosaico com ${lote.length} foto(s) do ambiente "${roomName}", identificadas como Foto 1, Foto 2 etc.` : '',
          grupoCtx,
          instrucoes || '',
        ].filter(Boolean).join(' ');
        const parcial = await descreverFotoComIa({ imagem: mosaico, comodo_nome: roomName, instrucoes: inst });
        parciais.push(parcial);
      }

      aplicarDescricaoIa(roomId, parciais.join('\n'));
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
          comodo_key: room.id,
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

  function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          resolve(result);
          return;
        }
        reject(new Error('Não foi possível preparar a foto.'));
      };
      reader.onerror = () => reject(new Error('Não foi possível ler a foto.'));
      reader.readAsDataURL(file);
    });
  }

  async function prepareImageFileForUpload(file: File) {
    if (!file.type.startsWith('image/')) return file;

    try {
      const dataUrl = await fileToDataUrl(file);
      const shouldReencode = file.size > 4 * 1024 * 1024 || file.type !== 'image/jpeg';
      const resized = await resizeImageForUpload(dataUrl, 1600, shouldReencode, 0.9);
      if (resized === dataUrl) return file;

      const baseName = file.name.replace(/\.[^.]+$/, '') || 'foto';
      return base64ToFile(resized, `${baseName}_${Date.now()}.jpg`);
    } catch {
      return file;
    }
  }

  function resizeImageForUpload(dataUrl: string, maxSize = 2000, forceEncode = false, quality = 0.95) {
    return new Promise<string>((resolve) => {
      const image = new Image();
      image.onload = () => {
        const maxDim = Math.max(image.width, image.height);
        if (maxDim <= maxSize && !forceEncode) {
          resolve(dataUrl);
          return;
        }
        const scale = Math.min(1, maxSize / maxDim);
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
        resolve(canvas.toDataURL('image/jpeg', quality));
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
            onRenameRoom={handleRenameRoom}
            getDefaultRoomName={(roomId) =>
              getDefaultRoomName(
                getCanonicalPropertyType(selectedImovel?.tipo || 'CASA'),
                roomId
              )
            }
          />
        )}
        {/* ...outros fluxos, se necessário... */}
        {/* Botão de finalizar vistoria */}
        {selectedImovel && inspection && (
          saving ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '32px 0 0 0' }}>
              <div className="loader" style={{ marginBottom: 12 }} />
              <span style={{ color: '#2ecc40', fontWeight: 600, fontSize: '1.1rem' }}>Salvando checklist...</span>
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
    </Container>
  )
}
