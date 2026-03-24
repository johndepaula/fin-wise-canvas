

## Plano de Melhorias Incrementais — FinWise

### 1. Correção: Tela preta + App.css

**Problema**: O `src/App.css` contém estilos legados do Vite (`#root { max-width: 1280px; padding: 2rem; text-align: center; }`) que restringem o layout e podem causar renderização incorreta no ambiente publicado.

**Ação**: Esvaziar `src/App.css` completamente. Verificar que `AuthContext` já usa `onAuthStateChange` corretamente (confirmado — está implementado). Garantir que o `RegistrosProvider` re-fetcha ao montar e quando `user` muda (confirmado — `useEffect` depende de `fetchRegistros` que depende de `user`).

---

### 2. Novas tabelas no banco de dados (migração SQL)

Criar 4 tabelas com RLS:

- **`custom_categories`**: `id`, `user_id`, `name`, `created_at` — categorias personalizadas reutilizáveis
- **`user_inputs_history`**: `id`, `user_id`, `type` (categoria/descricao), `value`, `created_at` — histórico para autocomplete
- **`profiles`**: `id` (ref auth.users), `display_name`, `avatar_url`, `created_at` — dados do perfil + imagem
- **`bills`**: `id`, `user_id`, `account_type`, `due_date`, `amount`, `amount_paid` (default 0), `created_at` — contas a pagar
- **`user_settings`**: `id`, `user_id`, `chart_color`, `background_color`, `chart_line_style`, `created_at` — personalização visual

Todas com RLS: SELECT/INSERT/UPDATE/DELETE restritos a `auth.uid() = user_id`.

Criar trigger para auto-criar perfil no signup. Criar bucket `avatars` para upload de imagem.

---

### 3. Categorias editáveis com autocomplete

- Hook `useCustomCategories` — busca categorias do usuário na tabela `custom_categories`
- No modal de registro, ao selecionar "Outros" e salvar, a categoria customizada é persistida em `custom_categories`
- Select de categoria mostra categorias padrão + customizadas do usuário
- Input de "Outros" com sugestões baseadas no histórico

---

### 4. Persistência inteligente (autocomplete)

- Hook `useInputHistory` — salva e busca valores de `user_inputs_history`
- Ao salvar um registro, grava descrição e categoria no histórico
- Inputs de descrição e categoria mostram sugestões com base no histórico (dropdown simples)

---

### 5. Perfil com imagem

- Criar bucket `avatars` no storage
- Na página Perfil, adicionar upload de imagem (botão sobre o avatar atual)
- Salvar URL no `profiles.avatar_url`
- Exibir a imagem no avatar do perfil e na sidebar

---

### 6. Nova página: Contas

- Adicionar rota `/contas` e item "Contas" no menu lateral (ícone `Wallet`)
- Página com tabela de contas: tipo de conta, vencimento, valor, valor pago, restante (calculado)
- CRUD completo via modal (mesmo padrão visual de Registros)
- KPIs no topo: total a pagar, total pago, restante
- Alertas visuais: badge amarelo se vence em ≤3 dias, vermelho se vencido
- Hook `useBills` para CRUD com Supabase

---

### 7. Nova página: Configurações

- Adicionar rota `/configuracoes` e item "Configurações" no menu lateral (ícone `Settings`)
- Campos: cor do gráfico (color picker), cor de fundo, estilo de linha
- Hook `useUserSettings` — carrega e salva em `user_settings`
- Aplicar configurações dinamicamente nos gráficos do Dashboard (cores e estilo de linha via props)

---

### 8. Ordem de implementação

1. Migração SQL (todas as tabelas + RLS + trigger + bucket)
2. Limpar `App.css`
3. Hooks de dados: `useCustomCategories`, `useInputHistory`, `useProfiles`, `useBills`, `useUserSettings`
4. Atualizar Registros (categorias + autocomplete)
5. Atualizar Perfil (upload de imagem)
6. Criar página Contas
7. Criar página Configurações
8. Atualizar sidebar e rotas
9. Aplicar settings no Dashboard

### Detalhes técnicos

- Todas as tabelas usam `user_id uuid not null` com RLS `auth.uid() = user_id`
- Profiles usa `id uuid references auth.users(id) on delete cascade` como PK
- Trigger `on_auth_user_created` cria profile automaticamente
- Bucket `avatars` público para exibir imagens
- Cálculos de contas (total, pago, restante) são feitos no frontend com `useMemo`
- Alertas de vencimento comparados com `new Date()` no render
- Settings aplicados via context provider global

