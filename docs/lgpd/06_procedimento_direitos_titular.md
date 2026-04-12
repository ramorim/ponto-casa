# Procedimento para Exercício dos Direitos do Titular

**Aplicação:** Ponto Casa
**Data:** Abril de 2026
**Versão:** 1.0

---

## 1. Canal de Atendimento

| Canal | Contato |
|---|---|
| Email | privacidade@pontocasa.app.br |
| Prazo de resposta | Até 15 dias úteis (LGPD Art. 18, § 5º) |

---

## 2. Direitos e Como Exercê-los

### 2.1 Confirmação e Acesso (Art. 18, I e II)
**O que:** saber quais dados temos e acessá-los.
**Como exercer no app:**
- Acessar `/perfil` — dados cadastrais (nome, CPF, telefone, email)
- Acessar `/historico` — todos os registros de ponto
- Acessar `/fechamento` — fechamentos mensais com aceite
- Acessar `modal de detalhe do dia` — coordenadas GPS de cada marcação

**Via email:** enviar solicitação para `privacidade@pontocasa.app.br`. Responderemos com um relatório completo dos dados.

### 2.2 Correção (Art. 18, III)
**O que:** corrigir dados incompletos ou incorretos.
**Como exercer no app:**
- Acessar `/perfil` → editar nome, CPF, telefone, email → Salvar
- Empregador pode corrigir registros de ponto via histórico (com motivo e auditoria)

### 2.3 Anonimização, Bloqueio ou Eliminação (Art. 18, IV)
**O que:** solicitar remoção de dados desnecessários ou excessivos.
**Como exercer no app:**
- Acessar `/perfil` → Sair da conta → ou solicitar exclusão via email
- Endpoint automatizado: `DELETE /api/account/delete`

**Procedimento de eliminação:**
1. Dados pessoais (nome, CPF, telefone, email) são removidos imediatamente
2. Dispositivos, OTPs, convites e solicitações são excluídos
3. Registros de ponto são **anonimizados** (não excluídos) — obrigação legal de 5 anos
4. Conta no sistema de autenticação é deletada (todas as sessões são encerradas)

**Limitação:** registros de ponto são mantidos de forma anonimizada por 5 anos (CLT Art. 11), pois constituem documentação trabalhista.

### 2.4 Portabilidade (Art. 18, V)
**O que:** receber seus dados em formato estruturado.
**Como exercer no app:**
- Acessar `/fechamento` → Exportar PDF (espelho de ponto mensal)
- PDF contém: dados pessoais, horários diários, totais, extras, aceite

**Via email:** solicitar exportação completa em formato JSON ou CSV.

### 2.5 Informação sobre Compartilhamento (Art. 18, VII)
**O que:** saber com quais entidades seus dados são compartilhados.
**Como consultar:**
- Acessar `/privacidade` → Seção 4 (Compartilhamento) e 4.1 (Prestadores de Serviço)
- Resumo: Vercel (hospedagem), Supabase (banco de dados), Resend (email), Z-API (WhatsApp)
- Nenhum compartilhamento com terceiros para fins comerciais

### 2.6 Revogação de Consentimento (Art. 18, IX)
**O que:** revogar consentimentos dados anteriormente.
**Como exercer:**
- **Geolocalização:** revogar nas configurações do navegador/dispositivo
- **Conta completa:** solicitar exclusão via perfil ou email

---

## 3. Registro de Solicitações

Todas as solicitações recebidas via email são registradas com:
- Data de recebimento
- Tipo de direito exercido
- Data de atendimento
- Ação tomada

---

## 4. Reclamação à ANPD

Caso o titular entenda que seus direitos não foram atendidos, pode apresentar reclamação à Autoridade Nacional de Proteção de Dados:

- **Site:** https://www.gov.br/anpd
- **Canal de denúncia:** https://www.gov.br/anpd/pt-br/canais_atendimento/cidadao-titular-de-dados
