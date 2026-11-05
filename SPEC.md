# OQueFazer - Especificação

## Conceito & Visão

Um gerenciador de tarefas minimalista e focado em prioridade. A filosofia é simples: **anotar rápido, priorizar visualmente, nunca esquecer**. Interface dark e limpa que não distrai — apenas organiza sua mente. O aplicativo funciona offline e emite notificações mesmo quando você está em outra aba.

## Design Language

### Direção Estética
Dark mode com acentos sutis de cor. Inspirado em interfaces de terminal modernas (Raycast, Arc). Nada de gradientes elaborados — formas planas, bordas sutis, foco em tipografia e espaçamento.

### Paleta de Cores
```
--bg-primary:      #0D0D0D    // Fundo principal
--bg-secondary:    #1A1A1A    // Cards, painéis
--bg-tertiary:     #262626    // Hover states
--bg-menu:         #141414    // Menu lateral

--text-primary:    #FAFAFA    // Texto principal
--text-secondary:  #8A8A8A    // Texto secundário
--text-muted:      #4D4D4D    // Placeholder, desabilitado

--accent-max:      #EF4444    // Prioridade Máxima (vermelho)
--accent-medium:   #F59E0B    // Prioridade Média (amarelo)
--accent-min:      #22C55E    // Prioridade Mínima (verde)
--accent-action:   #3B82F6    // Ações, botões primários
--accent-recall:   #A855F7    // Modo Lembrete rápido

--border:          #2A2A2A    // Bordas sutis
--shadow:          rgba(0,0,0,0.5)
```

### Tipografia
- **Família**: Inter (Google Fonts) — limpa, moderna, legível
- **Tamanhos**:
  - Header: 20px, semibold
  - Título de seção: 14px, semibold, uppercase, letter-spacing 0.05em
  - Nota: 15px, regular
  - Meta: 12px, regular
- **Fallback**: system-ui, -apple-system, sans-serif

### Sistema Espacial
- Base: 4px
- Padding padrão: 16px
- Gap entre notas: 8px
- Border-radius: 8px (cards), 6px (botões), 4px (inputs)

### Filosofia de Motion
Animações sutis e funcionais, nunca decorativas:
- Menu expand/collapse: 200ms ease-out
- Nota entrar: fade + slide-up, 150ms
- Hover: background 100ms
- Drag: elevação com shadow, transição suave
- Snooze toast: slide-up 200ms, auto-dismiss 3s

## Layout & Estrutura

### Arquitetura da Página
```
┌──────────────────────────────────────────────────────────┐
│  Header: Logo + Botão Modo Lembrete + Indicador áudio     │
├────────────────────────────────────────────┬─────────────┤
│                                            │  [MENU]     │
│   Área Principal                           │  ─────────  │
│   ┌─ Prioridade Máxima ─────────────┐      │  Pessoal    │
│   │  [Nota] [Nota] [Nota]           │      │  Trabalho   │
│   └─────────────────────────────────┘      │  ─────────  │
│   ┌─ Prioridade Média ─────────────┐      │  + Nova     │
│   │  [Nota] [Nota]                  │      │             │
│   └─────────────────────────────────┘      │  ─────────  │
│   ┌─ Prioridade Mínima ────────────┐      │  ✓ Concluídas│
│   │  [Nota]                        │      │             │
│   └─────────────────────────────────┘      │             │
│                                            │             │
│   [+ Nova Nota] (botão flutuante)          │             │
└────────────────────────────────────────────┴─────────────┘
```

### Responsividade
- **Desktop (>768px)**: Menu lateral direito fixo
- **Mobile (<768px)**: Menu como drawer (slide da direita), botão hamburger

## Features & Interações

### 1. Categorias (Menu Lateral)
- **Categorias fixas**: Pessoal, Trabalho
- **Criar categoria**: Botão "+ Nova" abre modal com nome e cor (opcional)
- **Selecionar categoria**: Clique alterna a categoria ativa, filtrando notas
- **Editar/Excluir**: Long-press ou menu de contexto (⋮)
- **Estado vazio**: "Nenhuma nota em [categoria]"

### 2. Notas
- **Criar**: Botão flutuante "+ Nova Nota" abre modal
- **Campos**: Texto (obrigatório), prioridade (padrão: média)
- **Entrada de texto**:
  - Digitar diretamente
  - Gravar áudio: botão 🎤 inicia gravação, para e transcreve
  - Combinar: pode digitar e depois adicionar áudio
- **Visualização**: Cards compactos com texto truncado em 2 linhas
- **Expandir**: Clique abre nota completa com todas as opções
- **Reordenar**: Drag & drop dentro da mesma prioridade
- **Mudar prioridade**: Dropdown ou drag para outra seção

