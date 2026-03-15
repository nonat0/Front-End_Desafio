# Dev Store

Aplicação de e-commerce utilizando React + Vite com consumo da [Fake Store API](https://fakestoreapi.com).
Com objetivo de desenvolver fundamentos imprescindíveis do Front-end tais como:

Consumo de API & Hooks;
Funcionalidades do Carrinho;
Organização e Componentização;
UX/Interface & Entrega;
---

##  Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Acessar no navegador
http://localhost:5173
```

---

## </> Estrutura do projeto

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

##  Funcionalidades implementadas

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
- Aba dedicada com grid de todos os produtos;
- Filtro por nome (busca com debounce) e categoria;
- Seleção visual com **borda verde** nos itens escolhidos;
- Limite de **3 produtos simultâneos apenas para apresentação da funcionalidade** com **modal de erro** na tela;
- Campo de **% de desconto** aplicado globalmente ao selecionar uma promoção;
- Preços promocionais refletidos em toda a loja (ProductCard, ProductDetail, CartDrawer);
- Carousel hero na Home alimentado pelos produtos em promoção;
- Fallback com 3 banners padrão quando sem promoções ativas;

### UX & Qualidade
- **Dark mode** toggle com persistência no localStorage;
- **Toasts** feedbacks visuais ao realizar ações como adicionar ao carrinho e à watchlist;
- **Modal** de erro ao tentar selecionar mais de 3 promoções;
- Micro-animações nos botões (efeito pop no clique);
- Carousel com auto-play, pause no hover e controles de navegação;
- Scrollbar customizada;
- Layout totalmente responsivo;
- Focus ring acessível na seção de gerenciamento de promoções;
---

## Stack tecnológica

| Tecnologia               | Uso                            |
|--------------------------|--------------------------------|
| React 18                 | Framework UI                   |
| Vite                     | Bundler e dev server           |
| React Router v6          | Roteamento SPA                 |
| Axios                    | Cliente HTTP com interceptors  |
| Context API + useReducer | Estado global                  |
| CSS Modules              | Estilização com escopo isolado |
| localStorage             | Persistência de estado         |
| Fake Store API           | Dados de produtos              |

 **Fontes:**
  <!-- ainda em testes -->

---

##  Extras implementados

-  Busca com debounce
-  Dark mode toggle
-  Animações de transição de página *(expansível com React Transition Group)*

---

##  Critérios de avaliação que já foram desenvolvidos

- Consumo de API & Hooks ------------> ✅ useProducts, useProductDetail, useDebounce, cache em memória 
- Funcionalidades do Carrinho -------> ✅ Drawer completo, quantidades, total em tempo real, localStorage 
- Organização e Componentização -----> ✅ Arquitetura em camadas, contextos separados, hooks customizados 
- UX/Interface & Entrega ------------> ✅ Loading states, toasts, modal, animações, dark mode, responsivo 

---

## O que será implementado nas próximas seções *(sujeito a mudança de planos)*

- **Checkout** — página de pagamento com formulário e integração de gateway
- **Autenticação** — login/cadastro e perfil de usuário
- **Rating por usuário** — avaliações com estrelas e comentários
- **Comentários** — sistema de reviews por produto
- **Notificações de preço** — alertas quando produto na watchlist entra em promoção
- **Paginação/Scroll infinito** — para grandes catálogos
- **Painel admin** — gerenciamento de produtos e promoções com 
