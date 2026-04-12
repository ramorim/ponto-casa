/**
 * Feriados nacionais e regionais do Brasil (capitais dos 27 estados).
 * Cálculo autônomo — sem dependência de APIs externas.
 */

// ── Algoritmo de Páscoa (Computus gregoriano anônimo) ──

function computeEaster(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

function dateAdd(year: number, month: number, day: number, deltaDays: number): string {
  const d = new Date(year, month - 1, day + deltaDays);
  return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function fmt(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// ── Feriados nacionais fixos ──

function fixedNationalHolidays(year: number): Map<string, string> {
  const m = new Map<string, string>();
  m.set(fmt(year, 1, 1), "Confraternização Universal");
  m.set(fmt(year, 4, 21), "Tiradentes");
  m.set(fmt(year, 5, 1), "Dia do Trabalho");
  m.set(fmt(year, 9, 7), "Independência do Brasil");
  m.set(fmt(year, 10, 12), "Nossa Senhora Aparecida");
  m.set(fmt(year, 11, 2), "Finados");
  m.set(fmt(year, 11, 15), "Proclamação da República");
  m.set(fmt(year, 12, 25), "Natal");
  return m;
}

// ── Feriados nacionais variáveis (baseados na Páscoa) ──

function variableNationalHolidays(year: number): Map<string, string> {
  const m = new Map<string, string>();
  const easter = computeEaster(year);
  const eY = year;
  const eM = easter.month;
  const eD = easter.day;

  // Carnaval: 47 dias antes da Páscoa (segunda e terça)
  m.set(dateAdd(eY, eM, eD, -48), "Carnaval (segunda)");
  m.set(dateAdd(eY, eM, eD, -47), "Carnaval");

  // Sexta-feira Santa: 2 dias antes da Páscoa
  m.set(dateAdd(eY, eM, eD, -2), "Sexta-feira Santa");

  // Corpus Christi: 60 dias depois da Páscoa
  m.set(dateAdd(eY, eM, eD, 60), "Corpus Christi");

  return m;
}

// ── Feriados regionais por capital ──
// Chave: "NomeDaCidade-UF"

type RegionalEntry = { month: number; day: number; name: string };

const regionalHolidaysByCity: Record<string, RegionalEntry[]> = {
  "Rio Branco-AC": [
    { month: 1, day: 23, name: "Dia do Evangélico" },
    { month: 6, day: 15, name: "Aniversário do Acre" },
    { month: 9, day: 5, name: "Dia da Amazônia" },
    { month: 11, day: 17, name: "Tratado de Petrópolis" },
  ],
  "Maceió-AL": [
    { month: 6, day: 24, name: "São João" },
    { month: 6, day: 29, name: "São Pedro" },
    { month: 9, day: 16, name: "Emancipação Política de Alagoas" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
    { month: 12, day: 5, name: "Aniversário de Maceió" },
  ],
  "Macapá-AP": [
    { month: 3, day: 19, name: "São José (Dia de São José)" },
    { month: 7, day: 25, name: "São Tiago" },
    { month: 9, day: 13, name: "Criação do Território Federal" },
    { month: 2, day: 4, name: "Aniversário de Macapá" },
  ],
  "Manaus-AM": [
    { month: 9, day: 5, name: "Elevação do Amazonas à Categoria de Província" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
    { month: 10, day: 24, name: "Aniversário de Manaus" },
  ],
  "Salvador-BA": [
    { month: 3, day: 29, name: "Aniversário de Salvador" },
    { month: 6, day: 24, name: "São João" },
    { month: 7, day: 2, name: "Independência da Bahia" },
  ],
  "Fortaleza-CE": [
    { month: 3, day: 19, name: "São José (Padroeiro do Ceará)" },
    { month: 3, day: 25, name: "Data Magna do Ceará" },
    { month: 4, day: 13, name: "Aniversário de Fortaleza" },
    { month: 8, day: 15, name: "Nossa Senhora da Assunção" },
  ],
  "Brasília-DF": [
    { month: 4, day: 21, name: "Fundação de Brasília" },
    { month: 11, day: 30, name: "Dia do Evangélico" },
  ],
  "Vitória-ES": [
    { month: 4, day: 8, name: "Aniversário de Vitória" },
    { month: 5, day: 23, name: "Colonização do Solo Espírito-Santense" },
    { month: 9, day: 8, name: "Nossa Senhora da Vitória" },
    { month: 10, day: 28, name: "Dia do Servidor Público" },
  ],
  "Goiânia-GO": [
    { month: 5, day: 24, name: "Aniversário de Goiânia" },
    { month: 7, day: 26, name: "Fundação da Cidade de Goiás" },
    { month: 10, day: 28, name: "Dia do Servidor Público" },
  ],
  "São Luís-MA": [
    { month: 7, day: 28, name: "Adesão do Maranhão à Independência" },
    { month: 9, day: 8, name: "Aniversário de São Luís" },
    { month: 12, day: 8, name: "Nossa Senhora da Conceição" },
  ],
  "Cuiabá-MT": [
    { month: 4, day: 8, name: "Aniversário de Cuiabá" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
  ],
  "Campo Grande-MS": [
    { month: 8, day: 26, name: "Aniversário de Campo Grande" },
    { month: 10, day: 11, name: "Criação do Estado de Mato Grosso do Sul" },
  ],
  "Belo Horizonte-MG": [
    { month: 4, day: 21, name: "Data Magna de Minas Gerais" },
    { month: 8, day: 15, name: "Assunção de Nossa Senhora" },
    { month: 12, day: 8, name: "Imaculada Conceição" },
    { month: 12, day: 12, name: "Aniversário de Belo Horizonte" },
  ],
  "Belém-PA": [
    { month: 1, day: 12, name: "Aniversário de Belém" },
    { month: 8, day: 15, name: "Adesão do Grão-Pará à Independência" },
    { month: 10, day: 7, name: "Dia de Nossa Senhora de Nazaré" },
  ],
  "João Pessoa-PB": [
    { month: 7, day: 26, name: "Homenagem à Santa Ana" },
    { month: 8, day: 5, name: "Aniversário de João Pessoa / N.S. das Neves" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
  ],
  "Curitiba-PR": [
    { month: 3, day: 29, name: "Aniversário de Curitiba" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
    { month: 12, day: 19, name: "Emancipação Política do Paraná" },
  ],
  "Recife-PE": [
    { month: 3, day: 6, name: "Revolução Pernambucana" },
    { month: 6, day: 24, name: "São João" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
    { month: 12, day: 8, name: "Nossa Senhora da Conceição" },
  ],
  "Teresina-PI": [
    { month: 3, day: 13, name: "Dia da Batalha do Jenipapo" },
    { month: 8, day: 16, name: "Aniversário de Teresina" },
    { month: 10, day: 19, name: "Dia do Piauí" },
  ],
  "Rio de Janeiro-RJ": [
    { month: 1, day: 20, name: "Dia de São Sebastião" },
    { month: 3, day: 1, name: "Aniversário do Rio de Janeiro" },
    { month: 4, day: 23, name: "Dia de São Jorge" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
  ],
  "Natal-RN": [
    { month: 6, day: 29, name: "Dia de São Pedro" },
    { month: 10, day: 3, name: "Mártires de Cunhaú e Uruaçu" },
    { month: 12, day: 25, name: "Aniversário de Natal" },
  ],
  "Porto Alegre-RS": [
    { month: 2, day: 2, name: "Nossa Senhora dos Navegantes" },
    { month: 9, day: 20, name: "Revolução Farroupilha" },
    { month: 3, day: 26, name: "Aniversário de Porto Alegre" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
  ],
  "Porto Velho-RO": [
    { month: 1, day: 4, name: "Criação do Estado de Rondônia" },
    { month: 6, day: 18, name: "Dia do Evangélico" },
    { month: 10, day: 2, name: "Aniversário de Porto Velho" },
  ],
  "Boa Vista-RR": [
    { month: 6, day: 9, name: "Aniversário de Boa Vista" },
    { month: 10, day: 5, name: "Criação do Estado de Roraima" },
  ],
  "Florianópolis-SC": [
    { month: 3, day: 23, name: "Aniversário de Florianópolis" },
    { month: 7, day: 14, name: "Dia da Colonização Açoriana" },
    { month: 8, day: 11, name: "Criação da Capitania de Santa Catarina" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
  ],
  "São Paulo-SP": [
    { month: 1, day: 25, name: "Aniversário de São Paulo" },
    { month: 7, day: 9, name: "Revolução Constitucionalista" },
    { month: 11, day: 20, name: "Dia da Consciência Negra" },
  ],
  "Aracaju-SE": [
    { month: 3, day: 17, name: "Aniversário de Aracaju" },
    { month: 6, day: 24, name: "São João" },
    { month: 7, day: 8, name: "Emancipação Política de Sergipe" },
  ],
  "Palmas-TO": [
    { month: 1, day: 1, name: "Instalação do Estado do Tocantins" },
    { month: 3, day: 18, name: "Autonomia do Estado do Tocantins" },
    { month: 5, day: 20, name: "Aniversário de Palmas" },
    { month: 9, day: 8, name: "Nossa Senhora da Natividade" },
  ],
};

// ── API pública ──

/**
 * Retorna um mapa de `YYYY-MM-DD` → nome do feriado para o ano e cidade informados.
 * Se `city` não for informada, retorna apenas os feriados nacionais.
 */
export function getHolidays(year: number, city?: string): Map<string, string> {
  const holidays = new Map<string, string>();

  // Feriados nacionais fixos
  for (const [date, name] of fixedNationalHolidays(year)) {
    holidays.set(date, name);
  }

  // Feriados nacionais variáveis
  for (const [date, name] of variableNationalHolidays(year)) {
    holidays.set(date, name);
  }

  // Feriados regionais
  if (city && regionalHolidaysByCity[city]) {
    for (const entry of regionalHolidaysByCity[city]) {
      const dateStr = fmt(year, entry.month, entry.day);
      // Não sobrescrever feriado nacional
      if (!holidays.has(dateStr)) {
        holidays.set(dateStr, entry.name);
      }
    }
  }

  return holidays;
}

/**
 * Verifica se uma data é feriado. Retorna o nome do feriado ou `null`.
 * @param date string no formato `YYYY-MM-DD`
 * @param city chave da cidade, ex: "São Paulo-SP"
 */
export function isHoliday(date: string, city?: string): string | null {
  const year = parseInt(date.substring(0, 4), 10);
  const holidays = getHolidays(year, city);
  return holidays.get(date) ?? null;
}
