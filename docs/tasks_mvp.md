# Ponto Casa — Tasks MVP v1

> Arquivo de acompanhamento de progresso. Marcar `[x]` conforme concluído.
> Referência de padrões: `/Users/rafaelamorim/Documents/workspace/app-mercado`

---

## Fase 1 — Scaffolding e Infraestrutura

- [x] 1.1 Inicializar projeto Next.js com App Router, TypeScript, Tailwind, diretório `src/`
- [x] 1.2 Instalar e configurar shadcn/ui (init, tema padrão, `components.json`)
- [x] 1.3 Configurar PWA (`@serwist/next`): manifest.json, ícones, service worker, meta tags iOS
- [x] 1.4 Criar projeto Supabase (via CLI `supabase init`)
- [x] 1.5 Instalar `@supabase/supabase-js` e `@supabase/ssr`
- [x] 1.6 Configurar `.env.local` com variáveis do Supabase + Z-API
- [x] 1.7 Criar utilitários Supabase: `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`, `admin.ts`
- [x] 1.8 Criar `src/middleware.ts` para auth (redirecionar não-autenticados para `/login`)
- [x] 1.9 Layout shell: `src/app/layout.tsx` com viewport meta, PWA meta, globals Tailwind, Providers
- [ ] 1.10 Verificar instalabilidade PWA em dispositivo mobile
- [ ] 1.11 Configurar ESLint + Prettier + git hooks (husky/lint-staged)
- [x] 1.12 Repositório git já existia + `.gitignore` atualizado

**Entregável:** App shell vazio, instalável como PWA, Supabase conectado.

---

## Fase 2 — Schema do Banco, Auth OTP e Gestão de Dispositivos

### 2A — Migrations

- [x] 2.1 Migration: tabela `profiles` (id referenciando auth.users, name, phone, role, employer_id, is_active, onboarding_completed, created_at, updated_at)
- [x] 2.2 Migration: tabela `user_devices` (id, user_id, device_id UUID, device_name, device_type, browser, last_active_at, created_at; UNIQUE user_id+device_id)
- [x] 2.3 Migration: tabela `employer_invites` (id, employer_id, token UUID, invited_phone, invited_email, status, created_at, expires_at)
- [x] 2.4 Migration: tabela `connection_requests` (id, employee_id, employer_id, status, message, created_at, updated_at)
- [x] 2.5 Migration: tabela `work_schedules` (id, employee_id, start_time, lunch_start, lunch_end, end_time, valid_from, valid_until, created_at)
- [x] 2.6 Migration: tabela `time_entries` (id, employee_id, event_type CHECK, timestamp_server TIMESTAMPTZ, latitude, longitude, device_info, note, created_at)
- [x] 2.7 Migration: tabela `time_entry_audit` (id, entry_id, field_changed, previous_value, new_value, changed_by UUID, reason, changed_at) + trigger automático
- [x] 2.8 Migration: tabela `monthly_closings` (id, employee_id, month_ref, totais, aceite, UNIQUE employee_id+month_ref)
- [x] 2.9 Trigger `on_auth_user_created` → cria registro em `profiles` automaticamente
- [x] 2.10 Índices: todos criados na migration inicial

### 2B — RLS Policies

- [x] 2.11 RLS: `profiles` — usuário lê/edita próprio perfil; employer lê perfis dos seus employees
- [x] 2.12 RLS: `user_devices` — usuário só vê/gerencia seus próprios dispositivos
- [x] 2.13 RLS: `employer_invites` — employer CRUD próprios convites; qualquer autenticado pode SELECT por token
- [x] 2.14 RLS: `connection_requests` — employee cria request; employer do request pode SELECT/UPDATE status
- [x] 2.15 RLS: `time_entries` — employee INSERT/SELECT próprio; employer SELECT/UPDATE dos seus employees; sem DELETE
- [x] 2.16 RLS: `time_entry_audit` — SELECT para quem pode ver a entry; INSERT via trigger; sem UPDATE/DELETE
- [x] 2.17 RLS: `monthly_closings` — employer INSERT/UPDATE dos seus employees; employee SELECT + UPDATE aceite do próprio
- [x] 2.18 RLS: `work_schedules` — employer CRUD dos seus employees; employee SELECT próprio

