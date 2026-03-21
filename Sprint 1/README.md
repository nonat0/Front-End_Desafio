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

---

## Estrutura do projeto

```
src/
├── components/
│   ├── ui/           # Spinner, Modal, Toast, Carousel
│   ├── layout/       # Navbar, AppLayout
│   ├── product/      # ProductCard, ProductGrid, ProductFilter
│   └── cart/         # CartDrawer
├── context/          # CartContext, WatchlistContext, PromotionsContext, ToastContext, ThemeContext
├── hooks/            # useProducts, useProductDetail, useDebounce
├── pages/            # Home, ProductDetail, Watchlist, Promotions
├── router/           # React Router v6
├── services/         # API client (Axios), localStorage
├── styles/           # Variáveis CSS, globals, dark mode
└── utils/            # Formatters, constants
```

---

## Funcionalidades implementadas

### Loja
- Grid responsivo de produtos com cards componentizados
- Imagem, título truncado, preço formatado, rating e categoria
- Filtro por categoria via sidebar
- Ordenação: menor/maior preço, melhor avaliação, A–Z
- Busca por nome com debounce (integrada à Navbar)
- Skeleton loading durante chamadas de API
- Tratamento de erros com mensagens amigáveis

### Navegação e Detalhes
- React Router v6 com roteamento por `/product/:id`
- Página de detalhes com descrição completa, rating visual e meta-informações
- Breadcrumb de navegação

### Carrinho
- Drawer lateral (slide-in) com controle de quantidade
- Adicionar, remover e atualizar quantidade de itens
- Total calculado em tempo real com preços promocionais
- Persistência no `localStorage`
- Badge de contagem na Navbar

### Watchlist
- Lista de desejos acessível pelo menu
- Adicionar/remover com feedback visual (toast)
- Adicionar ao carrinho direto da Watchlist
- Persistência no `localStorage`
- Badge de contagem na Navbar

### Promoções
- Aba dedicada com grid de todos os produtos
- Filtro por nome (busca com debounce) e categoria
- Seleção visual com **borda verde** nos itens escolhidos
- Limite de **3 produtos simultâneos** com **modal de erro** na tela
- Campo de **% de desconto** aplicado globalmente
- Preços promocionais refletidos em toda a loja (ProductCard, ProductDetail, CartDrawer)
- Carousel hero na Home alimentado pelos produtos em promoção
- Fallback com 3 banners padrão quando sem promoções ativas

### UX & Qualidade
- **Dark mode** toggle com persistência no localStorage
- **Toasts** de feedback ao adicionar ao carrinho e à watchlist
- **Modal** de erro ao tentar selecionar mais de 3 promoções
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
| React Router v6 | Roteamento SPA |
| Axios | Cliente HTTP com interceptors |
| Context API + useReducer | Estado global |
| CSS Modules | Estilização com escopo isolado |
| localStorage | Persistência de estado |
| Fake Store API | Dados de produtos |

**Fontes:** Syne (display) + DM Sans (corpo)

---

## Critérios do Projeto

| Critério | Implementação |
|---|---|
| Consumo de API & Hooks | useProducts, useProductDetail, useDebounce, cache em memória |
| Funcionalidades do Carrinho | Drawer completo, quantidades, total em tempo real, localStorage |
| Organização e Componentização | Arquitetura em camadas, contextos separados, hooks customizados |
| UX/Interface & Entrega | Loading states, toasts, modal, animações, dark mode, responsivo |

---

##  Extras implementados

- Busca com debounce
- Dark mode toggle

---