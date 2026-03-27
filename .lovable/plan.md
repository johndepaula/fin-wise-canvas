

## Plano — Inteligencia Avancada + Assistente + Automacao

### 1. Valor por dia inteligente (entradas + saidas + contas)

Atualizar `DashboardInfoBar.tsx` para importar `useRegistrosContext` e calcular:
- `saldoReal = totalEntradas - totalSaidas`
- `restanteContas = totalContas - totalPago`
- `valorPorDia = diasRestantes > 0 ? Math.max(0, restanteContas - saldoReal) / diasRestantes : restanteContas`

Adicionar exibicao do `saldoReal` na barra informativa.

### 2. Ordenacao automatica de contas

No `useBills.ts`, a query ja ordena por `due_date ascending` — ja esta implementado. Nenhuma mudanca necessaria.

### 3. Perfil (nome + foto)

Ja esta implementado: `Perfil.tsx` permite upload de avatar e edicao de nome, e `AppSidebar.tsx` ja exibe avatar + nome. Nenhuma mudanca necessaria.

### 4. Filtro "ultimos dias" dinamico baseado no mes

No `Dashboard.tsx`, substituir a opcao fixa "Ultimos 30 dias" por logica dinamica:
- Calcular `diasNoMes = new Date(ano, mes+1, 0).getDate()`
- Usar `diasNoMes` como valor do filtro padrao (em vez de "30")
- Atualizar o label do Select para "Este mes (X dias)"

### 5. Assistente inteligente (comandos por texto)

**Migracao SQL**: Criar tabela `ai_commands_history` com campos `id`, `user_id`, `command`, `action_type`, `response`, `created_at` + RLS.

**Hook `useAssistant`**: Parser simples de comandos em portugues:
- Navegacao: `"abrir dashboard"` → `navigate("/")`
- Consultas: `"valor por dia"` → retorna calculo; `"saldo"` → retorna saldo; `"dias restantes"` → retorna dias
- Insercao: `"adicionar gasto 50 transporte gasolina"` → parseia tipo/valor/categoria/descricao e chama `adicionar()`
- Salvar comando + resposta na tabela `ai_commands_history`

**Componente `CommandBar`**: Input fixo no topo do layout (dentro de `AppLayout`, acima do conteudo), com:
- Input de texto com placeholder "Digite um comando..."
- Ao pressionar Enter, processa o comando
- Exibe resposta via toast
- Usa autocomplete do `useInputHistory` para categorias conhecidas

### 6. Migracao SQL

```sql
CREATE TABLE public.ai_commands_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  command text NOT NULL,
  action_type text NOT NULL,
  response text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_commands_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own commands" ON public.ai_commands_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own commands" ON public.ai_commands_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
```

### 7. Ordem de implementacao

1. Migracao SQL (`ai_commands_history`)
2. Atualizar `DashboardInfoBar` — valor por dia inteligente com registros
3. Atualizar `Dashboard` — filtro dinamico baseado no mes
4. Criar hook `useAssistant` — parser de comandos + persistencia
5. Criar componente `CommandBar` — input de comandos no layout
6. Integrar `CommandBar` no `AppLayout`

### Detalhes tecnicos

- Parser de comandos usa regex simples: `/adicionar\s+(gasto|entrada|saida)\s+(\d+[\.,]?\d*)\s+(\w+)\s*(.*)/i`
- Navegacao: match contra lista de rotas conhecidas
- Consultas: match contra keywords e retorna valor calculado via `useBills` + `useRegistrosContext`
- `CommandBar` e um input discreto no topo, nao altera o layout existente
- Todos os comandos e respostas sao salvos para historico
- `diasNoMes` recalculado com `useMemo` baseado em `new Date()`

