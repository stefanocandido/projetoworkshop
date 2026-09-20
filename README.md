# Gooday — Plataforma Social Moderna

Uma rede social moderna construída com **React 18 + Vite + Tailwind CSS v4**, convertida de um design system completo para um aplicativo totalmente funcional, responsivo e mobile-first.

## 🚀 Quick Start

```bash
# Instalar dependências
npm install

# Rodar servidor de desenvolvimento
npm run dev

# Acessar no navegador
http://localhost:5173/
```

## 📱 Features Implementadas

### Telas Completas
- ✅ **Login** — Autenticação com email/senha + login social
- ✅ **Home** — Feed de posts, stories, grupos recomendados
- 🔄 **Discover** — (Em progresso)
- 🔄 **Messages** — (Em progresso)
- 🔄 **Groups** — (Em progresso)
- 🔄 **Profile** — (Em progresso)
- 🔄 **Settings** — (Em progresso)

### Componentes & Interações
- ✅ Like/unlike posts com contador
- ✅ Stories carousel (móvel + desktop)
- ✅ Grupos recomendados (rail desktop / carousel mobile)
- ✅ Navegação responsiva (Sidebar desktop / Tab bar mobile)
- ✅ Header com notificações e avatar
- ✅ Feed cards com imagens de alta qualidade

## 🎨 Design System

Baseado em design system próprio com especificações completas:

### Paleta de Cores
- **Accent (Teal):** #3DBCA8 — Botões primários, navegação ativa
- **Secondary (Lilás):** #C18BE7 — Botões secundários, destaques
- **Neutral:** 0–950 — Textos, fundos, bordas
- **Funcionais:** Verde (success), Âmbar (warning), Vermelho (error), Azul (info)

### Tipografia
- **Fonte:** Inter, fallback system-ui
- **Pesos:** 400 (conteúdo), 500 (controles), 600 (subtítulos), 700 (títulos)
- **Escalas:** 11px–56px (xs–5xl)

### Espaçamento & Radius
- **Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
- **Radius:** 6px–999px (xs–full)

## 🏗️ Arquitetura

```
src/
├── screens/              # Telas/páginas principais
│   ├── Login.tsx        # Formulário de autenticação
│   └── Home.tsx         # Feed principal
├── components/          # Componentes reutilizáveis
│   ├── Header.tsx       # Navbar superior
│   ├── Sidebar.tsx      # Nav lateral (desktop)
│   ├── TabBar.tsx       # Nav inferior (mobile)
│   ├── FeedCard.tsx     # Card individual de post
│   ├── StoryCarousel.tsx # Stories horizontais
│   └── GroupsRail.tsx   # Grupos/pessoas
├── index.css            # Tailwind + CSS variables
└── styles.css           # Utility classes customizadas
```

## 📦 Stack Tecnológico

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Runtime | Node.js | v24.21.0 |
| Package Manager | npm | 11.19.0 |
| Bundler | Vite | v8.3.0 |
| Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | v4.3.3 |
| CSS Processor | PostCSS | + @tailwindcss/postcss |

## 🎯 Responsividade

**Mobile-First Approach:**
- **Mobile:** 0–767px (2 colunas, full-width)
- **Tablet:** 768px+ (6 colunas, margens 24px)
- **Desktop:** 1024px+ (12 colunas, margens 32px)

Todos os componentes reajustam automaticamente entre mobile e desktop.

## 🔧 Comandos

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Compila para produção (dist/)
npm run preview   # Preview da build
npm run lint      # Lint TypeScript
```

## 📂 Estrutura de Pastas

```
gooday-app/
├── src/
│   ├── App.tsx              # Componente raiz
│   ├── main.tsx             # Entry point
│   ├── index.css            # Estilos base
│   ├── styles.css           # Classes customizadas
│   ├── screens/             # Telas principais
│   ├── components/          # Componentes reutilizáveis
│   └── assets/              # (Se houver assets locais)
├── public/
│   └── assets/              # 33 imagens do projeto original
├── package.json
├── vite.config.ts
├── tsconfig.json
├── postcss.config.js
└── README.md
```

## 📊 Assets

**33 imagens de alta qualidade** copiadas do projeto original:
- Avatares (usuários, grupos)
- Fotos de posts (lifestyle, conteúdo)
- Background login

Localizadas em `public/assets/` e carregadas como URLs relativas.

## 🚦 Estado & Navegação

### App (Autenticação Global)
```typescript
- isAuthenticated: boolean
- handleLogin() → Home
- handleLogout() → Login
```

### Home (Navegação de Features)
```typescript
- activeTab: 'home' | 'discover' | 'messages' | 'groups' | 'profile'
- feedItems: Post[]
- handleLike(postId)
```

## 🎯 Fluxos Principais

### Fluxo 1: Autenticação
1. User na tela Login
2. Insere email + senha
3. Clica "Entrar"
4. Transição para Home

### Fluxo 2: Feed (Desktop)
1. Header com logo + ações
2. Sidebar com 6 destinos
3. Feed central com 3+ posts
4. Rail direita com 5 grupos
5. Like funcional em tempo real

### Fluxo 3: Feed (Mobile)
1. Header compacto
2. Stories carousel
3. Feed em coluna única
4. Groups carousel
5. Tab bar inferior com 5 abas

## 🔮 Roadmap

### MVP (Atual)
- [x] Login screen
- [x] Home feed (desktop + mobile)
- [x] Header com logout
- [x] Stories
- [x] Like posts
- [x] Grupos recomendados

### Phase 2 (Próximo)
- [ ] Signup screen
- [ ] Discover/Search
- [ ] Messages
- [ ] Groups detail
- [ ] Profile view
- [ ] Settings
- [ ] Story viewer (full-screen)

### Phase 3 (Futuro)
- [ ] Create post (sheet)
- [ ] Comments (sheet)
- [ ] User profiles (modal)
- [ ] Follow/unfollow
- [ ] Notifications
- [ ] Real auth (API)
- [ ] Dark mode
- [ ] Persistência (localStorage/API)

## 📖 Documentação

Consulte [SETUP-REPORT.md](SETUP-REPORT.md) para detalhes completos de:
- Ambiente e ferramentas
- Design system
- Componentes
- Build & deploy

## 💡 Dicas de Desenvolvimento

### Adicionar novo componente
```typescript
// src/components/MyComponent.tsx
interface MyComponentProps {
  prop1: string
}

export default function MyComponent({ prop1 }: MyComponentProps) {
  return <div>{prop1}</div>
}
```

### Usar CSS variables
```typescript
<div style={{ color: 'var(--accent-500)' }}>Text</div>
```

### Usar utility classes customizadas
```html
<button class="btn-primary">Click</button>
<input class="input" placeholder="Enter..." />
<div class="bg-neutral-100 text-accent-700">Content</div>
```

## 🐛 Troubleshooting

**Port 5173 já em uso?**
```bash
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9
npm run dev
```

**Erro ao importar módulo?**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**Cache Vite?**
```bash
rm -rf .vite
npm run dev
```

## 📞 Suporte

Para dúvidas sobre componentes, design system ou setup, consulte:
- SETUP-REPORT.md — Configuração completa
- src/components/ — Exemplos de componentes
- src/styles.css — Classes disponíveis

---

**Desenvolvido com** ❤️ **React + Tailwind + Vite**  
**Design System:** Gooday Brand Guidelines  
**Status:** Ready for Development ✅


