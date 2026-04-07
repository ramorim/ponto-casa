# Ponto Casa — Tasks MVP v1

> Arquivo de acompanhamento de progresso. Marcar `[x]` conforme concluído.
> Referência de padrões: `/Users/rafaelamorim/Documents/workspace/app-mercado`

---

## Fase 1 — Scaffolding e Infraestrutura

- [ ] 1.1 Inicializar projeto Next.js com App Router, TypeScript, Tailwind, diretório `src/`
- [ ] 1.2 Instalar e configurar shadcn/ui (init, tema padrão, `components.json`)
- [ ] 1.3 Configurar PWA (`next-pwa` ou `@serwist/next`): manifest.json, ícones, service worker, meta tags iOS
- [ ] 1.4 Criar projeto Supabase (via CLI `supabase init` + dashboard): anotar URL + anon key + service role key
- [ ] 1.5 Instalar `@supabase/supabase-js` e `@supabase/ssr`
- [ ] 1.6 Configurar `.env.local` com variáveis do Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [ ] 1.7 Criar utilitários Supabase: `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- [ ] 1.8 Criar `src/middleware.ts` para auth (redirecionar não-autenticados para `/login`)
- [ ] 1.9 Layout shell: `src/app/layout.tsx` com viewport meta, PWA meta, globals Tailwind
- [ ] 1.10 Verificar instalabilidade PWA em dispositivo mobile
- [ ] 1.11 Configurar ESLint + Prettier + git hooks (husky/lint-staged)
- [ ] 1.12 Inicializar repositório git + `.gitignore`

**Entregável:** App shell vazio, instalável como PWA, Supabase conectado.

---

## Fase 2 — Schema do Banco, Auth OTP e Gestão de Dispositivos

### 2A — Migrations

- [ ] 2.1 Migration: tabela `profiles` (id referenciando auth.users, name, phone, role CHECK('employer','employee'), employer_id referenciando profiles, is_active, onboarding_completed, created_at, updated_at)
- [ ] 2.2 Migration: tabela `user_devices` (id, user_id, device_id UUID, device_name, device_type, browser, last_active_at, created_at; UNIQUE user_id+device_id) — padrão app-mercado
- [ ] 2.3 Migration: tabela `employer_invites` (id, employer_id, token UUID único, invited_phone, invited_email, status CHECK('pending','accepted','expired','revoked'), created_at, expires_at)
- [ ] 2.4 Migration: tabela `connection_requests` (id, employee_id, employer_id, status CHECK('pending','accepted','rejected'), message, created_at, updated_at)
- [ ] 2.5 Migration: tabela `work_schedules` (id, employee_id, start_time, lunch_start, lunch_end, end_time, valid_from, valid_until, created_at)
- [ ] 2.6 Migration: tabela `time_entries` (id, employee_id, event_type CHECK('entrada','saida_almoco','volta_almoco','saida'), timestamp_server TIMESTAMPTZ, latitude, longitude, device_info, note, created_at)
- [ ] 2.7 Migration: tabela `time_entry_audit` (id, entry_id, field_changed, previous_value, new_value, changed_by UUID, reason, changed_at)
- [ ] 2.8 Migration: tabela `monthly_closings` (id, employee_id, month_ref, total_hours, overtime_hours, delay_minutes, absence_days, notes, employee_accepted, accepted_at, accepted_by, created_by, UNIQUE employee_id+month_ref, created_at)
- [ ] 2.9 Trigger `on_auth_user_created` → cria registro em `profiles` automaticamente (com dados do metadata)
- [ ] 2.10 Índices: (employee_id, timestamp_server) em time_entries; (employer_id) em profiles; (token) em employer_invites

### 2B — RLS Policies

- [ ] 2.11 RLS: `profiles` — usuário lê/edita próprio perfil; employer lê perfis dos seus employees
- [ ] 2.12 RLS: `user_devices` — usuário só vê/gerencia seus próprios dispositivos
- [ ] 2.13 RLS: `employer_invites` — employer CRUD próprios convites; qualquer autenticado pode SELECT por token
- [ ] 2.14 RLS: `connection_requests` — employee cria request; employer do request pode SELECT/UPDATE status
- [ ] 2.15 RLS: `time_entries` — employee INSERT/SELECT próprio; employer SELECT/UPDATE dos seus employees; sem DELETE
- [ ] 2.16 RLS: `time_entry_audit` — SELECT para quem pode ver a entry; INSERT via trigger; sem UPDATE/DELETE
- [ ] 2.17 RLS: `monthly_closings` — employer INSERT/UPDATE dos seus employees; employee SELECT + UPDATE aceite do próprio
- [ ] 2.18 RLS: `work_schedules` — employer CRUD dos seus employees; employee SELECT próprio

### 2C — Auth OTP Custom (Z-API WhatsApp + Email)

- [ ] 2.19 Migration: tabela `otp_codes` (id, phone_or_email, code_hash, type CHECK('whatsapp','email'), expires_at, verified BOOLEAN DEFAULT FALSE, attempts INTEGER DEFAULT 0, created_at)
- [ ] 2.20 API route `POST /api/auth/send-otp` — gera código 6 dígitos, hash com bcrypt, salva em `otp_codes` (expira em 5 min), envia via Z-API (WhatsApp) ou email (Resend/Supabase SMTP). Rate limit: max 3 envios por phone/email a cada 10 min
- [ ] 2.21 Integração Z-API: service `src/lib/zapi.ts` — chamada REST para enviar mensagem WhatsApp com o código OTP. Variáveis env: `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_API_URL`
- [ ] 2.22 API route `POST /api/auth/verify-otp` — valida código (compara hash, checa expiração, max 5 tentativas), se válido: busca/cria usuário no Supabase Auth (via admin SDK com `signUp`/`signInWithPassword` usando email=`{phone}@pontocasa.app` + senha gerada), retorna sessão
- [ ] 2.23 Fallback: se Z-API falhar, oferecer envio por email (Supabase built-in email OTP ou Resend)
- [ ] 2.24 Tela de login (`src/app/login/page.tsx`) — campo phone com máscara BR (+55), toggle para email, botão "Enviar código"
- [ ] 2.25 Tela de verificação OTP (`src/app/login/verify/page.tsx`) — input 6 dígitos com auto-focus, countdown para reenvio, feedback de erro
- [ ] 2.26 Hook `useAuth()` em `src/hooks/useAuth.tsx` — user, profile, isAuthenticated, sendOtp(), verifyOtp(), signOut(); listener `onAuthStateChange` que chama `registerDevice()` (padrão app-mercado)

### 2D — Gestão de Dispositivos

- [ ] 2.24 Service `src/services/devices.ts` — `registerDevice()`, `updateLastActive()`, `removeDevice()`, `getUserDevices()`, `isCurrentDevice()`; device_id persistido em localStorage (padrão app-mercado: gera UUID na primeira visita)
- [ ] 2.25 Detecção de device: parsear userAgent para device_name (iPhone, Android, Mac, Windows), device_type (mobile/tablet/desktop), browser (Chrome, Safari, Firefox)
- [ ] 2.26 Auto-registro de dispositivo no login (chamado via `onAuthStateChange` em SIGNED_IN e TOKEN_REFRESHED)
- [ ] 2.27 Atualizar `last_active_at` periodicamente (em cada navegação ou a cada N minutos)

### 2E — Seed e Tipos

- [ ] 2.28 Seed: criar employer + employee de teste vinculados + work_schedule padrão
- [ ] 2.29 Gerar tipos TypeScript do schema: `supabase gen types typescript` → `src/types/database.ts`

**Entregável:** Auth OTP funciona (WhatsApp/email), sessão persiste, dispositivo registrado, tabelas com RLS.

---

## Fase 2.5 — Onboarding e Conexão Employer↔Employee

### Onboarding

- [ ] 2.5.1 Tela de onboarding (`src/app/onboarding/page.tsx`) — exibida após primeiro login se `onboarding_completed = false`
- [ ] 2.5.2 Step 1: Completar nome (se não veio do auth metadata)
- [ ] 2.5.3 Step 2: Selecionar role — "Sou Empregador(a)" ou "Sou Empregado(a)" — botões grandes com ícones
- [ ] 2.5.4 Step 3 (employer): Tela de boas-vindas + opção de convidar primeiro employee
- [ ] 2.5.5 Step 3 (employee): Tela com opções "Tenho um convite" (inserir código/link) ou "Solicitar conexão" (buscar employer por nome/phone)
- [ ] 2.5.6 API: `PATCH /api/profile/onboarding` — atualiza role e marca `onboarding_completed = true`
- [ ] 2.5.7 Middleware: redirecionar para `/onboarding` se autenticado mas `onboarding_completed = false`

### Employer: Convidar Employee

- [ ] 2.5.8 Tela de funcionários (`src/app/(authenticated)/funcionarios/page.tsx`) — lista de employees vinculados + botão "Convidar"
- [ ] 2.5.9 Modal/tela de convite: gera link compartilhável (`/convite/{token}`) + opção de enviar via WhatsApp (deep link `whatsapp://send?text=...`) ou copiar link
- [ ] 2.5.10 API: `POST /api/invites` — cria registro em `employer_invites` com token UUID, expires_at (7 dias)
- [ ] 2.5.11 Tela pública de convite (`src/app/convite/[token]/page.tsx`) — mostra nome do employer, botão "Aceitar convite" (redireciona para login/signup se não autenticado)
- [ ] 2.5.12 API: `POST /api/invites/[token]/accept` — valida token, vincula employee ao employer (seta `employer_id` no profile), marca invite como accepted
- [ ] 2.5.13 Employer: ver convites pendentes e poder revogar

