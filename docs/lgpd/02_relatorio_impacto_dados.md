# RIPD — Relatório de Impacto à Proteção de Dados Pessoais

**Aplicação:** Ponto Casa
**Controlador:** Rafael Amorim
**Data:** Abril de 2026
**Versão:** 1.0

> Conforme Art. 38 da LGPD, o RIPD é recomendado quando o tratamento pode gerar riscos às liberdades civis e aos direitos fundamentais dos titulares.

---

## 1. Descrição do Tratamento

### 1.1 Natureza
Aplicação web (PWA) para registro eletrônico de ponto de empregados domésticos, com captura opcional de geolocalização.

### 1.2 Escopo
- Empregadores domésticos (pessoas físicas)
- Empregados domésticos (pessoas físicas)
- Dados de jornada de trabalho, localização e identificação pessoal

### 1.3 Contexto
A legislação brasileira (LC 150/2015, CLT) exige controle de jornada para empregados domésticos. O Ponto Casa digitaliza esse processo, substituindo controles informais (papel, WhatsApp, memória) por um sistema auditável e confiável.

### 1.4 Finalidade
- Registro confiável de jornada para conformidade trabalhista
- Geração de espelho de ponto para eSocial
- Comprovação de horários em caso de litígio trabalhista

---

## 2. Necessidade e Proporcionalidade

| Princípio LGPD | Avaliação |
|---|---|
| **Finalidade** | Dados coletados exclusivamente para controle de jornada e autenticação |
| **Adequação** | Cada dado é compatível com sua finalidade (CPF = identificação legal, geo = comprovação de local) |
| **Necessidade** | Coletamos o mínimo necessário. Geolocalização é opcional. Não coletamos foto, biometria ou dados de saúde |
| **Livre acesso** | Titular acessa todos os seus dados via app (perfil, histórico, fechamentos) |
| **Qualidade** | Titular pode corrigir dados no perfil. Empregador pode corrigir registros com auditoria |
| **Transparência** | Política de Privacidade pública com base legal detalhada para cada dado |
| **Segurança** | Criptografia, RLS, cookies HttpOnly, auditoria imutável |
| **Não discriminação** | Dados não são usados para perfilamento, scoring ou decisões automatizadas |

---

## 3. Identificação de Riscos

### 3.1 Riscos identificados

| # | Risco | Probabilidade | Impacto | Nível |
|---|---|---|---|---|
| R1 | Vazamento de dados pessoais (CPF, telefone) por falha de segurança | Baixa | Alto | Médio |
| R2 | Acesso não autorizado a registros de ponto de outro funcionário | Baixa | Médio | Baixo |
| R3 | Manipulação de coordenadas GPS pelo titular | Média | Baixo | Baixo |
| R4 | Uso indevido de dados pelo empregador (vigilância excessiva) | Baixa | Médio | Baixo |
| R5 | Indisponibilidade do serviço impedindo registro de ponto | Baixa | Médio | Baixo |
| R6 | Transferência internacional de dados sem garantias adequadas | Baixa | Médio | Baixo |

### 3.2 Medidas mitigatórias

| Risco | Medida | Status |
|---|---|---|
| R1 | RLS em todas as tabelas, HTTPS, cookies HttpOnly, sem env vars no client, headers de segurança | Implementado |
| R2 | RLS isola dados por user/employer_id, API routes validam autenticação | Implementado |
| R3 | Captura em tempo real (sem cache client-side), watchPosition apenas para warm-up | Implementado |
| R4 | Empregador só vê registros de seus funcionários (RLS), geolocalização é opt-in do funcionário | Implementado |
| R5 | Hospedagem em Vercel (99.99% SLA), Supabase Cloud com backups automáticos | Implementado |
| R6 | Supabase em sa-east-1 (São Paulo), cláusulas contratuais padrão com provedores | Implementado |

---

## 4. Risco Residual

Após implementação das medidas mitigatórias, o risco residual geral é classificado como **BAIXO**.

Os maiores riscos residuais são:
- **R3 (GPS):** em ambiente web, não é possível garantir 100% a autenticidade das coordenadas. A mitigação total só é possível com app nativo (planejado na Fase 9)
- **R6 (Transferência internacional):** dados transitam por provedores americanos, mitigado por cláusulas contratuais e região sa-east-1

---

## 5. Aprovação

| Papel | Nome | Data | Assinatura |
|---|---|---|---|
| Controlador | Rafael Amorim | ___/___/2026 | ________________ |
| Encarregado (DPO) | Rafael Amorim | ___/___/2026 | ________________ |

> Para empresas de pequeno porte, a ANPD permite que o controlador acumule a função de encarregado (Resolução CD/ANPD nº 2/2022).
