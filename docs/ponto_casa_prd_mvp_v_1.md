# PRD — Ponto Casa
**Produto:** Ponto Casa  
**Tipo:** PWA (Progressive Web App)  
**Versão:** MVP v1  
**Owner:** Rafael Amorim  
**Objetivo:** Controle eletrônico de jornada para empregado(a) doméstico(a), com foco em simplicidade, conformidade legal e segurança jurídica.

---

## 1. Visão do Produto

O **Ponto Casa** é um aplicativo PWA para registro de ponto de empregados domésticos, permitindo marcação de jornada em tempo real, histórico mensal e aceite digital do espelho de ponto.

O produto busca resolver a informalidade no controle de jornada doméstica e apoiar o fechamento mensal para uso no eSocial.

---

## 2. Problema

O controle de jornada de empregados domésticos frequentemente acontece de forma informal:

- papel
- WhatsApp
- memória
- planilhas manuais

Isso gera riscos como:

- divergência de horas
- horas extras sem controle
- dificuldade de fechamento
- fragilidade jurídica
- falta de rastreabilidade

A legislação brasileira permite controle por meio eletrônico, desde que seja confiável e auditável.

---

## 3. Objetivo

Permitir que a funcionária registre a jornada de forma simples pelo celular, e que o empregador tenha um histórico confiável para fechamento mensal.

---

## 4. Usuários

### Usuário Primário
**Empregada doméstica**
- registrar entrada e saída
- consultar histórico
- aceitar fechamento mensal

### Usuário Secundário
**Empregador**
- acompanhar registros
- corrigir inconsistências
- gerar PDF
- apoiar fechamento no eSocial

---

## 5. Funcionalidades do MVP

### 5.1 Tela principal — Bater Ponto

Botões grandes e simples:

- **Entrada**
- **Saída para almoço**
- **Volta do almoço**
- **Saída**

Cada clique gera automaticamente:

- data
- horário do servidor
- tipo do evento
- observação opcional
- device/browser
- localização (opcional)

### 5.2 Fluxo permitido

Fluxo válido:

**Entrada → Intervalo → Retorno → Saída**

Bloquear:

- duas entradas seguidas
- saída sem entrada
- retorno sem saída para almoço

### 5.3 Histórico

| Data | Entrada | Almoço | Retorno | Saída |
|---|---:|---:|---:|---:|
| 06/04 | 08:03 | 12:01 | 13:02 | 17:04 |

### 5.4 Fechamento mensal

Resumo do mês:

- horas trabalhadas
- horas extras
- atrasos
- faltas
- observações

### 5.5 Aceite mensal

Ao final do mês, a funcionária deve confirmar:

> **Confirmo que os horários acima correspondem à minha jornada**

Registrar:

- timestamp
- aceite digital
- nome do usuário

### 5.6 Exportação PDF

Gerar espelho mensal contendo:

- dados do mês
- horários diários
- total de horas
- extras
- aceite

Formato pronto para arquivamento.

### 5.7 Auditoria

Toda alteração manual deve armazenar:

- valor anterior
- valor novo
- usuário que alterou
- data/hora
- motivo

Nunca apagar histórico.

---

## 6. Requisitos não funcionais

### Plataforma
- PWA instalável
- iPhone / Android
- modo app na home screen

### Segurança
- login simples por PIN
- autenticação persistente
- logs imutáveis

### Confiabilidade
- horário vindo do backend
- não usar relógio local como fonte oficial

---

## 7. Arquitetura sugerida

### Frontend
- Next.js
- Tailwind
- shadcn/ui
- PWA plugin

### Backend
- Supabase
- PostgreSQL
- Auth simples

---

## 8. Modelo de dados

```sql
CREATE TABLE time_entries (
  id UUID PRIMARY KEY,
  employee_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  timestamp_server TIMESTAMP NOT NULL,
  latitude DECIMAL,
  longitude DECIMAL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE time_entry_audit (
  id UUID PRIMARY KEY,
  entry_id UUID NOT NULL,
  previous_value TEXT,
  new_value TEXT,
  changed_by TEXT,
  reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE monthly_closings (
  id UUID PRIMARY KEY,
  month_ref TEXT NOT NULL,
  total_hours DECIMAL,
  overtime_hours DECIMAL,
  employee_accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMP
);
```

---

## 9. Métricas de sucesso

- 100% dos dias registrados
- fechamento mensal < 3 minutos
- zero inconsistência operacional
- histórico 100% auditável

---

## 10. Roadmap futuro

### v2
- assinatura manuscrita
- alertas automáticos
- integração eSocial
- cálculo automático de extras

### v3
- férias
- 13º
- folha automática
- banco de horas