### Employee: Solicitar Conexão

- [ ] 2.5.14 Tela de busca de employer: campo de busca por nome ou telefone
- [ ] 2.5.15 API: `POST /api/connection-requests` — cria solicitação pendente
- [ ] 2.5.16 Employer: notificação/badge de solicitações pendentes na tela de funcionários
- [ ] 2.5.17 Employer: aceitar/rejeitar solicitação → se aceito, vincula employee (seta `employer_id`)
- [ ] 2.5.18 Employee: ver status da solicitação (pendente/aceita/rejeitada)

**Entregável:** Onboarding completo, employer convida via link/WhatsApp, employee solicita conexão.

---

## Fase 3 — Bater Ponto (Core)

- [ ] 3.1 API route `POST /api/time-entries` — recebe event_type, lat/lng, device_info, note; usa `NOW()` para timestamp
- [ ] 3.2 Validação de fluxo server-side: consultar último registro do dia, bloquear sequência inválida (422 com mensagem clara)
- [ ] 3.3 Tela principal (`src/app/(authenticated)/page.tsx`) — 4 botões grandes: Entrada, Saída Almoço, Volta Almoço, Saída
- [ ] 3.4 Estado client-side: fetch entries do dia, habilitar/desabilitar botões conforme próxima ação válida
- [ ] 3.5 Captura opcional de geolocalização (`navigator.geolocation`) — não bloquear punch se negado/timeout
- [ ] 3.6 Captura de device info (`navigator.userAgent`)
- [ ] 3.7 Input opcional de observação (campo colapsável, max 200 chars)
- [ ] 3.8 Feedback de confirmação: toast com "Entrada registrada às 08:03" (timestamp do servidor)
- [ ] 3.9 Tratamento de erros: rede (retry), validação (mensagem), loading state nos botões
- [ ] 3.10 API route `GET /api/time-entries/today` — entries do dia para o employee autenticado