### 2C — Auth OTP Custom (Z-API WhatsApp + Email)

- [x] 2.19 Migration: tabela `otp_codes` (incluída na migration inicial)
- [x] 2.20 API route `POST /api/auth/send-otp` — gera código, hash SHA-256, salva, envia via Z-API ou email, rate limit 3/10min
- [x] 2.21 Integração Z-API: `src/lib/zapi.ts` + `src/lib/otp.ts` (geração, hash, verificação)
- [x] 2.22 API route `POST /api/auth/verify-otp` — valida código, cria/autentica user via admin SDK, retorna magic link token
- [x] 2.23 Fallback: Z-API error retorna 502 com mensagem "Tente por email"
- [x] 2.24 Tela de login (`src/app/login/page.tsx`) — phone mask BR, toggle WhatsApp/email
- [x] 2.25 Tela de verificação OTP (`src/app/login/verify/page.tsx`) — 6 dígitos, auto-focus, paste, countdown, Suspense
- [x] 2.26 Hook `useAuth()` em `src/hooks/useAuth.tsx` — completo com AuthProvider, onAuthStateChange, registerDevice

### 2D — Gestão de Dispositivos

- [x] 2.24 Service `src/services/devices.ts` — registerDevice, updateLastActive, removeDevice, getUserDevices, isCurrentDevice, getCurrentDeviceId
- [x] 2.25 Detecção de device: userAgent → device_name, device_type, browser
- [x] 2.26 Auto-registro de dispositivo no login (via onAuthStateChange em useAuth)
- [ ] 2.27 Atualizar `last_active_at` periodicamente (em cada navegação ou a cada N minutos)

### 2E — Seed e Tipos

- [ ] 2.28 Seed: criar employer + employee de teste vinculados + work_schedule padrão
- [ ] 2.29 Gerar tipos TypeScript do schema: `supabase gen types typescript` → `src/types/database.ts`

**Entregável:** Auth OTP funciona (WhatsApp/email), sessão persiste, dispositivo registrado, tabelas com RLS.

---

## Fase 2.5 — Onboarding e Conexão Employer↔Employee

### Onboarding

- [x] 2.5.1 Tela de onboarding (`src/app/onboarding/page.tsx`) — steps name + role selection
- [x] 2.5.2 Step 1: Completar nome
- [x] 2.5.3 Step 2: Selecionar role — botões grandes com ícones (Briefcase/User)
- [x] 2.5.4 Step 3 (employer): Redireciona para /funcionarios após onboarding
- [ ] 2.5.5 Step 3 (employee): Tela com opções "Tenho um convite" ou "Solicitar conexão"
- [x] 2.5.6 Atualização de profile via Supabase client direto (sem API route separada)
- [x] 2.5.7 Redirect: root page e authenticated layout redirecionam para /onboarding se incompleto

### Employer: Convidar Employee

- [x] 2.5.8 Tela de funcionários (`src/app/(authenticated)/funcionarios/page.tsx`) — lista employees, convites pendentes, solicitações
- [x] 2.5.9 Convite: gera link + botão copiar + compartilhar via WhatsApp (wa.me deep link)
- [x] 2.5.10 Criação de invite via Supabase client (insert em employer_invites, token auto-gerado)
- [x] 2.5.11 Tela pública de convite (`src/app/convite/[token]/page.tsx`) — mostra employer, aceitar/recusar, redirect se não autenticado
- [x] 2.5.12 Accept: vincula employee ao employer + marca invite como accepted (client-side direto via RLS)
- [x] 2.5.13 Employer: ver convites pendentes + revogar

### Employee: Solicitar Conexão

