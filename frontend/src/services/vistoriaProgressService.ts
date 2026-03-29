import Dexie from 'dexie';

export interface VistoriaProgress {
  id: string; // id único: vistoria_{idImovel}_{idUsuario}
  idImovel: string;
  idUsuario: string;
  data: any; // dados da vistoria (fotos, áudios, campos)
  updatedAt: number;
}

class VistoriaProgressDB extends Dexie {
  vistorias!: Dexie.Table<VistoriaProgress, string>;

  constructor() {
    super('VistoriaProgressDB');
    this.version(1).stores({
      vistorias: 'id, idImovel, idUsuario, updatedAt',
    });
  }
}

export const db = new VistoriaProgressDB();

export async function saveVistoriaProgress(progress: VistoriaProgress) {
  await db.vistorias.put({ ...progress, updatedAt: Date.now() });
}

export async function getVistoriaProgress(id: string) {
  return db.vistorias.get(id);
}

export async function listVistoriasEmAndamento(idUsuario: string) {
  return db.vistorias.where('idUsuario').equals(idUsuario).toArray();
}

export async function removeVistoriaProgress(id: string) {
  await db.vistorias.delete(id);
}
