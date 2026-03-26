const BASE = 'https://olinda.bcb.gov.br/olinda/servico/IFDATA/versao/v1/odata';

const banks: Record<string, string> = {
  nubank: '18236120000158',
  itau: '60701190000104',
  bb: '00000000000191',
  bradesco: '60746948000112',
  caixa: '00360305000104',
  santander: '90400888000142',
  btg: '30306294000145',
  safra: '58160789000128',
  inter: '00416968000101',
  c6: '31872495000172',
  original: '92894922000135',
  pagbank: '10573521000191',
  next: '74828799000112',
  neon: '92874270000160',
};

type Candidate = { tipo: 1 | 3; cod: string };

function buildCandidates(cnpj: string): Candidate[] {
  const base8 = cnpj.slice(0, 8);
  const trim = base8.replace(/^0+/, '') || '0';
  const values = [base8, trim, `C${base8}`, `C${trim}`];
  const unique = [...new Set(values)];
  const candidates: Candidate[] = [];

  for (const tipo of [1, 3] as const) {
    for (const cod of unique) {
      candidates.push({ tipo, cod });
    }
  }

  return candidates;
}

async function hasRows(anoMes: number, tipo: 1 | 3, cod: string): Promise<number> {
  const filter = encodeURIComponent(`CodInst eq '${cod}'`);
  const url = `${BASE}/IfDataValores(AnoMes=${anoMes},TipoInstituicao=${tipo},Relatorio=%27T%27)?$filter=${filter}&$top=1&$format=json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch {
    clearTimeout(timer);
    return -599;
  }
  clearTimeout(timer);

  if (!response.ok) {
    return -response.status;
  }

  const data = await response.json() as { value?: unknown[] };
  return Array.isArray(data.value) ? data.value.length : 0;
}

async function main(): Promise<void> {
  const anoMes = 202409;
  console.log(`Probe IfDataValores AnoMes=${anoMes}`);

  for (const [slug, cnpj] of Object.entries(banks)) {
    const candidates = buildCandidates(cnpj);
    let found = false;

    for (const candidate of candidates) {
      const count = await hasRows(anoMes, candidate.tipo, candidate.cod);
      if (count > 0) {
        console.log(`${slug} | tipo=${candidate.tipo} | cod=${candidate.cod} | rows=${count}`);
        found = true;
      }
    }

    if (!found) {
      console.log(`${slug} | sem match`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
