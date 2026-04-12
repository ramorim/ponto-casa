# ROPA — Registro das Operações de Tratamento de Dados Pessoais

**Controlador:** Rafael Amorim (pessoa física / MEI)
**Aplicação:** Ponto Casa — Controle eletrônico de jornada doméstica
**Data:** Abril de 2026
**Versão:** 1.0

---

## 1. Identificação do Controlador

| Campo | Valor |
|---|---|
| Razão Social / Nome | Rafael Amorim |
| CNPJ / CPF | — (preencher) |
| Endereço | — (preencher) |
| Email do Encarregado (DPO) | privacidade@pontocasa.app.br |
| Site | https://pontocasa.app.br |

---

## 2. Inventário de Dados Pessoais

### 2.1 Dados de Cadastro

| Dado | Categoria LGPD | Base Legal | Finalidade | Retenção | Origem |
|---|---|---|---|---|---|
| Nome completo | Dado pessoal | Execução de contrato (Art. 7, V) | Identificação no sistema | Enquanto conta ativa + 5 anos após exclusão | Titular (onboarding) |
| CPF | Dado pessoal | Cumprimento de obrigação legal (Art. 7, II) | Identificação única, conformidade trabalhista | Enquanto conta ativa + 5 anos | Titular (onboarding) |
| Telefone | Dado pessoal | Execução de contrato (Art. 7, V) | Autenticação via WhatsApp OTP | Enquanto conta ativa | Titular (login/onboarding) |
| Email | Dado pessoal | Execução de contrato (Art. 7, V) | Autenticação via email OTP, comunicações | Enquanto conta ativa | Titular (login/onboarding) |

### 2.2 Dados de Jornada de Trabalho

| Dado | Categoria LGPD | Base Legal | Finalidade | Retenção | Origem |
|---|---|---|---|---|---|
| Registros de ponto (data, hora, tipo) | Dado pessoal | Cumprimento de obrigação legal (Art. 7, II) | Controle de jornada conforme CLT | 5 anos após registro (CLT Art. 11) | Sistema (timestamp do servidor) |
| Geolocalização (lat/lng) | Dado pessoal sensível* | Consentimento (Art. 7, I) | Comprovação do local de trabalho | 5 anos junto com registro de ponto | Dispositivo do titular (GPS) |
| Informações do dispositivo (userAgent) | Dado pessoal | Legítimo interesse (Art. 7, IX) | Segurança e rastreabilidade | Enquanto conta ativa | Dispositivo do titular |

*Nota: geolocalização pode ser considerada sensível dependendo da interpretação. Tratamos com consentimento explícito (opt-in via Permissions API).

### 2.3 Dados de Auditoria

| Dado | Categoria LGPD | Base Legal | Finalidade | Retenção | Origem |
|---|---|---|---|---|---|
| Trilha de auditoria (alterações) | Dado pessoal | Cumprimento de obrigação legal (Art. 7, II) | Rastreabilidade de alterações em registros de ponto | 5 anos (acompanha registro de ponto) | Sistema (trigger automático) |
| Aceite digital (timestamp, user) | Dado pessoal | Cumprimento de obrigação legal (Art. 7, II) | Comprovação de conferência mensal | 5 anos | Titular (ação no sistema) |

### 2.4 Dados Técnicos

| Dado | Categoria LGPD | Base Legal | Finalidade | Retenção | Origem |
|---|---|---|---|---|---|
| Dispositivos conectados | Dado pessoal | Legítimo interesse (Art. 7, IX) | Gestão de sessões, segurança | Enquanto dispositivo ativo | Sistema (auto-detecção) |
| Códigos OTP (hash) | Dado pessoal | Execução de contrato (Art. 7, V) | Autenticação | 5 minutos (expiração automática) | Sistema (gerado) |

---

## 3. Compartilhamento de Dados

| Destinatário | Dados Compartilhados | Finalidade | Base Legal |
|---|---|---|---|
| Empregador vinculado | Registros de ponto, nome, geolocalização | Gestão de jornada | Execução de contrato |
| Vercel Inc. (EUA) | Dados em trânsito (HTTPS) | Hospedagem da aplicação | Legítimo interesse + cláusulas contratuais padrão |
| Supabase Inc. (EUA, região sa-east-1) | Todos os dados armazenados | Banco de dados | Legítimo interesse + cláusulas contratuais padrão |
| Resend Inc. (EUA) | Email do titular | Envio de códigos OTP | Execução de contrato |
| Z-API (Brasil) | Telefone do titular | Envio de códigos OTP via WhatsApp | Execução de contrato |

**Transferência internacional:** Vercel e Supabase são empresas americanas. Os dados no Supabase estão na região `sa-east-1` (São Paulo). A transferência é justificada por cláusulas contratuais padrão (Art. 33, II, b da LGPD).

---

## 4. Medidas de Segurança

| Medida | Implementação |
|---|---|
| Criptografia em trânsito | HTTPS/TLS em todas as comunicações |
| Criptografia de senhas/OTP | SHA-256 hash (nunca armazenado em texto puro) |
| Controle de acesso | RLS (Row Level Security) em todas as tabelas do banco |
| Sessões | Cookies HttpOnly, Secure, SameSite=Lax |
| Headers de segurança | HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy |
| Autenticação | OTP sem senha, sessão via JWT em cookie HttpOnly |
| Auditoria | Trigger automático no banco para toda alteração em registros de ponto |
| Imutabilidade | Trilha de auditoria sem UPDATE/DELETE (apenas INSERT via trigger) |
| Gestão de dispositivos | Usuário pode listar e revogar dispositivos conectados |
| Princípio do menor privilégio | Browser nunca acessa Supabase diretamente (BFF pattern) |
| Eliminação de dados | Endpoint de exclusão de conta com anonimização |
