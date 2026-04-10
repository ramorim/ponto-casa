# Ponto Casa

Controle eletrônico de jornada para empregado(a) doméstico(a).

PWA que permite o registro de ponto em tempo real, com histórico mensal, fechamento com aceite digital, exportação em PDF e rastreamento de localização — tudo em conformidade com a legislação brasileira.

## Funcionalidades

**Funcionário(a)**
- Bater ponto com 4 marcações (entrada, saída almoço, volta almoço, saída)
- Captura de geolocalização em tempo real a cada marcação
- Histórico mensal com visualização diária
- Detalhe do dia com mapa das marcações (OpenStreetMap)
- Aceite digital do fechamento mensal
- Perfil com gestão de dispositivos conectados

**Empregador(a)**
- Painel de funcionários com convite via link/WhatsApp
- Histórico de cada funcionário com edição e auditoria completa
- Criação manual de registros para punches esquecidos
- Fechamento mensal com cálculo automático (horas, extras, atrasos, faltas)
- Exportação PDF do espelho de ponto (formato A4)
- Definição de horário de trabalho por funcionário
- Reabertura de mês fechado com motivo obrigatório

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend (BFF) | API Routes Next.js (server-side only) |
| Banco de dados | PostgreSQL via Supabase (RLS + triggers de auditoria) |
| Autenticação | OTP via Z-API (WhatsApp) + Supabase Auth (email) |
| PWA | @serwist/next (service worker) |
| PDF | @react-pdf/renderer (server-side) |
| Mapas | OpenStreetMap (iframe embed, sem API key) |

## Arquitetura

```
Browser (PWA)
  │  fetch /api/*
  ▼
Next.js API Routes (BFF)        ← todas chamadas ao Supabase passam por aqui
  │  @supabase/ssr (cookies HttpOnly)
  │  @supabase/supabase-js (admin/service role)
  ▼
Supabase Cloud
  ├─ PostgreSQL (RLS em todas as tabelas)
  ├─ Auth (sessão via JWT em cookie HttpOnly)
  └─ Triggers (auditoria automática, criação de profile)
```

- O browser **nunca** fala diretamente com o Supabase
- Nenhuma env var `NEXT_PUBLIC_*` — todas as keys ficam no servidor
- Sessão via cookies HttpOnly gerenciados pelo middleware

## Pré-requisitos

- Node.js 20+
- Docker (para Supabase local)
- npm

## Setup local

```bash
# 1. Clonar
git clone https://github.com/ramorim/ponto-casa.git
cd ponto-casa

# 2. Instalar dependências
npm install

# 3. Copiar env vars
cp .env.example .env.local
# Preencher com valores do Supabase local (veja abaixo)

# 4. Subir Supabase local (Docker)
npx supabase start --ignore-health-check

# 5. Aplicar migrations
npx supabase db reset

# 6. Anotar as keys exibidas pelo supabase start e preencher no .env.local:
#    SUPABASE_URL=http://127.0.0.1:54421
#    SUPABASE_ANON_KEY=<publishable key>
#    SUPABASE_SERVICE_ROLE_KEY=<secret key>

# 7. Rodar o app
npm run dev
# → http://localhost:3001
```

### Portas do Supabase local

| Serviço | Porta |
|---|---|
| API (REST) | 54421 |
| PostgreSQL | 54422 |
| Studio | 54423 |
| Mailpit (emails) | 54424 |

> As portas são customizadas (544xx) para não conflitar com outros projetos Supabase na mesma máquina.

## Variáveis de ambiente

```env
# Supabase (obrigatórias)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Z-API — WhatsApp OTP (opcional, fallback para email)
ZAPI_INSTANCE_ID=
ZAPI_TOKEN=
ZAPI_API_URL=https://api.z-api.io
```

## Estrutura do projeto

```
src/
├── app/
│   ├── (authenticated)/      # Páginas protegidas (layout com bottom nav)
│   │   ├── ponto/            # Tela de bater ponto (funcionário)
│   │   ├── historico/        # Histórico mensal
│   │   ├── fechamento/       # Fechamento + aceite + PDF
│   │   ├── funcionarios/     # Painel do empregador
│   │   └── perfil/           # Perfil + dispositivos + logout
│   ├── api/                  # BFF — todas as API routes
│   │   ├── auth/             # send-otp, verify-otp, me, logout
│   │   ├── time-entries/     # CRUD + today + month + manual
│   │   ├── closings/         # generate, accept, reopen, pdf
│   │   ├── invites/          # CRUD + accept por token
│   │   ├── employees/        # Listar funcionários
│   │   ├── devices/          # CRUD dispositivos
│   │   ├── profile/          # PATCH perfil + onboarding
│   │   ├── work-schedules/   # GET/POST horário de trabalho
│   │   └── connection-requests/
│   ├── convite/[token]/      # Tela pública de aceite de convite
│   ├── login/                # Login + verificação OTP
│   └── onboarding/           # Primeiro acesso (nome, CPF, role)
├── components/               # Componentes reutilizáveis
├── hooks/                    # useAuth (context de autenticação)
├── lib/                      # Utilitários
│   ├── supabase/             # server.ts, admin.ts, middleware.ts
│   ├── calculations/         # Cálculos de horas (pure functions)
│   ├── pdf/                  # Template do espelho de ponto
│   ├── validation.ts         # CPF, telefone, email (máscara + validação)
│   ├── time-entry-validation.ts  # Regras de fluxo de ponto
│   ├── otp.ts                # Geração e hash de OTP
│   ├── zapi.ts               # Integração Z-API (WhatsApp)
│   └── api-auth.ts           # Helper de autenticação para API routes
├── services/
│   └── devices.ts            # Registro de dispositivos (via /api/devices)
supabase/
├── config.toml               # Config local (portas, auth, etc)
├── migrations/               # 4 migrations SQL
└── seed.sql                  # Seed de desenvolvimento
```

## Banco de dados

9 tabelas com RLS habilitado em todas:

| Tabela | Propósito |
|---|---|
| `profiles` | Dados do usuário (nome, CPF, phone, role, employer_id) |
| `user_devices` | Dispositivos conectados por usuário |
| `employer_invites` | Convites com token UUID + expiração |
| `connection_requests` | Solicitações de conexão funcionário → empregador |
| `work_schedules` | Horário de trabalho por funcionário |
| `time_entries` | Registros de ponto (com geolocalização) |
| `time_entry_audit` | Auditoria de alterações (trigger automático) |
| `monthly_closings` | Fechamento mensal com aceite digital |
| `otp_codes` | Códigos OTP (WhatsApp) com hash + expiração |

## Deploy

Detalhes completos no guia de deploy em `docs/`.

**Resumo:**
1. Criar projeto Supabase Cloud (sa-east-1)
2. `npx supabase link --project-ref <ref>` + `npx supabase db push`
3. Importar repo no Vercel, configurar env vars
4. `git push` → deploy automático

## Roadmap

Consultável em [`docs/tasks_mvp.md`](docs/tasks_mvp.md).

- **Fases 1–8:** MVP web concluído
- **Fase 9:** App mobile nativo via Capacitor (planejado)
- **Backlog:** Notificações push, integração eSocial, assinatura manuscrita, banco de horas

## Licença

Projeto privado. Todos os direitos reservados.
