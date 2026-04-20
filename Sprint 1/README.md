# ◈ Desenvolve Store

Aplicação de e-commerce seguindo a trilha Front-End do **Projeto Desenvolve**, utilizando React + Vite com consumo da [Fake Store API](https://fakestoreapi.com).

---

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Acessar no navegador
http://localhost:5173
```

Para build de produção: `npm run build` (saída em `dist/`).

---

## Estrutura do projeto

```
src/
├── components/
│   ├── ui/           # Spinner, Modal, Toast, Carousel, ErrorBoundary
│   ├── layout/       # AppLayout, Navbar, Footer
│   ├── product/      # ProductCard, ProductGrid, ProductFilter
│   └── cart/
│       └── CartDrawer/   # CartDrawer + CartItem (sub-componente extraído)
├── context/          # Cart, Watchlist, Promotions, Toast, Theme, Search
│   ├── CartContext.jsx   # Provider + hook (lado React)
│   └── CartReducer.js    # Reducer puro (sem React) — testável isoladamente
├── hooks/            # useProducts, useProductDetail, useDebounce,
│                     #  useFetch (genérico), useLatestRef
├── pages/
│   ├── Home, ProductDetail, Watchlist, BlackFriday
│   └── Promotions/   # Promotions + PromoSection + PromoProductCard + ItemDiscountRow
├── router/           # React Router v6 + lazy() + Suspense + ErrorBoundary
├── services/
│   ├── api/          # client Axios (retry/backoff), products
│   ├── i18n/         # tradução EN → PT-BR (MyMemory + cache)
│   └── storage/      # wrapper de localStorage
├── styles/           # Variáveis CSS, globals, dark mode
└── utils/            # Formatters, constants, cache (TTL)
```

Cada pasta principal (`hooks`, `utils`, `context`, `components/ui`)
expõe um `index.js` (barrel) para imports agrupados:

```js
import { useProducts, useDebounce } from '@/hooks'
import { Modal, Spinner, ErrorBoundary } from '@/components/ui'
```

---

## Arquitetura — decisões principais

### Consumo de API

- **Cliente Axios centralizado** (`services/api/client.js`) com
  interceptor de **retry com backoff exponencial + jitter** para
  falhas transitórias (5xx, network errors, timeouts). Configurável
  via `API_RETRY` em `utils/constants.js`.
- **Cache TTL em memória** (`utils/cache.js`) — 5 min por padrão.
  Evita refetch em navegação rápida sem perder o frescor dos dados.
- **`useFetch` genérico** — encapsula `AbortController`,
  enum de status (`idle | loading | success | error`), integração
  com cache e flag `enabled` (para hooks dependentes de parâmetro,
  ex.: `useProductDetail(id)` só dispara quando `id` está pronto).
- **Cancelamento via `AbortController`** — propagado em todos os
  serviços (`getProducts({ signal })`, etc), elimina race conditions
  quando o usuário troca de filtro/página antes da resposta chegar.
- **Camada de i18n** (`services/i18n/`) — traduz títulos, descrições
  e categorias dos produtos EN → PT-BR via [MyMemory API](https://mymemory.translated.net/doc/spec.php)
  antes de devolver ao resto do app. Cache persistente em
  `localStorage` (primeira visita traduz tudo; as seguintes são
  instantâneas), concorrência controlada e fallback para o texto
  original em caso de falha/rate-limit — tradução é best-effort e
  nunca bloqueia a UI.

### Carrinho

- **Reducer puro extraído** para arquivo próprio (`CartReducer.js`)
  — 100% sem React, trivial de testar (`reducer(state, action)`).
- **Sincronização entre abas** via evento `storage` do `window`.
  Abrir o app em duas abas e adicionar item em uma reflete na outra.
- **Undo na remoção** — clicar no X de um item dispara um toast com
  botão "Desfazer" (5s). Implementado com `useLatestRef` para
  evitar **stale closure** no callback do toast.
- **Chave composta** (`makeCartKey(id, size)`) — produtos iguais com
  variantes diferentes (P vs M) viram linhas separadas no carrinho.
- **Confirmação para ações destrutivas** — "Limpar carrinho" passa
  por modal de confirmação.
- **Breakdown financeiro** no rodapé do drawer — Subtotal / Economia
  (em destaque) / Total — reforça o valor das promoções aplicadas.

### Roteamento e robustez

- **Code splitting por rota** via `React.lazy()` + `Suspense` —
  cada página vira um chunk JS separado; o usuário só baixa o que
  vai usar. Resultado visível no `npm run build`: chunks distintos
  para Home, ProductDetail, Watchlist, Promotions, BlackFriday.
- **`ErrorBoundary` global** envolvendo `<Outlet />` — exceções de
  render numa página NÃO derrubam a aplicação inteira: Navbar/Footer
  continuam, e o usuário recebe fallback amigável com "Tentar
  novamente" e "Voltar à Home".

### Componentização

- **Co-location** — JSX e CSS Module andam juntos no mesmo subdiretório.
- **Sub-componentes extraídos** quando o arquivo passa de ~200 linhas
  ou quando uma responsabilidade clara emerge:
  - `CartDrawer/` → `CartDrawer.jsx` + `CartItem.jsx`
  - `Promotions/` → `Promotions.jsx` + `PromoSection.jsx` + `PromoProductCard.jsx` + `ItemDiscountRow.jsx`

---

## Funcionalidades implementadas

### Loja

- Grid responsivo de produtos com cards componentizados
- Imagem, título truncado, preço formatado, rating e categoria
- Filtro por categoria via sidebar
- Ordenação: menor/maior preço, melhor avaliação, A–Z
- Busca por nome com debounce (integrada à Navbar)
- Skeleton loading durante chamadas de API
- Tratamento de erros com mensagens amigáveis e retry automático

### Navegação e Detalhes

- React Router v6 com roteamento por `/product/:id`, lazy-loaded
- Página de detalhes com descrição completa, rating visual, seleção
  de tamanho (quando aplicável) e meta-informações
- Breadcrumb de navegação

### Carrinho

- Drawer lateral (slide-in) com controle de quantidade
- Adicionar, remover (com **undo de 5s**) e atualizar quantidade
- **Sync entre abas** via `storage` event
- Total / Subtotal / Economia em tempo real, refletindo promoções
- Persistência no `localStorage`
- Modal de confirmação para "Limpar carrinho"
- Badge de contagem na Navbar

### Watchlist

- Lista de desejos acessível pelo menu
- Adicionar/remover com feedback visual (toast)
- Adicionar ao carrinho direto da Watchlist
- Persistência no `localStorage`
- Badge de contagem na Navbar

### Painel Admin (`/admin`)

- Dois canais de promoção: **Eventos** (sem limite, alimenta Black
  Friday) e **Pontuais** (até 3, alimenta carousel da Home)
- Aba dedicada com grid de todos os produtos
- Filtro por nome (busca com debounce) e categoria
- Seleção visual com borda verde nos itens escolhidos
- Modal de erro ao tentar exceder o limite (canal Pontuais)
- Desconto **individual por item** (0–50%) com modal de confirmação
- Preços promocionais refletidos em toda a loja (ProductCard,
  ProductDetail, CartDrawer)

### UX & Qualidade

- **Dark mode** toggle com persistência no localStorage
- **Toasts** de feedback (com botão de ação opcional para Undo)
- **ErrorBoundary** global — falha numa rota não quebra o app
- Micro-animações nos botões (efeito pop no clique)
- Carousel com auto-play, pause no hover e controles de navegação
- Scrollbar customizada
- Layout totalmente responsivo (mobile-first)
- Focus ring acessível

---

## Stack tecnológica

| Tecnologia | Uso |
|---|---|
| React 18 | Framework UI |
| Vite | Bundler e dev server |
| React Router v6 | Roteamento SPA + lazy loading |
| Axios | Cliente HTTP com retry/backoff |
| Context API + useReducer | Estado global (carrinho com reducer puro) |
| CSS Modules | Estilização com escopo isolado |
| localStorage + storage event | Persistência e sync entre abas |
| Fake Store API | Dados de produtos |
| MyMemory API | Tradução EN → PT-BR do catálogo |

**Fontes:** Syne (display) + DM Sans (corpo)

---

## Critérios do Projeto

| Critério | Implementação |
|---|---|
| Consumo de API & Hooks | `useFetch` genérico (AbortController + cache TTL + status enum), retry/backoff com jitter no Axios, hooks especializados (`useProducts`, `useProductDetail`, `useDebounce`, `useLatestRef`) |
| Funcionalidades do Carrinho | Drawer + CartItem extraído, undo via toast, sync entre abas, breakdown Subtotal/Economia/Total, chaves compostas para variantes (tamanho), modal de confirmação para clearCart, reducer puro testável |
| Organização e Componentização | Arquitetura em camadas (`components`/`context`/`hooks`/`pages`/`router`/`services`/`utils`), barrel files, co-location de JSX+CSS, sub-componentes extraídos quando crescem, `ErrorBoundary` + `lazy()`+`Suspense` no router, constantes centralizadas |
| UX/Interface & Entrega | Loading states, toasts com ação, modais de confirmação, animações, dark mode, responsivo, focus ring |

---

## Extras implementados

- Busca com debounce
- Dark mode toggle
- Sync de carrinho entre abas
- Undo na remoção do carrinho
- Code splitting por rota
- Retry automático com backoff exponencial nas chamadas da API
- ErrorBoundary global com fallback amigável
- Tradução automática do catálogo EN → PT-BR (MyMemory + cache em `localStorage`)

---
