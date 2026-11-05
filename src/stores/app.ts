import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db, inicializarDB } from '@/db'
import { v4 as uuidv4 } from 'uuid'
import type { Categoria, Nota, Prioridade, ViewMode, Lembrete } from '@/types'

export const useAppStore = defineStore('app', () => {
  // Estado
  const categorias = ref<Categoria[]>([])
  const notas = ref<Nota[]>([])
  const categoriaAtiva = ref<string>('pessoal')
  const viewMode = ref<ViewMode>('ativas')
  const menuAberto = ref(false)
  const carregando = ref(true)

  // Computed
  const categoriasOrdenadas = computed(() =>
    [...categorias.value].sort((a, b) => a.ordem - b.ordem)
  )

  const notasAtivas = computed(() =>
    notas.value.filter(n => !n.concluidoEm)
  )

  const notasConcluidas = computed(() =>
    notas.value.filter(n => n.concluidoEm).sort((a, b) =>
      new Date(b.concluidoEm!).getTime() - new Date(a.concluidoEm!).getTime()
    )
  )

  const notasPorPrioridade = computed(() => {
    const notasFiltradas = categoriaAtiva.value
      ? notasAtivas.value.filter(n => n.categoriaId === categoriaAtiva.value)
      : notasAtivas.value

    return {
      maxima: notasFiltradas.filter(n => n.prioridade === 'maxima')
        .sort((a, b) => a.ordem - b.ordem),
      media: notasFiltradas.filter(n => n.prioridade === 'media')
        .sort((a, b) => a.ordem - b.ordem),
      minima: notasFiltradas.filter(n => n.prioridade === 'minima')
        .sort((a, b) => a.ordem - b.ordem)
    }
  })

  const categoriaAtual = computed(() =>
    categorias.value.find(c => c.id === categoriaAtiva.value)
  )

  const contadorLembretes = computed(() =>
    notasAtivas.value.filter(n => n.lembrar?.ativo).length
  )

  // Ações
  async function inicializar() {
    try {
      await inicializarDB()
      await carregarDados()
    } catch (error) {
      console.error('Erro ao inicializar:', error)
    } finally {
      carregando.value = false
    }
  }

  async function carregarDados() {
    categorias.value = await db.categorias.toArray()
    notas.value = await db.notas.toArray()
  }

  async function criarNota(texto: string, prioridade: Prioridade = 'media'): Promise<Nota> {
    const nota: Nota = {
      id: uuidv4(),
      categoriaId: categoriaAtiva.value,
      texto,
      prioridade,
      ordem: Date.now(),
      criadoEm: new Date()
    }

    await db.notas.add(nota)
    notas.value.push(nota)

    return nota
  }

  async function atualizarNota(id: string, updates: Partial<Nota>) {
    await db.notas.update(id, updates)
    const index = notas.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notas.value[index] = { ...notas.value[index], ...updates }
    }
  }

  async function excluirNota(id: string) {
    await db.notas.delete(id)
    await db.lembretes.where('notaId').equals(id).delete()
    notas.value = notas.value.filter(n => n.id !== id)
  }

  async function concluirNota(id: string) {
    await atualizarNota(id, { concluidoEm: new Date() })
  }

  async function restaurarNota(id: string) {
    await atualizarNota(id, { concluidoEm: undefined })
  }

  async function criarCategoria(nome: string, cor?: string): Promise<Categoria> {
    const maxOrdem = Math.max(0, ...categorias.value.map(c => c.ordem))
    const categoria: Categoria = {
      id: uuidv4(),
      nome,
      cor,
      ordem: maxOrdem + 1,
      isDefault: false
    }

    await db.categorias.add(categoria)
    categorias.value.push(categoria)

    return categoria
  }

  async function atualizarCategoria(id: string, updates: Partial<Categoria>) {
    await db.categorias.update(id, updates)
    const index = categorias.value.findIndex(c => c.id === id)
    if (index !== -1) {
      categorias.value[index] = { ...categorias.value[index], ...updates }
    }
  }

  async function excluirCategoria(id: string) {
    const categoria = categorias.value.find(c => c.id === id)
    if (categoria?.isDefault) return

    await db.categorias.delete(id)
    await db.notas.where('categoriaId').equals(id).delete()
    categorias.value = categorias.value.filter(c => c.id !== id)
    notas.value = notas.value.filter(n => n.categoriaId !== id)

    if (categoriaAtiva.value === id) {
      categoriaAtiva.value = 'pessoal'
    }
  }

  async function definirLembrete(notaId: string, lembrete: Omit<Lembrete, 'id' | 'notaId'>) {
    const existingReminder = await db.lembretes.where('notaId').equals(notaId).first()

    if (existingReminder) {
      await db.lembretes.update(existingReminder.id, {
        ...lembrete,
        ativo: true
      })
    } else {
      const novoLembrete: Lembrete = {
        id: uuidv4(),
        notaId,
        ...lembrete
      }
      await db.lembretes.add(novoLembrete)
    }

    await atualizarNota(notaId, {
      lembrar: {
        ...lembrete,
        id: existingReminder?.id || uuidv4(),
        notaId,
        ativo: true
      }
    })
  }

  async function removerLembrete(notaId: string) {
    await db.lembretes.where('notaId').equals(notaId).delete()
    await atualizarNota(notaId, { lembrar: undefined })
  }

  async function limparConcluidas() {
    const ids = notasConcluidas.value.map(n => n.id)
    await db.notas.bulkDelete(ids)
    await db.lembretes.where('notaId').anyOf(ids).delete()
    notas.value = notas.value.filter(n => !n.concluidoEm)
  }

  function selecionarCategoria(id: string) {
    categoriaAtiva.value = id
    viewMode.value = 'ativas'
    menuAberto.value = false
  }

  function toggleMenu() {
    menuAberto.value = !menuAberto.value
  }

  function fecharMenu() {
    menuAberto.value = false
  }

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
    menuAberto.value = false
  }

  return {
    // Estado
    categorias,
    notas,
    categoriaAtiva,
    viewMode,
    menuAberto,
    carregando,

    // Computed
    categoriasOrdenadas,
    notasAtivas,
    notasConcluidas,
    notasPorPrioridade,
    categoriaAtual,
    contadorLembretes,

    // Ações
    inicializar,
    carregarDados,
    criarNota,
    atualizarNota,
    excluirNota,
    concluirNota,
    restaurarNota,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    definirLembrete,
    removerLembrete,
    limparConcluidas,
    selecionarCategoria,
    toggleMenu,
    fecharMenu,
    setViewMode
  }
})