**Entregável:** Employee bate ponto com fluxo validado, feedback visual, geolocation opcional.

---

## Fase 4 — Histórico

- [ ] 4.1 API route `GET /api/time-entries/month?month=YYYY-MM` — entries do mês agrupadas por dia
- [ ] 4.2 Tela histórico (`src/app/(authenticated)/historico/page.tsx`) — seletor de mês + tabela (Data, Entrada, Almoço, Retorno, Saída)
- [ ] 4.3 Formatação por dia: HH:mm em timezone São Paulo, destaque para dias incompletos
- [ ] 4.4 Tratamento de fins de semana: cinza, mostrar se houver entries
- [ ] 4.5 Coluna "Total" com horas trabalhadas no dia
- [ ] 4.6 Design responsivo: scroll horizontal ou layout card em telas estreitas
- [ ] 4.7 Employer: dropdown para selecionar employee

**Entregável:** Histórico mensal navegável com totais diários.

---

## Fase 5 — Edição e Auditoria

- [ ] 5.1 API route `PATCH /api/time-entries/[id]` — aceita timestamp_server, note, reason (obrigatório); só employer
- [ ] 5.2 Trigger Postgres `AFTER UPDATE ON time_entries` para audit automático em `time_entry_audit`
- [ ] 5.3 Modal de edição no histórico: valor atual (readonly), novo valor (time picker), campo reason obrigatório
- [ ] 5.4 API route `GET /api/time-entries/[id]/audit` — histórico de audit da entry
- [ ] 5.5 Viewer de audit: seção expansível ou popover mostrando quem alterou, quando, valor anterior/novo, motivo
- [ ] 5.6 Criação manual de entry para punches esquecidos (employer): POST com timestamp explícito + audit "manual entry"

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
