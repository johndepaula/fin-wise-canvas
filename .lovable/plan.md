

## Plano de Melhorias Avancadas — FinWise

### 1. Correcao definitiva da tela preta

**Diagnostico**: O `AuthContext` ja usa `onAuthStateChange`, mas ha uma race condition: ambos `onAuthStateChange` e `getSession` chamam `setLoading(false)`. Se `onAuthStateChange` dispara primeiro com `session=null` (antes do token ser restaurado), o app renderiza `<Navigate to="/auth">` e perde o estado.

**Correcao**:
- No `AuthContext`, usar uma flag `initialSessionLoaded` para so setar `loading=false` apos `getSession` resolver, ignorando o primeiro evento de `onAuthStateChange` se o `getSession` ainda nao completou.
- Garantir que `ProtectedRoutes` mostra skeleton ate `loading === false` E dados estejam prontos.
- No `RegistrosProvider`, adicionar skeleton/loading gate antes de renderizar children enquanto `loading` do hook estiver true.

### 2. Configuracoes aplicadas nos graficos

**Banco**: Adicionar coluna `category_chart_color` (text, default `'#3B82F6'`) na tabela `user_settings` via migracao.

**Hook `useUserSettings`**: Adicionar `category_chart_color` ao tipo e defaults.

**Dashboard**: Importar `useUserSettings` e usar:
- `settings.chart_color` como `stroke` do LineChart (Gastos por Dia)
- `settings.chart_line_style` como `type` do `<Line>` (monotone/linear/step)
- `settings.category_chart_color` como `fill` do BarChart (Despesas por Categoria)

Nenhuma alteracao de layout — apenas injecao de valores dinamicos nas props dos componentes Recharts.

### 3. Perfil com nome + foto na sidebar

**Sidebar**: Adicionar bloco de perfil no topo da `AppSidebar` (abaixo do logo, acima do menu), mostrando avatar (ou iniciais) e nome do usuario.

**Implementacao**: Usar o hook `useProfile` existente dentro da sidebar. Exibir imagem circular pequena + display_name em uma linha compacta. Quando sidebar esta colapsada, mostrar apenas o avatar.

Nenhuma alteracao no layout existente da sidebar — apenas insercao de um bloco adicional.

### 4. Autocomplete global (Contas)

O autocomplete ja funciona em Registros (descricao). Falta aplicar em Contas:

- Usar `useInputHistory("tipo_conta")` no `Contas.tsx`
- Salvar `account_type` ao criar/editar conta
- Mostrar sugestoes no input de "Tipo de Conta" com o mesmo `SuggestionDropdown`
- Extrair `SuggestionDropdown` para componente compartilhado se necessario

### 5. Loading states garantidos

- Dashboard: mostrar skeleton cards enquanto `registros` estiver em loading
- Contas: ja tem `loading` do `useBills`, adicionar skeleton na tabela
- Perfil: mostrar skeleton enquanto profile carrega
- Configuracoes: ja tem loading gate no `useEffect`

### Ordem de implementacao

1. Migracao SQL: adicionar `category_chart_color` em `user_settings`
2. Corrigir `AuthContext` (race condition do loading)
3. Atualizar `useUserSettings` (novo campo)
4. Aplicar settings nos graficos do Dashboard
5. Adicionar perfil na sidebar
6. Adicionar autocomplete em Contas
7. Adicionar loading skeletons em Dashboard e Contas

### Detalhes tecnicos

- Migracao: `ALTER TABLE user_settings ADD COLUMN category_chart_color text DEFAULT '#3B82F6';`
- AuthContext: controlar loading com `useRef` para evitar race condition entre `onAuthStateChange` e `getSession`
- Dashboard recebe cores via `useUserSettings().settings` — sem context provider global necessario, hook direto
- SuggestionDropdown reutilizado como componente em `src/components/SuggestionDropdown.tsx`

