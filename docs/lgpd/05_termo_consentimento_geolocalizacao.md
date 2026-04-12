# Termo de Consentimento — Geolocalização

**Aplicação:** Ponto Casa
**Data:** Abril de 2026
**Versão:** 1.0

---

## 1. Identificação

| Campo | Valor |
|---|---|
| Controlador | Rafael Amorim |
| Aplicação | Ponto Casa — https://pontocasa.app.br |
| Email de contato | privacidade@pontocasa.app.br |

---

## 2. Dados Coletados

Ao conceder permissão de localização, o Ponto Casa coleta:

- **Latitude e longitude** do dispositivo no momento exato de cada marcação de ponto
- Precisão aproximada da coordenada (fornecida pelo dispositivo)

---

## 3. Finalidade

A geolocalização é utilizada **exclusivamente** para:

- Registrar o local onde a marcação de ponto foi realizada
- Permitir ao empregador verificar que o ponto foi batido no endereço de trabalho
- Gerar evidência geográfica para fins de auditoria e conformidade trabalhista

---

## 4. O que NÃO fazemos

- **Não rastreamos** a localização em segundo plano (background)
- **Não monitoramos** deslocamentos, trajetos ou rotas
- **Não compartilhamos** a localização com terceiros
- **Não utilizamos** a localização para perfilamento ou publicidade
- **Não armazenamos** histórico contínuo de localização

---

## 5. Quando a localização é capturada

A captura ocorre **apenas** nos seguintes momentos:
- Ao registrar **Entrada**
- Ao registrar **Saída para Almoço**
- Ao registrar **Volta do Almoço**
- Ao registrar **Saída**

Cada captura é pontual (um único ponto no tempo) e vinculada ao registro de ponto correspondente.

---

## 6. Consentimento

O consentimento é obtido via **Permissions API do navegador/dispositivo**:

- Na primeira marcação de ponto, o dispositivo solicita permissão de localização
- O usuário pode escolher **Permitir** ou **Negar**
- Se negada, o ponto é registrado **normalmente, sem coordenadas**
- O consentimento pode ser **revogado a qualquer momento** nas configurações do dispositivo

---

## 7. Revogação

Para revogar o consentimento:

1. Acesse as **Configurações** do seu navegador ou dispositivo
2. Localize as permissões do site `pontocasa.app.br`
3. Altere a permissão de localização para **Bloquear**

Após a revogação, novos registros de ponto serão feitos sem coordenadas. Os registros anteriores que já contêm localização serão mantidos conforme a política de retenção (5 anos).

---

## 8. Base Legal

- **LGPD Art. 7, I** — Consentimento do titular
- **LGPD Art. 8** — Consentimento deve ser fornecido por escrito ou por outro meio que demonstre a manifestação de vontade do titular (neste caso, a permissão do navegador)

---

## 9. Direitos do Titular

Você pode:
- **Consultar** as coordenadas registradas no detalhe de cada dia (modal no histórico)
- **Exportar** os dados no espelho de ponto em PDF
- **Revogar** o consentimento a qualquer momento (configurações do dispositivo)
- **Solicitar eliminação** dos dados via `privacidade@pontocasa.app.br`