### 3. Prioridades
- **Máxima**: Barra lateral vermelha (#EF4444), topo da lista
- **Média**: Barra lateral amarela (#F59E0B), meio
- **Mínima**: Barra lateral verde (#22C55E), final
- **Estado vazio**: "Sem tarefas com prioridade [nome]"

### 4. Lembretes
- **Criar**: Dentro de cada nota, botão "Lembrar-me"
- **Tipos de lembrete**:
  - **Único**: Selecionar data/hora, ou "daqui a X minutos" (5, 10, 15, 30, 60)
  - **Recorrente**: Diário (mesma hora), Semanal (dia específico), Customizado (intervalo)
- **Notificação**: Exibe "Você tem uma tarefa pendente" com título da nota
- **Ações na notificação**: "Marcar como feita" ou "Soneca 10min"

### 5. Modo Lembrete Rápido (Recall Mode)
- **Ativar**: Botão no header com ícone de 🔔
- **Fluxo**:
  1. Abre modal minimalista
  2. Campo para texto da tarefa (ou gravar áudio)
  3. Botões rápidos: "5min" "10min" "30min" "1h"
  4. Confirmar → notificação configurada
- **Visual quando ativo**: Header com destaque roxo (#A855F7)

### 6. Notas Concluídas
- **Arquivar automaticamente**: Ao clicar checkbox, nota move para seção "Concluídas"
- **Visualização**: Acessível pelo menu, lista simples com data de conclusão
- **Restaurar**: Botão para mover de volta
- **Excluir**: Botão para remover permanentemente
- **Limpar todas**: Botão para esvaziar lixeira

### 7. Áudio
- **Gravação**: Usa Web Speech API
- **Transcrição**: SpeechRecognition (idioma: pt-BR)
- **Feedback visual**: Pulsação no botão durante gravação, texto aparecendo em tempo real
- **Fallback**: Se transcrição falhar, mantém áudio gravado

### 8. Notificações
- **Permissão**: Solicitar no primeiro uso
- **Exibir**: Service Worker + Notification API
- **Sons**: Som padrão do sistema (configurável depois)
- **Badge**: Contador de tarefas pendentes no ícone

## Component Inventory

### Header
- **Default**: Logo à esquerda, botão 🔔 à direita, cor de fundo --bg-primary
- **Recall Mode**: Borda inferior roxa (#A855F7), badge de notificação se ativo

### MenuLateral
- **Collapsed**: Ícones فقط, 48px width
- **Expanded**: Ícones + texto, 240px width, --bg-menu
- **Item Default**: Ícone + texto, padding 12px 16px
- **Item Active**: Background --bg-tertiary, texto --text-primary
- **Item Hover**: Background --bg-secondary

### BotaoFlutuante
- **Default**: Círculo 56px, --accent-action, ícone + no header
- **Hover**: Scale 1.05, shadow elevation
- **Mobile**: Posição fixada bottom-right

### NotaCard
- **Default**: Background --bg-secondary, border-left 3px (cor da prioridade), padding 12px
- **Hover**: Background --bg-tertiary
- **Dragging**: Shadow elevada, opacity 0.9
- **States**: Badge se tem lembrete (ícone ⏰)

### NotaModal
- **Overlay**: Background rgba(0,0,0,0.8)
- **Content**: Background --bg-secondary, max-width 480px, padding 24px
- **Input texto**: Full-width, min-height 100px, border --border
- **Botoes**: Primário (--accent-action), Secundário (outline)

### PrioridadeSection
- **Header**: Texto uppercase, cor da barra lateral, collapse/expand toggle
- **Empty**: Texto muted, centralizado, padding 32px

### LembretePicker
- **Quick buttons**: Pills horizontais (5min, 10min, 30min, 1h)
- **Custom**: Input de data/hora com datetime-local
- **Recurrence**: Select com opções + toggle para ativar

### NotificacaoToast
- **Position**: Bottom-center, 24px do bottom
- **Style**: Background --bg-secondary, border --accent-recall, padding 12px 16px
- **Snooze buttons**: 5min, 10min inline

## Technical Approach

### Stack
- **Framework**: Vue 3 + Composition API + TypeScript
- **Build**: Vite
- **State**: Pinia
- **Persistência**: IndexedDB via Dexie.js
- **Drag & Drop**: vuedraggable (vue.draggable.next)
- **PWA**: vite-plugin-pwa (Service Worker, Web Manifest)
- **Notificações**: Notification API + Service Worker
- **Áudio**: Web Speech API (SpeechRecognition)

### Estrutura de Dados

```typescript
interface Categoria {
  id: string
  nome: string
  cor?: string
  ordem: number
  isDefault: boolean
}

interface Nota {
  id: string
  categoriaId: string
  texto: string
  audioBlob?: Blob
  prioridade: 'maxima' | 'media' | 'minima'
  ordem: number
  criadoEm: Date
  concluidoEm?: Date
  lembrar?: Lembrete
}

interface Lembrete {
  id: string
  notaId: string
  tipo: 'unico' | 'recorrente'
  dataHora: Date
  recorrencia?: {
    tipo: 'diario' | 'semanal' | 'customizado'
    intervalo?: number // minutos para customizado
    diasSemana?: number[] // para semanal
  }
  ativo: boolean
  ultimoDisparo?: Date
}
```

### API/Service Worker
- Service Worker registra eventos de notificação
- IndexedDB sincroniza estado local
- Background sync para lembretes (se suportado)

### PWA
- Manifest com ícone, tema, display standalone
- Service Worker para cache de assets
- Install prompt para adicionar à homescreen
