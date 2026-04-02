

## Plano — Animação de boas-vindas no login com idioma automático

### O que será feito

Após o login bem-sucedido, exibir uma tela de splash animada com:
- Mensagem "SEJA BEM-VINDO" (traduzida automaticamente com base no idioma do navegador)
- Logo da plataforma com animação
- Duração de ~2.5 segundos antes de redirecionar ao Dashboard

### Traduções suportadas

Usar `navigator.language` para detectar o idioma:
- `pt` → "SEJA BEM-VINDO"
- `en` → "WELCOME"
- `es` → "BIENVENIDO"
- `fr` → "BIENVENUE"
- `de` → "WILLKOMMEN"
- `it` → "BENVENUTO"
- `ja` → "ようこそ"
- `zh` → "欢迎"
- Fallback → "WELCOME"

### Alterações por arquivo

**`src/App.tsx`**
- Adicionar estado `showWelcome` no `ProtectedRoutes`
- Quando `session` existir e `showWelcome` for true, exibir tela de splash com logo + mensagem traduzida por 2.5s
- Após o tempo, mostrar as rotas normais
- Usar `useRef` para garantir que a animação só aparece uma vez por sessão (não ao navegar entre páginas)

**`src/pages/Auth.tsx`**
- Manter splash inicial (ao abrir a página) como está
- Nenhuma alteração necessária — a animação pós-login será gerenciada no `ProtectedRoutes`

### Detalhes técnicos

- A função de tradução será um map simples baseado em `navigator.language.slice(0, 2)`
- A animação usará as classes existentes: `animate-fade-in-up`, `animate-pulse`
- Um `sessionStorage` flag evita que a animação repita ao recarregar a página (só aparece no momento do login)

