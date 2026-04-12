# Evidências de Segurança — Checklist Técnico

**Aplicação:** Ponto Casa
**Data da varredura:** Abril de 2026
**Responsável:** Rafael Amorim

---

## 1. Auditoria de Dependências

```
$ npm audit
found 0 vulnerabilities
```

- Next.js atualizado de 16.2.2 para 16.2.3 (correção de DoS em Server Components — GHSA-q4gf-8mx6-v5v3)
- Hono corrigido via npm audit fix (IP matching + path traversal + middleware bypass)
- **Resultado: 0 vulnerabilidades**

---

## 2. Env Vars — Nenhum Vazamento no Client

```
$ grep -rl 'sb_secret|re_6DW5|E4E71663|F0dd48' .next/static/
(nenhum resultado)
```

- Nenhuma variável `NEXT_PUBLIC_*` no projeto
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` são server-only
- `RESEND_API_KEY`, `ZAPI_TOKEN`, `ZAPI_SECURITY_TOKEN` são server-only
- Browser nunca acessa Supabase diretamente (padrão BFF)
- **Resultado: 0 secrets expostos**

---

## 3. Proteção de API Routes

| Rota | Proteção | Tipo |
|---|---|---|
| POST /api/auth/send-otp | Rate limiting (3/10min) | Pública (intencional) |
| POST /api/auth/verify-otp | Max 5 tentativas/código | Pública (intencional) |
| POST /api/auth/logout | Sem dados sensíveis | Pública (intencional) |
| GET /api/auth/me | requireAuth() | Protegida |
| PATCH /api/profile | requireAuth() | Protegida |
| POST /api/profile/onboarding | createClient().getUser() | Protegida |
| GET /api/employees | requireEmployer() | Protegida |
| GET/POST /api/invites | requireEmployer() | Protegida |
| GET/DELETE /api/invites/[token] | requireEmployer() (DELETE) | Mista |
| POST /api/invites/[token]/accept | createClient().getUser() | Protegida |
| GET /api/connection-requests | requireEmployer() | Protegida |
| PATCH /api/connection-requests/[id] | requireEmployer() | Protegida |
| POST /api/time-entries | createClient().getUser() | Protegida |
| GET /api/time-entries/today | createClient().getUser() | Protegida |
| GET /api/time-entries/month | createClient().getUser() | Protegida |
| PATCH /api/time-entries/[id] | createClient().getUser() + employer check | Protegida |
| GET /api/time-entries/[id]/audit | createClient().getUser() | Protegida |
| POST /api/time-entries/manual | createClient().getUser() + employer check | Protegida |
| POST /api/closings/generate | createClient().getUser() + employer check | Protegida |
| GET /api/closings | requireAuth() | Protegida |
| POST /api/closings/[id]/accept | createClient().getUser() + employee check | Protegida |
| POST /api/closings/[id]/reopen | createClient().getUser() + employer check | Protegida |
| GET /api/closings/[id]/pdf | createClient().getUser() + access check | Protegida |
| GET/POST /api/devices | requireAuth() | Protegida |
| DELETE /api/devices/[id] | requireAuth() | Protegida |
| GET/POST /api/work-schedules | requireAuth() + employer check | Protegida |
| DELETE /api/account/delete | createClient().getUser() | Protegida |

**Resultado: 100% das rotas protegidas ou intencionalmente públicas**

---

## 4. Row Level Security (RLS)

Todas as 9 tabelas têm RLS habilitado:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | Próprio + employer vê employees | — | Próprio | — |
| user_devices | Próprio | Próprio | Próprio | Próprio |
| employer_invites | Qualquer (por token) | Employer | Employer | — |
| connection_requests | Próprio (employee/employer) | Employee | Employer | — |
| work_schedules | Próprio + employer | Employer | Employer | — |
| time_entries | Próprio + employer vê employees | Próprio | Employer | **Nenhum** |
| time_entry_audit | Via time_entries access | **Trigger only** | **Nenhum** | **Nenhum** |
| monthly_closings | Próprio + employer | Employer | Employer + employee (aceite) | — |
| otp_codes | **Nenhum (service role only)** | **Service role** | **Service role** | — |

**Resultado: isolamento completo por usuário, audit trail imutável**

---

## 5. Headers de Segurança

Configurados em `next.config.ts`:

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), payment=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**Resultado: todos os headers recomendados pela OWASP configurados**

---

## 6. Proteção contra XSS

```
$ grep -r "dangerouslySetInnerHTML|\.innerHTML|eval(" src/
(nenhum resultado)
```

- React escapa HTML por padrão em toda expressão JSX
- Nenhum uso de `dangerouslySetInnerHTML`, `innerHTML` ou `eval`
- Inputs sanitizados via controlled components (React state)
- **Resultado: 0 vetores XSS identificados**

---

## 7. Autenticação e Sessão

| Aspecto | Implementação |
|---|---|
| Método | OTP 6 dígitos via WhatsApp (Z-API) ou email (Resend) |
| Armazenamento de OTP | Hash SHA-256 (nunca texto puro) |
| Expiração OTP | 5 minutos |
| Tentativas OTP | Max 5 por código |
| Rate limiting envio | Max 3 por phone/email a cada 10 minutos |
| Sessão | JWT em cookie HttpOnly, Secure, SameSite=Lax |
| Refresh | Middleware atualiza sessão automaticamente |
| Gestão de dispositivos | Usuário lista e revoga dispositivos |

---

## 8. Geolocalização

| Aspecto | Implementação |
|---|---|
| Consentimento | Opt-in via Permissions API do browser |
| Momento da captura | Apenas no instante do punch (não contínuo) |
| Rastreamento background | **Não implementado** |
| Cache client-side | **Não existe** — captura em tempo real a cada punch |
| Sem coords | Punch prossegue normalmente sem coordenadas |
| Com coords + falha | Punch é bloqueado (se permissão foi concedida, coords são obrigatórias) |

---

## 9. Eliminação de Dados

Endpoint `DELETE /api/account/delete`:

1. Verifica se empregador tem funcionários vinculados (bloqueia se sim)
2. Anonimiza time_entries (remove note e device_info, mantém horários)
3. Deleta: user_devices, otp_codes, employer_invites, connection_requests, work_schedules
4. Anonimiza profile: nome="Conta excluída", phone/email/cpf=null, is_active=false
5. Deleta auth.user (invalida todas as sessões)

**Retenção:** registros de ponto anonimizados mantidos por 5 anos conforme CLT Art. 11.
