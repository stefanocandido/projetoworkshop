# Gooday — Banco de Dados (Supabase)

Projeto alvo: **`dyssuzpzivyeldqinhbe`** (https://supabase.com/dashboard/project/dyssuzpzivyeldqinhbe)

**Status: ✅ Aplicado no banco real**, via MCP oficial do Supabase (`.mcp.json` na raiz do projeto). 27 tabelas, RLS, triggers e buckets estão ativos em produção.

## O que existe aqui

```
supabase/
├── migrations/
│   ├── 0001_extensions_and_types.sql       Enums + extensões (pgcrypto, pg_cron)
│   ├── 0002_profiles.sql                   profiles + trigger de criação automática
│   ├── 0003_interests_follows_groups.sql   interests, follows, groups, group_members
│   ├── 0004_stories_media_posts.sql        stories, media, posts, post_media/tags/mentions
│   ├── 0005_engagement.sql                 comments, likes, reactions, bookmarks, story_views/replies
│   ├── 0006_messages_notifications_settings.sql  conversations, messages, notifications, settings
│   ├── 0007_counters_and_notification_triggers.sql  contadores em cache + notificações automáticas
│   ├── 0008_rls_helper_functions.sql       funções auxiliares (is_following, can_view_post, ...)
│   ├── 0009_rls_policies.sql               RLS em todas as 27 tabelas
│   ├── 0010_storage_buckets.sql            buckets (avatars, covers, posts-media, stories-media, messages-media)
│   ├── 0011_security_hardening.sql         fixa search_path + revoga EXECUTE de funções internas
│   └── 0012_rls_performance_and_indexes.sql  (select auth.uid()), remove policy duplicada, 17 índices de FK
├── seed/
│   └── seed.mjs                            popula usuários/posts/stories/grupos reais de exemplo
├── apply-migrations.sh                     alternativa via psql (não usada — aplicado via MCP)
├── run-migrations.mjs                      alternativa via Node+pg (não usada — aplicado via MCP)
└── README.md                               este arquivo
```

## Como foi aplicado

Via **connector MCP oficial do Supabase** (`@supabase/mcp-server-supabase`), configurado em `.mcp.json` na raiz do projeto (`gooday-projeto-completo/`), autenticado com um Personal Access Token da conta Supabase. Todas as 12 migrations rodaram direto no banco de produção, e o linter de segurança/performance do próprio Supabase (`get_advisors`) foi usado para validar o resultado:

- **Segurança:** 0 problemas reais — restam só 6 avisos esperados (funções auxiliares de RLS que precisam ficar executáveis por `anon`/`authenticated` para as próprias policies funcionarem; todas retornam só boolean, sem vazar dado).
- **Performance:** 0 problemas — 69 policies que reavaliavam `auth.uid()` por linha foram corrigidas para `(select auth.uid())`, 1 policy duplicada em `group_interests` foi dividida, e 17 índices de foreign key faltantes foram criados.

## Diferenças em relação ao Prisma schema original

1. **Sem tabela `Account`** — autenticação usa `auth.users` do Supabase Auth (nativo). A tabela `profiles` referencia `auth.users(id)` e é criada automaticamente via trigger no signup.
2. **Contadores em cache** — adicionei `likes_count`, `comments_count`, `reactions_count`, `bookmarks_count` em `posts`; `followers_count`/`following_count`/`posts_count` em `profiles`; `members_count` em `groups`; `views_count` em `stories`. Mantidos atualizados via triggers, evita `COUNT()` a cada render do feed.
3. **Storage buckets** — adicionados (não existem no Prisma schema, que só modela metadados). Substituem os placeholders quebrados por uploads reais.

## Se precisar reaplicar do zero (novo projeto Supabase, por exemplo)

### Opção A — MCP (recomendado, é como foi feito aqui)

Com `.mcp.json` configurado e `SUPABASE_ACCESS_TOKEN` válido, peça para aplicar cada arquivo de `migrations/` em ordem via `apply_migration`.

### Opção B — Supabase SQL Editor (sem instalar nada)

Abra **SQL Editor** no dashboard e cole o conteúdo de cada arquivo em `migrations/`, **na ordem numérica** (0001 → 0012), rodando um de cada vez.

### Opção C — via Node + pg (sem CLI/psql)

Preencha `DATABASE_URL` no `.env` (Settings → Database → Connection string → URI) e rode:

```bash
npm run db:migrate
```

## Popular com dados de exemplo (opcional, recomendado para testar)

Preencha `SUPABASE_SERVICE_ROLE_KEY` no `.env` (Settings → API → service_role — nunca vai para a Vercel nem para o código do app) e rode:

```bash
npm run db:seed
```

Cria 4 usuários demo (`gooday123` como senha), posts com imagens (Lorem Picsum), stories ativos, grupos e relações de follow.

## Realtime (opcional, para feed/chat ao vivo)

No dashboard: **Database → Replication**, habilite replication para `posts`, `likes`, `comments`, `messages`, `notifications`.

## Segurança — nunca esqueça

- `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL` e o `SUPABASE_ACCESS_TOKEN` do `.mcp.json` **nunca** vão para a Vercel nem para o código do app React — ficam só em arquivos locais (`.env`, `.mcp.json`), ambos no `.gitignore`.
- Na Vercel, configure **apenas**: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ou o `sb_publishable_...` mais novo).
- Todas as 27 tabelas têm RLS habilitada — sem policy explícita, acesso é negado por padrão.

## Ordem de dependência (caso precise reaplicar manualmente)

`auth.users` (Supabase) → `profiles` → `interests`/`follows`/`groups` → `stories`/`media`/`posts` → `comments`/`likes`/`reactions`/`bookmarks` → `conversations`/`messages`/`notifications`/`settings` → funções/triggers → RLS → storage.
