import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { v4 as uuidv4 } from 'uuid'
import type { Categoria, Nota, Prioridade, ViewMode, Lembrete } from '@/types'

const AUTH_STORAGE_KEY = 'oquefazer_auth_v1'
const CAT_ATIVA_STORAGE_KEY = 'oquefazer_categoria_ativa_v1'
const CACHE_CATEGORIAS_KEY = 'oquefazer_cache_categorias_v1'
const CACHE_NOTAS_KEY = 'oquefazer_cache_notas_v1'

const EMAIL_AUTORIZADO = 'deyvisonmoraes.dey@gmail.com'
const SENHA_AUTORIZADA = 'Dey142577@'

export const useAppStore = defineStore('app', () => {
  // Estado de Autenticação (persistente sem expiração)
  const autenticado = ref<boolean>(localStorage.getItem(AUTH_STORAGE_KEY) === 'true')

  // Estado de Dados
  const categorias = ref<Categoria[]>([])
  const notas = ref<Nota[]>([])
  const categoriaAtiva = ref<string>(localStorage.getItem(CAT_ATIVA_STORAGE_KEY) || '')
  const viewMode = ref<ViewMode>('ativas')
  const menuAberto = ref(false)
  const carregando = ref(true)
  const sincronizando = ref(false)
  const erroSincronizacao = ref<string | null>(null)
  const notificacaoToast = ref<Nota | null>(null)

  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null
  let listenersRegistrados = false
  const timersLembretes = new Map<string, ReturnType<typeof setTimeout>>()

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

  // Helpers de Mapeamento e Cache
  function mapearCategoriaDoBanco(c: any): Categoria {
    return {
      id: c.id,
      nome: c.nome,
      cor: c.cor || '#3B82F6',
      ordem: c.ordem ?? 0,
      isDefault: Boolean(c.is_default)
    }
  }

  function mapearNotaDoBanco(n: any): Nota {
    return {
      id: n.id,
      categoriaId: n.categoria_id,
      texto: n.texto,
      prioridade: n.prioridade,
      ordem: n.ordem ?? 0,
      criadoEm: n.criado_em ? new Date(n.criado_em) : new Date(),
      concluidoEm: n.concluido_em ? new Date(n.concluido_em) : undefined,
      lembrar: n.lembrar_ativo && n.lembrar_data_hora ? {
        id: n.id,
        notaId: n.id,
        tipo: n.lembrar_tipo || 'unico',
        dataHora: new Date(n.lembrar_data_hora),
        ativo: Boolean(n.lembrar_ativo),
        recorrencia: n.lembrar_recorrencia_tipo ? {
          tipo: n.lembrar_recorrencia_tipo
        } : undefined
      } : undefined
    }
  }

  function salvarCacheLocal() {
    try {
      localStorage.setItem(CACHE_CATEGORIAS_KEY, JSON.stringify(categorias.value))
      localStorage.setItem(CACHE_NOTAS_KEY, JSON.stringify(notas.value))
      if (categoriaAtiva.value) {
        localStorage.setItem(CAT_ATIVA_STORAGE_KEY, categoriaAtiva.value)
      }
    } catch (e) {
      console.warn('Não foi possível salvar cache local:', e)
    }
  }

  function carregarCacheLocal() {
    try {
      const catCache = localStorage.getItem(CACHE_CATEGORIAS_KEY)
      const notCache = localStorage.getItem(CACHE_NOTAS_KEY)
      if (catCache) {
        categorias.value = JSON.parse(catCache)
      }
      if (notCache) {
        notas.value = JSON.parse(notCache).map((n: any) => ({
          ...n,
          criadoEm: new Date(n.criadoEm),
          concluidoEm: n.concluidoEm ? new Date(n.concluidoEm) : undefined,
          lembrar: n.lembrar ? {
            ...n.lembrar,
            dataHora: new Date(n.lembrar.dataHora)
          } : undefined
        }))
      }
      garantirCategoriaAtivaValida()
    } catch (e) {
      console.warn('Erro ao ler cache local:', e)
    }
  }

  function garantirCategoriaAtivaValida() {
    if (categorias.value.length === 0) return

    const existeAtual = categorias.value.some(c => c.id === categoriaAtiva.value)
    if (!existeAtual) {
      const pessoal = categoriasOrdenadas.value.find(
        c => c.nome.toLowerCase() === 'pessoal'
      )
      const escolhida = pessoal || categoriasOrdenadas.value[0]
      if (escolhida) {
        categoriaAtiva.value = escolhida.id
        localStorage.setItem(CAT_ATIVA_STORAGE_KEY, escolhida.id)
      }
    }
  }

  // Autenticação
  async function login(email: string, senha: string): Promise<boolean> {
    const emailLimpo = email.trim().toLowerCase()
    if (emailLimpo === EMAIL_AUTORIZADO.toLowerCase() && senha === SENHA_AUTORIZADA) {
      autenticado.value = true
      localStorage.setItem(AUTH_STORAGE_KEY, 'true')
      await inicializar()
      return true
    }
    return false
  }

  function logout() {
    autenticado.value = false
    localStorage.removeItem(AUTH_STORAGE_KEY)
    menuAberto.value = false
    limparTodosTimersLembretes()
  }

  // Inicialização e Sincronização
  async function inicializar() {
    if (!autenticado.value) {
      carregando.value = false
      return
    }

    carregando.value = true
    carregarCacheLocal()

    try {
      await sincronizarAgora()
      configurarRealtime()
      registrarListenersVisibilidade()
      await processarAcoesUrlNotificacao()
    } catch (error) {
      console.error('Erro ao inicializar:', error)
    } finally {
      carregando.value = false
    }
  }

  async function sincronizarAgora() {
    if (!autenticado.value) return
    sincronizando.value = true
    erroSincronizacao.value = null

    try {
      await carregarCategorias()
      await inicializarCategoriasPadrao()
      garantirCategoriaAtivaValida()
      await carregarNotas()
      salvarCacheLocal()
      reagendarTodosLembretes()
    } catch (err: any) {
      console.error('Erro ao sincronizar:', err)
      erroSincronizacao.value = 'Falha na sincronização com a nuvem'
    } finally {
      sincronizando.value = false
    }
  }

  function registrarListenersVisibilidade() {
    if (listenersRegistrados) return
    listenersRegistrados = true

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && autenticado.value) {
        sincronizarAgora()
      }
    })

    window.addEventListener('focus', () => {
      if (autenticado.value) {
        sincronizarAgora()
      }
    })

    window.addEventListener('online', () => {
      if (autenticado.value) {
        sincronizarAgora()
      }
    })
  }

  async function inicializarCategoriasPadrao() {
    if (categorias.value.length === 0) {
      await criarCategoria('Pessoal', '#3B82F6', true)
      await criarCategoria('Trabalho', '#F59E0B', true)
    }
  }

  async function carregarCategorias() {
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .order('ordem')

    if (error) {
      throw error
    }

    if (data) {
      categorias.value = data.map(mapearCategoriaDoBanco)
    }
  }

  async function carregarNotas() {
    const { data, error } = await supabase
      .from('notas')
      .select('*')
      .order('criado_em')

    if (error) {
      throw error
    }

    if (data) {
      notas.value = data.map(mapearNotaDoBanco)
    }
  }

  function configurarRealtime() {
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel)
    }

    realtimeChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categorias' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nova = mapearCategoriaDoBanco(payload.new)
            const exists = categorias.value.find(c => c.id === nova.id)
            if (!exists) {
              categorias.value.push(nova)
              garantirCategoriaAtivaValida()
            }
          } else if (payload.eventType === 'UPDATE') {
            const atualizada = mapearCategoriaDoBanco(payload.new)
            const index = categorias.value.findIndex(c => c.id === atualizada.id)
            if (index !== -1) {
              categorias.value[index] = atualizada
            }
          } else if (payload.eventType === 'DELETE') {
            categorias.value = categorias.value.filter(c => c.id !== payload.old.id)
            garantirCategoriaAtivaValida()
          }
          salvarCacheLocal()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notas' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nova = mapearNotaDoBanco(payload.new)
            const exists = notas.value.find(n => n.id === nova.id)
            if (!exists) {
              notas.value.push(nova)
              if (nova.lembrar?.ativo) {
                agendarTimerLembrete(nova)
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const atualizada = mapearNotaDoBanco(payload.new)
            const index = notas.value.findIndex(n => n.id === atualizada.id)
            if (index !== -1) {
              notas.value[index] = atualizada
            } else {
              notas.value.push(atualizada)
            }
            if (atualizada.lembrar?.ativo && !atualizada.concluidoEm) {
              agendarTimerLembrete(atualizada)
            } else {
              cancelarTimerLembrete(atualizada.id)
            }
          } else if (payload.eventType === 'DELETE') {
            cancelarTimerLembrete(payload.old.id)
            notas.value = notas.value.filter(n => n.id !== payload.old.id)
          }
          salvarCacheLocal()
        }
      )
      .subscribe()
  }

  // Operações de Notas
  async function criarNota(
    texto: string,
    prioridade: Prioridade = 'media',
    categoriaIdParam?: string
  ): Promise<Nota> {
    if (categorias.value.length === 0) {
      await carregarCategorias()
      await inicializarCategoriasPadrao()
    }
    garantirCategoriaAtivaValida()

    const id = uuidv4()
    const categoriaId = (categoriaIdParam && categorias.value.some(c => c.id === categoriaIdParam))
      ? categoriaIdParam
      : (categoriaAtiva.value || categorias.value[0]?.id || '')

    const notasDaPrioridade = notas.value.filter(n => n.prioridade === prioridade)
    const maxOrdem = notasDaPrioridade.length > 0
      ? Math.max(0, ...notasDaPrioridade.map(n => (typeof n.ordem === 'number' && !isNaN(n.ordem)) ? n.ordem : 0))
      : 0
    const ordem = maxOrdem + 1

    const nota: Nota = {
      id,
      categoriaId,
      texto: texto.trim(),
      prioridade,
      ordem,
      criadoEm: new Date()
    }

    const { error } = await supabase.from('notas').insert({
      id,
      categoria_id: nota.categoriaId,
      texto: nota.texto,
      prioridade: nota.prioridade,
      ordem: nota.ordem,
      criado_em: nota.criadoEm.toISOString()
    })

    if (error) {
      console.error('Erro ao criar nota no Supabase:', error)
      erroSincronizacao.value = 'Não foi possível salvar a nota na nuvem'
      throw error
    }

    if (!notas.value.some(n => n.id === id)) {
      notas.value.push(nota)
    }
    salvarCacheLocal()

    return nota
  }

  async function atualizarNota(id: string, updates: Partial<Nota>) {
    const updateData: any = {}
    if (updates.texto !== undefined) updateData.texto = updates.texto.trim()
    if (updates.prioridade !== undefined) updateData.prioridade = updates.prioridade
    if (updates.ordem !== undefined) updateData.ordem = updates.ordem
    if ('concluidoEm' in updates) {
      updateData.concluido_em = updates.concluidoEm ? updates.concluidoEm.toISOString() : null
    }
    if (updates.categoriaId !== undefined) updateData.categoria_id = updates.categoriaId

    const { error } = await supabase
      .from('notas')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Erro ao atualizar nota:', error)
      erroSincronizacao.value = 'Erro ao atualizar tarefa'
      return
    }

    const index = notas.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notas.value[index] = { ...notas.value[index], ...updates }
      if (notas.value[index].concluidoEm) {
        cancelarTimerLembrete(id)
      }
      salvarCacheLocal()
    }
  }

  async function reordenarNotasPrioridade(prioridade: Prioridade, novasNotasOrdenadas: Nota[]) {
    const promessas: Promise<any>[] = []

    novasNotasOrdenadas.forEach((nota, idx) => {
      const novaOrdem = idx
      const mudouPrioridade = nota.prioridade !== prioridade
      const indexGlobal = notas.value.findIndex(n => n.id === nota.id)

      if (indexGlobal !== -1) {
        notas.value[indexGlobal] = {
          ...notas.value[indexGlobal],
          prioridade,
          ordem: novaOrdem
        }
      }

      if (mudouPrioridade || nota.ordem !== novaOrdem) {
        promessas.push(
          supabase
            .from('notas')
            .update({ prioridade, ordem: novaOrdem })
            .eq('id', nota.id) as unknown as Promise<any>
        )
      }
    })

    salvarCacheLocal()
    if (promessas.length > 0) {
      await Promise.all(promessas)
    }
  }

  async function excluirNota(id: string) {
    cancelarTimerLembrete(id)
    const { error } = await supabase.from('notas').delete().eq('id', id)
    if (!error) {
      notas.value = notas.value.filter(n => n.id !== id)
      if (notificacaoToast.value?.id === id) {
        notificacaoToast.value = null
      }
      salvarCacheLocal()
    }
  }

  async function concluirNota(id: string) {
    cancelarTimerLembrete(id)
    if (notificacaoToast.value?.id === id) {
      notificacaoToast.value = null
    }
    await atualizarNota(id, { concluidoEm: new Date() })
  }

  async function restaurarNota(id: string) {
    await atualizarNota(id, { concluidoEm: undefined })
    const nota = notas.value.find(n => n.id === id)
    if (nota?.lembrar?.ativo) {
      agendarTimerLembrete(nota)
    }
  }

  // Operações de Categorias
  async function criarCategoria(nome: string, cor?: string, isDefault = false): Promise<Categoria> {
    const id = uuidv4()
    const maxOrdem = categorias.value.length > 0
      ? Math.max(0, ...categorias.value.map(c => c.ordem))
      : -1

    const categoria: Categoria = {
      id,
      nome: nome.trim(),
      cor: cor || '#3B82F6',
      ordem: maxOrdem + 1,
      isDefault
    }

    const { error } = await supabase.from('categorias').insert({
      id,
      nome: categoria.nome,
      cor: categoria.cor,
      ordem: categoria.ordem,
      is_default: isDefault
    })

    if (!error) {
      if (!categorias.value.some(c => c.id === id)) {
        categorias.value.push(categoria)
      }
      garantirCategoriaAtivaValida()
      salvarCacheLocal()
    }

    return categoria
  }

  async function atualizarCategoria(id: string, updates: Partial<Categoria>) {
    const updateData: any = {}
    if (updates.nome !== undefined) updateData.nome = updates.nome.trim()
    if (updates.cor !== undefined) updateData.cor = updates.cor
    if (updates.ordem !== undefined) updateData.ordem = updates.ordem

    const { error } = await supabase
      .from('categorias')
      .update(updateData)
      .eq('id', id)

    if (!error) {
      const index = categorias.value.findIndex(c => c.id === id)
      if (index !== -1) {
        categorias.value[index] = { ...categorias.value[index], ...updates }
        salvarCacheLocal()
      }
    }
  }

  async function excluirCategoria(id: string) {
    const categoria = categorias.value.find(c => c.id === id)
    if (categoria?.isDefault) return

    // Excluir notas vinculadas a esta categoria primeiro para evitar erro de FK
    await supabase.from('notas').delete().eq('categoria_id', id)
    const { error } = await supabase.from('categorias').delete().eq('id', id)

    if (!error) {
      categorias.value = categorias.value.filter(c => c.id !== id)
      notas.value = notas.value.filter(n => n.categoriaId !== id)
      garantirCategoriaAtivaValida()
      salvarCacheLocal()
    }
  }

  // Lembretes e Notificações
  async function definirLembrete(notaId: string, lembrete: Omit<Lembrete, 'id' | 'notaId'>) {
    const rawDate = lembrete.dataHora instanceof Date ? lembrete.dataHora : new Date(lembrete.dataHora)
    const validDate = isNaN(rawDate.getTime()) ? new Date(Date.now() + 60 * 60 * 1000) : rawDate
    const dataIso = validDate.toISOString()

    const updateData: any = {
      lembrar_ativo: true,
      lembrar_tipo: lembrete.tipo,
      lembrar_data_hora: dataIso,
      lembrar_recorrencia_tipo: lembrete.recorrencia?.tipo || null
    }

    const { error } = await supabase
      .from('notas')
      .update(updateData)
      .eq('id', notaId)

    if (error) {
      console.error('Erro ao definir lembrete:', error)
      throw error
    }

    const index = notas.value.findIndex(n => n.id === notaId)
    if (index !== -1) {
      const notaAtualizada: Nota = {
        ...notas.value[index],
        lembrar: {
          ...lembrete,
          dataHora: validDate,
          id: notaId,
          notaId,
          ativo: true
        }
      }
      notas.value[index] = notaAtualizada
      agendarTimerLembrete(notaAtualizada)
      salvarCacheLocal()
    }
  }

  async function removerLembrete(notaId: string) {
    cancelarTimerLembrete(notaId)

    const { error } = await supabase
      .from('notas')
      .update({
        lembrar_ativo: false,
        lembrar_tipo: null,
        lembrar_data_hora: null,
        lembrar_recorrencia_tipo: null
      })
      .eq('id', notaId)

    if (!error) {
      const index = notas.value.findIndex(n => n.id === notaId)
      if (index !== -1) {
        notas.value[index] = { ...notas.value[index], lembrar: undefined }
        salvarCacheLocal()
      }
    }
  }

  async function adiarLembrete(notaId: string, minutos = 10) {
    const nota = notas.value.find(n => n.id === notaId)
    if (!nota) return

    if (notificacaoToast.value?.id === notaId) {
      notificacaoToast.value = null
    }

    const novaDataHora = new Date(Date.now() + minutos * 60 * 1000)
    await definirLembrete(notaId, {
      tipo: nota.lembrar?.tipo || 'unico',
      dataHora: novaDataHora,
      ativo: true,
      recorrencia: nota.lembrar?.recorrencia
    })
  }

  function cancelarTimerLembrete(notaId: string) {
    const timer = timersLembretes.get(notaId)
    if (timer) {
      clearTimeout(timer)
      timersLembretes.delete(notaId)
    }
  }

  function limparTodosTimersLembretes() {
    for (const timer of timersLembretes.values()) {
      clearTimeout(timer)
    }
    timersLembretes.clear()
  }

  function reagendarTodosLembretes() {
    limparTodosTimersLembretes()
    for (const nota of notasAtivas.value) {
      if (nota.lembrar?.ativo) {
        agendarTimerLembrete(nota)
      }
    }
  }

  function agendarTimerLembrete(nota: Nota) {
    cancelarTimerLembrete(nota.id)
    if (!nota.lembrar?.ativo || nota.concluidoEm) return

    const alvo = new Date(nota.lembrar.dataHora).getTime()
    const delay = alvo - Date.now()

    // Se o lembrete venceu há menos de 1 hora e ainda está ativo, dispara imediatamente
    if (delay <= 0) {
      if (delay > -60 * 60 * 1000) {
        dispararNotificacao(nota)
      }
      return
    }

    // Limite máximo seguro para setTimeout (~24.8 dias)
    const delaySeguro = Math.min(delay, 2147483647)
    const timer = setTimeout(() => {
      const notaAtual = notas.value.find(n => n.id === nota.id)
      if (notaAtual && !notaAtual.concluidoEm && notaAtual.lembrar?.ativo) {
        dispararNotificacao(notaAtual)
      }
    }, delaySeguro)

    timersLembretes.set(nota.id, timer)
  }

  async function dispararNotificacao(nota: Nota) {
    notificacaoToast.value = nota

    // Tenta exibir notificação nativa do sistema/navegador
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration()
          if (reg && 'showNotification' in reg) {
            await reg.showNotification('OQueFazer - Lembrete', {
              body: nota.texto,
              icon: '/favicon.svg',
              badge: '/favicon.svg',
              tag: nota.id
            })
            return
          }
        }
        new Notification('OQueFazer - Lembrete', {
          body: nota.texto,
          icon: '/favicon.svg',
          tag: nota.id
        })
      } catch (e) {
        console.warn('Falha ao exibir notificação nativa:', e)
      }
    }

    // Se for recorrente, agenda o próximo ciclo; se for único, desativa no banco após disparo
    if (nota.lembrar?.tipo === 'recorrente' && nota.lembrar.recorrencia) {
      const proximaData = new Date(nota.lembrar.dataHora)
      if (nota.lembrar.recorrencia.tipo === 'diario') {
        proximaData.setDate(proximaData.getDate() + 1)
      } else if (nota.lembrar.recorrencia.tipo === 'semanal') {
        proximaData.setDate(proximaData.getDate() + 7)
      } else {
        const intervalo = nota.lembrar.recorrencia.intervaloMinutos || 60
        proximaData.setMinutes(proximaData.getMinutes() + intervalo)
      }
      await definirLembrete(nota.id, {
        ...nota.lembrar,
        dataHora: proximaData,
        ativo: true
      })
    } else {
      await removerLembrete(nota.id)
    }
  }

  async function processarAcoesUrlNotificacao() {
    const params = new URLSearchParams(window.location.search)
    const doneId = params.get('done')
    const snoozeId = params.get('snooze')

    if (doneId) {
      await concluirNota(doneId)
      window.history.replaceState({}, '', window.location.pathname)
    } else if (snoozeId) {
      await adiarLembrete(snoozeId, 10)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }

  function fecharToastNotificacao() {
    notificacaoToast.value = null
  }

  async function limparConcluidas() {
    const ids = notasConcluidas.value.map(n => n.id)
    if (ids.length === 0) return

    const { error } = await supabase.from('notas').delete().in('id', ids)
    if (!error) {
      notas.value = notas.value.filter(n => !n.concluidoEm)
      salvarCacheLocal()
    }
  }

  function selecionarCategoria(id: string) {
    categoriaAtiva.value = id
    localStorage.setItem(CAT_ATIVA_STORAGE_KEY, id)
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
    autenticado,
    categorias,
    notas,
    categoriaAtiva,
    viewMode,
    menuAberto,
    carregando,
    sincronizando,
    erroSincronizacao,
    notificacaoToast,

    // Computed
    categoriasOrdenadas,
    notasAtivas,
    notasConcluidas,
    notasPorPrioridade,
    categoriaAtual,
    contadorLembretes,

    // Ações
    login,
    logout,
    inicializar,
    sincronizarAgora,
    carregarDados: sincronizarAgora,
    criarNota,
    atualizarNota,
    reordenarNotasPrioridade,
    excluirNota,
    concluirNota,
    restaurarNota,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    definirLembrete,
    removerLembrete,
    adiarLembrete,
    fecharToastNotificacao,
    limparConcluidas,
    selecionarCategoria,
    toggleMenu,
    fecharMenu,
    setViewMode
  }
})
