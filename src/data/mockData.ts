export type RegistroTipo = "entrada" | "saida";

export interface Registro {
  id: string;
  tipo: RegistroTipo;
  valor: number;
  categoria: string;
  descricao: string;
  data: string; // ISO date string
  criado_em: string;
}

export const CATEGORIAS_ENTRADA = ["Salário", "Freelance", "Investimentos", "Outros"];
export const CATEGORIAS_SAIDA = ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação"];
export const TODAS_CATEGORIAS = [...CATEGORIAS_SAIDA, ...CATEGORIAS_ENTRADA];

function randomId() {
  return Math.random().toString(36).substring(2, 10);
}

function randomDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

export function gerarDadosMock(): Registro[] {
  const registros: Registro[] = [];

  // Entradas
  const entradas = [
    { categoria: "Salário", descricao: "Salário mensal", valor: 8500, diasAtras: 2 },
    { categoria: "Salário", descricao: "Salário mensal", valor: 8500, diasAtras: 32 },
    { categoria: "Freelance", descricao: "Projeto website corporativo", valor: 3200, diasAtras: 5 },
    { categoria: "Freelance", descricao: "Consultoria técnica", valor: 1800, diasAtras: 15 },
    { categoria: "Investimentos", descricao: "Dividendos ações", valor: 420, diasAtras: 8 },
    { categoria: "Freelance", descricao: "Design de logo", valor: 950, diasAtras: 22 },
    { categoria: "Outros", descricao: "Venda de equipamento", valor: 600, diasAtras: 12 },
  ];

  entradas.forEach((e) => {
    const data = randomDate(e.diasAtras);
    registros.push({
      id: randomId(),
      tipo: "entrada",
      valor: e.valor,
      categoria: e.categoria,
      descricao: e.descricao,
      data,
      criado_em: data,
    });
  });

  // Saídas
  const saidas = [
    { categoria: "Alimentação", descricao: "Supermercado semanal", valor: 387.5, diasAtras: 1 },
    { categoria: "Alimentação", descricao: "Restaurante com amigos", valor: 142.8, diasAtras: 4 },
    { categoria: "Alimentação", descricao: "iFood delivery", valor: 67.9, diasAtras: 6 },
    { categoria: "Alimentação", descricao: "Padaria e café", valor: 45.2, diasAtras: 9 },
    { categoria: "Transporte", descricao: "Uber mensal", valor: 289.0, diasAtras: 3 },
    { categoria: "Transporte", descricao: "Combustível", valor: 320.0, diasAtras: 10 },
    { categoria: "Transporte", descricao: "Estacionamento shopping", valor: 35.0, diasAtras: 7 },
    { categoria: "Moradia", descricao: "Aluguel apartamento", valor: 2800.0, diasAtras: 1 },
    { categoria: "Moradia", descricao: "Conta de luz", valor: 215.4, diasAtras: 5 },
    { categoria: "Moradia", descricao: "Internet fibra", valor: 129.9, diasAtras: 8 },
    { categoria: "Lazer", descricao: "Cinema e pipoca", valor: 78.0, diasAtras: 2 },
    { categoria: "Lazer", descricao: "Assinatura streaming", valor: 55.9, diasAtras: 11 },
    { categoria: "Lazer", descricao: "Ingresso show", valor: 280.0, diasAtras: 14 },
    { categoria: "Saúde", descricao: "Plano de saúde", valor: 680.0, diasAtras: 3 },
    { categoria: "Saúde", descricao: "Farmácia medicamentos", valor: 124.5, diasAtras: 6 },
    { categoria: "Saúde", descricao: "Consulta oftalmologista", valor: 350.0, diasAtras: 18 },
    { categoria: "Educação", descricao: "Curso online programação", valor: 197.0, diasAtras: 7 },
    { categoria: "Educação", descricao: "Livros técnicos", valor: 156.8, diasAtras: 20 },
    { categoria: "Alimentação", descricao: "Supermercado quinzenal", valor: 412.3, diasAtras: 16 },
    { categoria: "Moradia", descricao: "Condomínio", valor: 580.0, diasAtras: 2 },
    { categoria: "Transporte", descricao: "Manutenção carro", valor: 890.0, diasAtras: 25 },
    { categoria: "Lazer", descricao: "Jantar especial", valor: 195.0, diasAtras: 13 },
  ];

  saidas.forEach((s) => {
    const data = randomDate(s.diasAtras);
    registros.push({
      id: randomId(),
      tipo: "saida",
      valor: s.valor,
      categoria: s.categoria,
      descricao: s.descricao,
      data,
      criado_em: data,
    });
  });

  return registros.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}
