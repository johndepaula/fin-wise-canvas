

## Plano — Reorganizar logo, limpar duplicações, manter perfil

### Resumo

1. Adicionar a logo fixa no topo da sidebar, acima dos itens de navegação
2. Remover o bloco de logo + avatar + nome que está acima da InfoBar no Dashboard
3. Remover a seção "Logo da plataforma" da página Meu Perfil
4. Perfil (foto, nome, email) permanece 100% intacto

### Alterações por arquivo

**`src/components/AppSidebar.tsx`**
- Adicionar `<img src="/lovable-uploads/85d29aa0-c4f7-4e62-8d72-f7a1c76d6bcb.png" />` no topo do `SidebarContent`, antes do Separator e dos itens de navegação
- Quando colapsado, mostrar a logo menor; quando expandido, tamanho normal

**`src/pages/Dashboard.tsx`**
- Remover linhas 140-156 (bloco com logo, avatar e displayName acima da InfoBar)
- Remover imports não utilizados (`Avatar`, `AvatarImage`, `AvatarFallback`, `useProfile`, `useAuth` se não usados em outro lugar)

**`src/pages/Perfil.tsx`**
- Remover linhas 124-146 (seção "Logo da plataforma" com upload)
- Remover linha 148 (Separator abaixo da logo)
- Remover estado `logoFile`, `logoPreviewUrl`, `logoFileRef` e handler `handleLogoChange`
- Remover lógica de upload de logo do `handleSave`
- Manter avatar, nome, email e botões intactos

### O que NÃO muda
- Layout geral, navegação, DashboardInfoBar (hora/data/clima)
- Página de Configurações (não tem logo lá — está em Perfil)
- Funcionalidade de foto e nome no perfil
- Tabela `profiles` no banco (coluna `logo_url` permanece, apenas não é usada)

