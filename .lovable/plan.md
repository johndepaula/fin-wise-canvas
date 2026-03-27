

## Plano — Negrito nos valores + Município no clima

### 1. Negrito nos valores da InfoBar

No `DashboardInfoBar.tsx`, envolver os valores dinâmicos (hora, data, condição climática, dias restantes, valor/dia) em `<span className="font-semibold text-foreground">` para destacá-los visualmente, mantendo os labels e ícones com a cor atual `text-muted-foreground`.

### 2. Município no clima

No `useWeather.ts`:
- Adicionar `city` ao estado e à interface `WeatherData`
- Usar reverse geocoding gratuito via `https://nominatim.openstreetmap.org/reverse?lat=X&lon=Y&format=json` para obter o nome do município a partir das coordenadas
- Salvar o `city` na tabela `user_location` junto com lat/lng
- Retornar `city` no hook

No `DashboardInfoBar.tsx`:
- Exibir o município antes da temperatura: `São Paulo — 25°C Limpo ☀️`

### Arquivos alterados

- `src/hooks/useWeather.ts` — adicionar `city`, chamada ao Nominatim, salvar no upsert
- `src/components/DashboardInfoBar.tsx` — negrito nos valores + exibir `weather.city`

