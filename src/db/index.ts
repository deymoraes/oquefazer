import Dexie, { type Table } from 'dexie'
import type { Categoria, Nota, Lembrete } from '@/types'

export class OQueFazerDB extends Dexie {
  categorias!: Table<Categoria, string>
  notas!: Table<Nota, string>
  lembretes!: Table<Lembrete, string>

  constructor() {
    super('OQueFazerDB')

    this.version(1).stores({
      categorias: 'id, nome, ordem, isDefault',
      notas: 'id, categoriaId, prioridade, ordem, concluidoEm, criadoEm',
      lembretes: 'id, notaId, ativo, dataHora'
    })
  }
}

export const db = new OQueFazerDB()

export async function inicializarDB() {
  const count = await db.categorias.count()

  if (count === 0) {
    await db.categorias.bulkAdd([
      { id: 'pessoal', nome: 'Pessoal', ordem: 0, isDefault: true },
      { id: 'trabalho', nome: 'Trabalho', ordem: 1, isDefault: true }
    ])
  }
}
