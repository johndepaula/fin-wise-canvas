

## Plano — Melhorias incrementais sem alterar UI

### 1. Corrigir animação de boas-vindas (App.tsx)

- Usar a logo correta: `/lovable-uploads/853f9d2e-1310-4b8f-bfcd-0aa85d8a98ef.png`
- Usar a função `getWelcomeMessage()` que já existe (em vez do texto hardcoded "SEJA BEM VINDO")
- Reduzir duração para 2 segundos conforme pedido

### 2. Corrigir data em Meus Registros (Registros.tsx)

**Problema:** `new Date(form.data).toISOString()` converte a data local para UTC, causando shift de -1 dia.

**Solução:** Salvar a data como `form.data + "T12:00:00"` (meio-dia local) para evitar o deslocamento de fuso. Aplicar em `handleSave` tanto para criar quanto para editar.

Também corrigir a exibição na tabela: usar `r.data.slice(0, 10)` com split manual para formatar, evitando `new Date()` que re-aplica o problema de timezone.

### 3. Garantir ordenação em Contas (já funciona)

O hook `useBills` já ordena por `due_date` ascending. A tabela em `Contas.tsx` renderiza na ordem do array. Nenhuma alteração necessária aqui.

### 4. Melhorias nos gráficos do Dashboard (Dashboard.tsx)

Sem alterar layout ou posição:

- **Gráfico de linha → Gráfico de área**: Trocar `LineChart`/`Line` por `AreaChart`/`Area` com gradiente (usando `<defs>` + `<linearGradient>`)
- **Barras**: Adicionar `animationDuration={800}` e manter `radius={[6,6,0,0]}` (já existe)
- **Tooltips**: Adicionar `formatter` para exibir valores formatados em R$
- **Area chart**: Usar `fillOpacity` com gradiente suave da cor do chart para transparente

### Arquivos modificados

| Arquivo | Alteração |
|---|---|
| `src/App.tsx` | Logo correta, texto traduzido, duração 2s |
| `src/pages/Registros.tsx` | Fix timezone na data (linhas 102-104) |
| `src/pages/Dashboard.tsx` | AreaChart com gradiente, tooltips formatados |

### O que NÃO muda
- Layout, posição de componentes, sidebar, perfil
- Nenhuma tela nova
- Nenhum componente removido

