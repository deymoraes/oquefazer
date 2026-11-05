export type Prioridade = 'maxima' | 'media' | 'minima'

export type TipoRecorrencia = 'diario' | 'semanal' | 'customizado'

export interface Categoria {
  id: string
  nome: string
  cor?: string
  ordem: number
  isDefault: boolean
}

export interface Recorrencia {
  tipo: TipoRecorrencia
  intervaloMinutos?: number
  diasSemana?: number[]
}

export interface Lembrete {
  id: string
  notaId: string
  tipo: 'unico' | 'recorrente'
  dataHora: Date
  recorrencia?: Recorrencia
  ativo: boolean
  ultimoDisparo?: Date
}

export interface Nota {
  id: string
  categoriaId: string
  texto: string
  audioBlob?: Blob
  prioridade: Prioridade
  ordem: number
  criadoEm: Date
  concluidoEm?: Date
  lembrar?: Lembrete
}

export type ViewMode = 'ativas' | 'concluidas'
