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
import React, { useState, useEffect } from 'react';
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
  min-height: var(--vistoriapro-app-height, 100dvh);
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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; type: 'success' | 'error' | 'info' }>({ open: false, message: '', type: 'info' });
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
    void gerarDescricaoFotoComIa(roomId, dataUrl);
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
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev: ProgressEvent<FileReader>) => {
        const result = ev.target?.result;
        if (typeof result !== 'string') return;
        setInspection((prev: InspectionData | null) => prev ? {
          ...prev,
          rooms: prev.rooms.map((room: RoomAccordionType) =>
            room.id === roomId ? { ...room, photos: [...(room.photos || []), result] } : room
          )
        } : prev);
        void gerarDescricaoFotoComIa(roomId, result);
      };
      reader.readAsDataURL(file);
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

  const resizeImageForAi = (dataUrl: string, maxSize = 1024, quality = 0.82) => new Promise<string>((resolve) => {
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

  const gerarDescricaoFotoComIa = async (roomId: string, dataUrl: string) => {
    if (aiUnavailable) return;

    const room = inspection?.rooms.find((item: RoomAccordionType) => item.id === roomId);
    const roomName = room?.name || 'Cômodo';
    setAiLoadingRooms((prev) => ({ ...prev, [roomId]: true }));

    try {
      const imagem = await resizeImageForAi(dataUrl);
      const descricao = await descreverFotoComIa({
        imagem,
        comodo_nome: roomName,
      });
      aplicarDescricaoIa(roomId, descricao);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 503) {
        setAiUnavailable(true);
        setSnackbar({
          open: true,
          message: 'IA de descrição ainda não configurada. A vistoria continua em modo manual.',
          type: 'info'
        });
        return;
      }
      setSnackbar({
        open: true,
        message: 'Não foi possível gerar a descrição automática desta foto.',
        type: 'info'
      });
    } finally {
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

      // 3. Faz upload das fotos de todos os cômodos
      for (const room of inspection.rooms) {
        for (const photo of room.photos) {
          if (isStoredPhotoUrl(photo)) continue;
          const file = base64ToFile(photo, `comodo_${room.id}_${Date.now()}.jpg`);
          const comodoIdNum = Number(room.id);
          const uploadParams: {
            vistoria_id: string;
            file: File;
            descricao: string;
            comodo_nome: string;
            comodo_id?: number;
          } = {
            vistoria_id: vistoriaId!,
            file,
            descricao: '',
            comodo_nome: room.name,
          };
          if (!isNaN(comodoIdNum)) {
            uploadParams.comodo_id = comodoIdNum;
          }
          await uploadFoto(uploadParams);
        }
      }

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
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      />
      <MobileTabBar />
    </Container>
  )
}