- [ ] 2.5.14 Tela de busca de employer: campo de busca por nome ou telefone
- [ ] 2.5.15 API: `POST /api/connection-requests` — cria solicitação pendente
- [x] 2.5.16 Employer: solicitações pendentes exibidas na tela de funcionários com aceitar/rejeitar
- [x] 2.5.17 Employer: aceitar vincula employee (seta employer_id), rejeitar atualiza status
- [ ] 2.5.18 Employee: ver status da solicitação (pendente/aceita/rejeitada)

**Entregável:** Onboarding completo, employer convida via link/WhatsApp, employee solicita conexão.

---

## Fase 3 — Bater Ponto (Core)

- [x] 3.1 API route `POST /api/time-entries` — recebe event_type, lat/lng, device_info, note; usa `NOW()` para timestamp
- [x] 3.2 Validação de fluxo server-side (`src/lib/time-entry-validation.ts`): regras de fluxo, mensagens de erro, 422
- [x] 3.3 Tela principal (`src/app/(authenticated)/ponto/page.tsx`) — 4 botões grandes coloridos com ícones
- [x] 3.4 Estado client-side: fetch entries do dia, habilitar/desabilitar botões conforme próxima ação válida
- [x] 3.5 Captura opcional de geolocalização (timeout 5s, não bloqueia se negado)
- [x] 3.6 Captura de device info (`navigator.userAgent`, truncado 200 chars)
- [x] 3.7 Input opcional de observação (campo colapsável com chevron, max 200 chars)
- [x] 3.8 Feedback de confirmação: toast com "Entrada registrada às 08:03" (timestamp do servidor)
- [x] 3.9 Tratamento de erros: mensagem de validação, loading spinner nos botões, toast de erro de rede
- [x] 3.10 API route `GET /api/time-entries/today` — entries do dia para o employee autenticado

**Entregável:** Employee bate ponto com fluxo validado, feedback visual, geolocation opcional.

---

## Fase 4 — Histórico

- [x] 4.1 API route `GET /api/time-entries/month?month=YYYY-MM&employee_id=` — entries do mês, employer pode ver funcionários
- [x] 4.2 Tela histórico (`src/app/(authenticated)/historico/page.tsx`) — seletor de mês (setas) + tabela
- [x] 4.3 Formatação por dia: HH:mm São Paulo, borda âmbar para dias incompletos
- [x] 4.4 Fins de semana: cinza/opacidade, oculta no mobile se sem entries
- [x] 4.5 Coluna "Total": calcula horas trabalhadas descontando almoço
- [x] 4.6 Responsivo: tabela no desktop, cards no mobile (grid 4 colunas)
- [x] 4.7 Empregador: dropdown para selecionar funcionário

**Entregável:** Histórico mensal navegável com totais diários.

---

## Fase 5 — Edição e Auditoria

- [x] 5.1 API route `PATCH /api/time-entries/[id]` — employer-only, reason obrigatório, verifica mês fechado
- [x] 5.2 Trigger Postgres `AFTER UPDATE` (migration) + audit insert via API (dupla garantia)
- [x] 5.3 EditEntryDialog: horário atual (readonly), novo (time picker), observação, motivo obrigatório
- [x] 5.4 API route `GET /api/time-entries/[id]/audit` — com nome do autor da alteração
- [x] 5.5 AuditLog component: inline expansível na tabela, badge de campo, valor anterior→novo, motivo
- [x] 5.6 API POST `/api/time-entries/manual` + AddManualEntryDialog: tipo, data, hora, motivo obrigatório

**Entregável:** Employer corrige entradas com trail completo de auditoria.

---

## Fase 6 — Fechamento Mensal e Aceite Digital

