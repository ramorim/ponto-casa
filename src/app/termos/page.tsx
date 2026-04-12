import Link from "next/link";

export const metadata = {
  title: "Termos de Uso — Ponto Casa",
};

export default function TermosPage() {
  return (
    <main className="flex flex-1 flex-col items-center p-6 bg-gradient-to-b from-blue-50 to-white">
      <article className="w-full max-w-2xl prose prose-sm prose-gray py-8">
        <Link
          href="/login"
          className="text-sm text-blue-700 no-underline hover:underline mb-6 inline-block"
        >
          ← Voltar ao login
        </Link>

        <h1>Termos de Uso</h1>
        <p className="text-gray-500">Última atualização: abril de 2026</p>

        <h2>1. Aceitação dos Termos</h2>
        <p>
          Ao acessar ou utilizar o aplicativo <strong>Ponto Casa</strong> ("Aplicativo"),
          você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não
          concordar com qualquer parte destes termos, não utilize o Aplicativo.
        </p>

        <h2>2. Descrição do Serviço</h2>
        <p>
          O Ponto Casa é uma plataforma web (PWA) para controle eletrônico de jornada
          de trabalho de empregados domésticos, em conformidade com a legislação
          trabalhista brasileira. O serviço permite:
        </p>
        <ul>
          <li>Registro de ponto com marcação de entrada, saída, intervalo e retorno</li>
          <li>Captura opcional de geolocalização a cada marcação</li>
          <li>Histórico mensal de registros</li>
          <li>Fechamento mensal com aceite digital</li>
          <li>Exportação de espelho de ponto em PDF</li>
          <li>Gestão de vínculo entre empregador(a) e funcionário(a)</li>
        </ul>

        <h2>3. Cadastro e Acesso</h2>
        <p>
          O acesso ao Aplicativo é feito por código de verificação (OTP) enviado por
          WhatsApp ou email. Não utilizamos senhas. Ao se cadastrar, você declara que
          as informações fornecidas (nome, CPF, telefone, email) são verdadeiras e de
          sua responsabilidade.
        </p>

        <h2>4. Responsabilidades do Usuário</h2>
        <p>O usuário se compromete a:</p>
        <ul>
          <li>Fornecer informações cadastrais verdadeiras e atualizadas</li>
          <li>Registrar os horários de forma fiel à jornada efetivamente trabalhada</li>
          <li>Manter a segurança de seu dispositivo e sessão de acesso</li>
          <li>Não compartilhar seu código de acesso com terceiros</li>
          <li>Não utilizar o serviço para fins ilegais ou fraudulentos</li>
        </ul>

        <h2>5. Responsabilidades do Empregador</h2>
        <p>O empregador se compromete a:</p>
        <ul>
          <li>Utilizar os registros em conformidade com a legislação trabalhista vigente</li>
          <li>Não alterar registros de ponto sem motivo justificado (todas as alterações são auditadas)</li>
          <li>Garantir que o funcionário tenha acesso ao Aplicativo para realizar suas marcações</li>
          <li>Realizar o fechamento mensal e disponibilizar o espelho de ponto para conferência</li>
        </ul>

        <h2>6. Registro de Ponto e Auditoria</h2>
        <p>
          Todos os registros de ponto utilizam o horário do servidor (não do dispositivo)
          e são armazenados com timestamp imutável. Qualquer alteração manual realizada
          pelo empregador é registrada em trilha de auditoria com valor anterior, valor
          novo, responsável, data/hora e motivo — em conformidade com boas práticas de
          controle eletrônico de jornada.
        </p>

        <h2>7. Geolocalização</h2>
        <p>
          A captura de geolocalização é opcional e depende da permissão concedida pelo
          usuário em seu dispositivo. Quando autorizada, a localização é registrada
          apenas no momento da marcação de ponto, para fins de comprovação do local de
          trabalho. A localização não é rastreada em segundo plano.
        </p>

        <h2>8. Aceite Digital do Fechamento</h2>
        <p>
          O aceite digital do fechamento mensal pelo funcionário constitui confirmação
          de que os horários registrados correspondem à jornada efetivamente trabalhada
          naquele mês. O aceite é registrado com timestamp, identificação do usuário e
          tem validade como documento eletrônico.
        </p>

        <h2>9. Disponibilidade do Serviço</h2>
        <p>
          O Ponto Casa se esforça para manter o serviço disponível 24 horas por dia,
          7 dias por semana. No entanto, não garantimos disponibilidade ininterrupta.
          Manutenções programadas ou emergenciais podem ocorrer.
        </p>

        <h2>10. Limitação de Responsabilidade</h2>
        <p>
          O Ponto Casa é uma ferramenta de apoio ao controle de jornada. A
          responsabilidade pelo correto cumprimento das obrigações trabalhistas
          (recolhimento de FGTS, INSS, envio ao eSocial, etc.) permanece com o
          empregador, conforme a legislação vigente.
        </p>

        <h2>11. Alterações nos Termos</h2>
        <p>
          Reservamo-nos o direito de alterar estes Termos de Uso a qualquer momento.
          As alterações entram em vigor imediatamente após a publicação. O uso
          continuado do Aplicativo após alterações constitui aceitação dos novos termos.
        </p>

        <h2>12. Foro</h2>
        <p>
          Fica eleito o foro da comarca do Rio de Janeiro/RJ para dirimir quaisquer
          questões oriundas destes Termos de Uso.
        </p>

        <h2>13. Contato</h2>
        <p>
          Para dúvidas sobre estes Termos de Uso, entre em contato pelo email:{" "}
          <a href="mailto:contato@pontocasa.app.br">contato@pontocasa.app.br</a>
        </p>
      </article>
    </main>
  );
}
