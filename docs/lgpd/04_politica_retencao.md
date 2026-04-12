# Política de Retenção de Dados

**Aplicação:** Ponto Casa
**Data:** Abril de 2026
**Versão:** 1.0

---

## 1. Objetivo

Estabelecer os prazos de retenção e procedimentos de descarte dos dados pessoais tratados pelo Ponto Casa, em conformidade com a LGPD (Art. 16) e a legislação trabalhista brasileira.

---

## 2. Prazos de Retenção

| Dado | Prazo | Fundamentação | Procedimento após prazo |
|---|---|---|---|
| **Registros de ponto** (time_entries) | 5 anos após o registro | CLT Art. 11 (prescrição trabalhista) + CF Art. 7, XXIX | Exclusão automática (a implementar) |
| **Trilha de auditoria** (time_entry_audit) | 5 anos (acompanha time_entries) | CLT Art. 11 | Exclusão junto com time_entries |
| **Fechamentos mensais** (monthly_closings) | 5 anos após o mês de referência | CLT Art. 11 | Exclusão automática |
| **Dados cadastrais** (profiles) | Enquanto conta ativa + 5 anos após exclusão | LGPD Art. 16, I + CLT Art. 11 | Anonimização (nome="Conta excluída", PII=null) |
| **Dispositivos** (user_devices) | Enquanto conta ativa | LGPD Art. 15, I (finalidade alcançada) | Exclusão imediata na exclusão da conta |
| **Códigos OTP** (otp_codes) | 5 minutos (expiração automática) | LGPD Art. 16, I | Podem ser purgados periodicamente |
| **Convites** (employer_invites) | 7 dias (expiração) ou até aceite | LGPD Art. 15, I | Mantidos como histórico de vínculo |
| **Solicitações de conexão** (connection_requests) | Enquanto relevante | LGPD Art. 15, I | Exclusão na exclusão da conta |
| **Horários de trabalho** (work_schedules) | Enquanto vínculo ativo | LGPD Art. 15, I | Exclusão na exclusão da conta |

---

## 3. Procedimentos

### 3.1 Exclusão por solicitação do titular
- Titular solicita via endpoint `DELETE /api/account/delete` ou email `privacidade@pontocasa.app.br`
- Dados pessoais (nome, CPF, telefone, email) são removidos imediatamente
- Registros de ponto são **anonimizados** (não excluídos) para cumprir prazo legal de 5 anos
- Prazo de atendimento: imediato (automatizado) ou até 15 dias úteis (manual)

### 3.2 Exclusão automática (a implementar)
- Registros de ponto com mais de 5 anos: exclusão via job agendado
- Códigos OTP expirados: purga periódica

### 3.3 Backup
- Supabase Cloud realiza backups automáticos diários (retenção de 7 dias no plano gratuito)
- Backups contêm dados pessoais e seguem a mesma política de retenção

---

## 4. Base Legal para Retenção

| Base Legal | Artigo | Aplicação |
|---|---|---|
| Cumprimento de obrigação legal | LGPD Art. 16, I | Registros trabalhistas por 5 anos |
| Exercício regular de direitos | LGPD Art. 16, II | Defesa em processo trabalhista |
| Uso exclusivo do controlador, anonimizados | LGPD Art. 16, IV | Dados estatísticos após anonimização |