- [ ] 6.1 API route `POST /api/closings/generate` — calcula total_hours, overtime, delays, absences a partir das entries do mês
- [ ] 6.2 Lógica de cálculo em `src/lib/calculations/hours.ts`: `calculateDailyHours()`, `calculateMonthSummary()` — pure functions
- [ ] 6.3 Testes unitários dos cálculos: dia normal, hora extra, atraso, saída antecipada, almoço sem retorno, falta, dia parcial
- [ ] 6.4 Tela fechamento (`src/app/(authenticated)/fechamento/page.tsx`) — seletor de mês, card resumo, tabela diária, botão gerar/recalcular (employer)
- [ ] 6.5 API route `POST /api/closings/[id]/accept` — employee confirma, seta accepted=true, accepted_at, accepted_by
- [ ] 6.6 UI de aceite: resumo + checkbox/botão "Confirmo que os horários acima correspondem à minha jornada", dialog de confirmação, badge de aceite
- [ ] 6.7 Lock de entries após aceite: PATCH verifica se mês está fechado, bloqueia edição
- [ ] 6.8 API route `POST /api/closings/[id]/reopen` — employer reabre mês com audit log

**Entregável:** Workflow completo de fechamento mensal com aceite digital e lock de entradas.

---

## Fase 7 — Exportação PDF

- [ ] 7.1 Instalar `@react-pdf/renderer`
- [ ] 7.2 Template PDF: header (logo, mês, nomes), tabela diária, resumo, status aceite, rodapé com data de geração
- [ ] 7.3 API route `GET /api/closings/[id]/pdf` — gera PDF server-side, retorna `application/pdf`
- [ ] 7.4 Botão "Exportar PDF" na tela de fechamento com loading state
- [ ] 7.5 Estilização para A4: margens, fontes, paginação adequada

**Entregável:** PDF do espelho mensal pronto para arquivamento.

---

## Fase 8 — Polish e Produção

- [ ] 8.1 Timezone: armazenar UTC, exibir em `America/Sao_Paulo`, lógica de fronteira de dia
- [ ] 8.2 Offline fallback PWA: cache do shell, banner "Você está offline", cache readonly do histórico
- [ ] 8.3 Loading/skeleton states com shadcn `Skeleton`
- [ ] 8.4 Empty states: "Nenhum registro neste mês", "Nenhum funcionário cadastrado"
- [ ] 8.5 Error boundary global (`error.tsx`) com mensagem amigável + retry
- [ ] 8.6 Navegação: tab bar inferior — Employee: Ponto, Histórico, Fechamento, Config; Employer: Ponto, Histórico, Fechamento, Funcionários, Config
- [ ] 8.7 Tela de configurações: ver/gerenciar dispositivos conectados (listar, remover), dados do perfil
- [ ] 8.8 Employer: gestão de employees na tela de funcionários (já criada em 2.5.8) — definir/editar horário de trabalho
- [ ] 8.9 Rate limiting no OTP já implementado na API (2.20); validar brute-force no verify (max 5 tentativas por código, lockout temporário após 10 falhas seguidas por phone/email)
- [ ] 8.10 Exibição do horário do servidor na tela de ponto (sync periódico)
- [ ] 8.11 Deploy Vercel: domínio, env vars, connection pooling Supabase

**Entregável:** App pronto para produção com UX polido e segurança.

---

## Grafo de Dependências

```
Fase 1 (Scaffolding)
  │
Fase 2 (Schema + Auth OTP + Devices)
  │
Fase 2.5 (Onboarding + Conexão)
  │
  ├── Fase 3 (Bater Ponto) ──→ Fase 4 (Histórico)
  │                                │
  │                          Fase 5 (Edição + Audit)
  │                                │
  └──────────────────────→ Fase 6 (Fechamento + Aceite)
                                   │
                             Fase 7 (PDF)
                                   │
                             Fase 8 (Polish)
```

- Fases 3 e 4 podem ser paralelas após Fase 2.5
- Fase 5 depende de Fase 4 (UI de histórico para modal de edição)
- Fase 6 depende de Fases 3+4
- Fase 8 pode rodar em paralelo com fases finais

---

**Total: 78 tasks across 9 phases**
