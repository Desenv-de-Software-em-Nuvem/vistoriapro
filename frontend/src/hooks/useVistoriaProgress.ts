import { useCallback, useEffect, useState } from 'react';
import {
  saveVistoriaProgress,
  getVistoriaProgress,
  listVistoriasEmAndamento,
  removeVistoriaProgress,
} from '../services/vistoriaProgressService';
import type { VistoriaProgress } from '../services/vistoriaProgressService';

interface UseVistoriaProgressProps {
  idImovel: string;
  idUsuario: string;
}

export function useVistoriaProgress({ idImovel, idUsuario }: UseVistoriaProgressProps) {
  const [progress, setProgress] = useState<VistoriaProgress | null>(null);
  const [loading, setLoading] = useState(true);

  const id = `vistoria_${idImovel}_${idUsuario}`;

  const loadProgress = useCallback(async () => {
    setLoading(true);
    console.log('Carregando progresso para ID:', id);
    const data = await getVistoriaProgress(id);
    console.log('Progresso carregado:', data);
    setProgress(data || null);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const saveProgress = useCallback(async (data: any) => {
    await saveVistoriaProgress({
      id,
      idImovel,
      idUsuario,
      data,
      updatedAt: Date.now(),
    });
    setProgress({ id, idImovel, idUsuario, data, updatedAt: Date.now() });
  }, [id, idImovel, idUsuario]);

  const removeProgress = useCallback(async () => {
    await removeVistoriaProgress(id);
    setProgress(null);
  }, [id]);

  return {
    progress,
    loading,
    saveProgress,
    removeProgress,
    reload: loadProgress,
  };
}

export function useVistoriasEmAndamento(idUsuario: string) {
  const [vistorias, setVistorias] = useState<VistoriaProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVistorias = useCallback(async () => {
    setLoading(true);
    const list = await listVistoriasEmAndamento(idUsuario);
    setVistorias(list);
    setLoading(false);
  }, [idUsuario]);

  useEffect(() => {
    loadVistorias();
  }, [loadVistorias]);

  return { vistorias, loading, reload: loadVistorias };
}
