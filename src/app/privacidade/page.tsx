import Link from "next/link";

export const metadata = {
  title: "Política de Privacidade — Ponto Casa",
};

export default function PrivacidadePage() {
  return (
    <main className="flex flex-1 flex-col items-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <article className="w-full max-w-2xl prose prose-sm prose-gray py-8">
        <Link
          href="/login"
          className="text-sm text-blue-700 no-underline hover:underline mb-6 inline-block"
        >
          ← Voltar ao login
        </Link>

        <h1>Política de Privacidade</h1>
        <p className="text-gray-500">Última atualização: abril de 2026</p>

        <p>
          Esta Política de Privacidade descreve como o <strong>Ponto Casa</strong>
          ("nós", "nosso" ou "Aplicativo") coleta, usa, armazena e protege seus
          dados pessoais, em conformidade com a Lei Geral de Proteção de Dados
          (LGPD — Lei nº 13.709/2018).
        </p>

        <h2>1. Dados que Coletamos</h2>

        <h3>1.1 Dados de Cadastro</h3>
        <ul>
          <li><strong>Nome completo</strong> — para identificação no sistema</li>
          <li><strong>CPF</strong> — para identificação única e conformidade trabalhista</li>
          <li><strong>Telefone</strong> — para autenticação via WhatsApp (OTP)</li>
          <li><strong>Email</strong> — para autenticação via email (OTP) e comunicações</li>
        </ul>

        <h3>1.2 Dados de Jornada</h3>
        <ul>
          <li><strong>Registros de ponto</strong> — data, horário e tipo de marcação (entrada, saída, intervalo)</li>
          <li><strong>Geolocalização</strong> — latitude e longitude no momento da marcação, <em>somente quando autorizada pelo usuário</em></li>
          <li><strong>Informações do dispositivo</strong> — tipo de dispositivo e navegador utilizado</li>
        </ul>

        <h3>1.3 Dados de Auditoria</h3>
        <ul>
          <li>Alterações manuais em registros (valor anterior, valor novo, responsável, motivo)</li>
          <li>Aceites digitais de fechamento mensal (timestamp e identificação)</li>
        </ul>

        <h3>1.4 Dados Técnicos</h3>
        <ul>
          <li>Dispositivos conectados (nome, tipo, navegador, última atividade)</li>
          <li>Logs de acesso para segurança</li>
        </ul>

        <h2>2. Como Usamos seus Dados</h2>
        <table>
          <thead>
            <tr>
              <th>Finalidade</th>
              <th>Base Legal (LGPD)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Autenticação e controle de acesso</td>
              <td>Execução de contrato (Art. 7º, V)</td>
            </tr>
            <tr>
              <td>Registro e controle de jornada de trabalho</td>
              <td>Cumprimento de obrigação legal (Art. 7º, II)</td>
            </tr>
            <tr>
              <td>Geolocalização nas marcações</td>
              <td>Consentimento do titular (Art. 7º, I)</td>
            </tr>
            <tr>
              <td>Auditoria e rastreabilidade de alterações</td>
              <td>Cumprimento de obrigação legal (Art. 7º, II)</td>
            </tr>
            <tr>
              <td>Geração de espelho de ponto e relatórios</td>
              <td>Execução de contrato (Art. 7º, V)</td>
            </tr>
            <tr>
              <td>Segurança e prevenção de fraudes</td>
              <td>Legítimo interesse (Art. 7º, IX)</td>
            </tr>
          </tbody>
        </table>

        <h2>3. Geolocalização</h2>
        <p>
          A captura de geolocalização é <strong>opcional</strong> e ocorre
          <strong> apenas no momento exato</strong> de cada marcação de ponto.
        </p>
        <ul>
          <li>Não rastreamos sua localização em segundo plano</li>
          <li>Não monitoramos deslocamentos ou trajetos</li>
          <li>A permissão pode ser revogada a qualquer momento nas configurações do seu dispositivo</li>
          <li>Sem permissão, o ponto é registrado normalmente, apenas sem coordenadas</li>
        </ul>

        <h2>4. Compartilhamento de Dados</h2>
        <p>Seus dados <strong>não são vendidos, alugados ou compartilhados</strong> com terceiros para fins comerciais ou publicitários.</p>
        <p>Compartilhamos dados apenas nos seguintes casos:</p>
        <ul>
          <li><strong>Entre empregador e funcionário</strong> — os registros de ponto são visíveis para ambos, conforme o vínculo de trabalho</li>
          <li><strong>Prestadores de serviço essenciais</strong> — infraestrutura técnica (hospedagem, banco de dados, envio de mensagens) com contratos de proteção de dados</li>
          <li><strong>Obrigação legal</strong> — quando exigido por lei, regulação ou ordem judicial</li>
        </ul>

        <h3>4.1 Prestadores de Serviço</h3>
        <table>
          <thead>
            <tr>
              <th>Serviço</th>
              <th>Provedor</th>
              <th>Finalidade</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hospedagem</td>
              <td>Vercel</td>
              <td>Infraestrutura do aplicativo</td>
            </tr>
            <tr>
              <td>Banco de dados</td>
              <td>Supabase</td>
              <td>Armazenamento seguro dos dados</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>Resend</td>
              <td>Envio de códigos de acesso</td>
            </tr>
            <tr>
              <td>WhatsApp</td>
              <td>Z-API</td>
              <td>Envio de códigos de acesso</td>
            </tr>
          </tbody>
        </table>

        <h2>5. Armazenamento e Segurança</h2>
        <ul>
          <li>Dados armazenados em servidores na região de São Paulo (sa-east-1)</li>
          <li>Comunicação criptografada via HTTPS (TLS)</li>
          <li>Senhas e códigos OTP armazenados com hash criptográfico (nunca em texto puro)</li>
          <li>Sessões gerenciadas via cookies HttpOnly (inacessíveis por JavaScript)</li>
          <li>Políticas de segurança em nível de linha (RLS) no banco de dados — cada usuário acessa apenas seus próprios dados</li>
          <li>Trilha de auditoria imutável para todas as alterações</li>
        </ul>

        <h2>6. Retenção de Dados</h2>
        <p>
          Os registros de ponto e dados de auditoria são mantidos por prazo
          compatível com as obrigações trabalhistas brasileiras (mínimo 5 anos
          após o término do vínculo, conforme Art. 11 da CLT e Art. 7º, XXIX da
          Constituição Federal).
        </p>
        <p>
          Dados de autenticação (códigos OTP) são automaticamente invalidados
          após 5 minutos e podem ser removidos periodicamente.
        </p>

        <h2>7. Seus Direitos (LGPD)</h2>
        <p>Você tem direito a:</p>
        <ul>
          <li><strong>Acesso</strong> — consultar quais dados temos sobre você</li>
          <li><strong>Correção</strong> — corrigir dados incompletos ou incorretos (via tela de perfil)</li>
          <li><strong>Portabilidade</strong> — exportar seus dados (espelho de ponto em PDF)</li>
          <li><strong>Eliminação</strong> — solicitar a exclusão dos seus dados pessoais, respeitados os prazos legais de retenção</li>
          <li><strong>Revogação de consentimento</strong> — revogar o consentimento de geolocalização a qualquer momento</li>
          <li><strong>Informação</strong> — saber com quem seus dados são compartilhados</li>
        </ul>
        <p>
          Para exercer seus direitos, entre em contato pelo email:{" "}
          <a href="mailto:privacidade@pontocasa.app.br">privacidade@pontocasa.app.br</a>
        </p>

        <h2>8. Cookies</h2>
        <p>
          Utilizamos cookies estritamente necessários para manter sua sessão
          autenticada. Não utilizamos cookies de rastreamento, marketing ou
          analytics de terceiros.
        </p>

        <h2>9. Menores de Idade</h2>
        <p>
          O Ponto Casa é destinado a maiores de 18 anos. Não coletamos
          intencionalmente dados de menores de idade.
        </p>

        <h2>10. Alterações nesta Política</h2>
        <p>
          Podemos atualizar esta Política de Privacidade periodicamente. A versão
          mais recente estará sempre disponível nesta página, com a data da última
          atualização.
        </p>

        <h2>11. Contato</h2>
        <p>
          Para dúvidas, solicitações ou reclamações sobre privacidade e proteção
          de dados:
        </p>
        <ul>
          <li>
            Email:{" "}
            <a href="mailto:privacidade@pontocasa.app.br">privacidade@pontocasa.app.br</a>
          </li>
        </ul>

        <h2>12. Autoridade Nacional de Proteção de Dados</h2>
        <p>
          Caso entenda que o tratamento de seus dados pessoais viola a LGPD, você
          pode apresentar reclamação à Autoridade Nacional de Proteção de Dados
          (ANPD) — <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer">www.gov.br/anpd</a>.
        </p>
      </article>
    </main>
  );
}
