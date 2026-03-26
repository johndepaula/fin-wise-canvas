

## Plano — Tempo Real + Inteligencia de Contas

### 1. Clima por localizacao

**Tabela `user_location`**: `id`, `user_id`, `latitude`, `longitude`, `city`, `created_at` com RLS completo.

**Abordagem para API de clima**: Usar a API gratuita Open-Meteo (nao requer API key). Buscar clima via `https://api.open-meteo.com/v1/forecast?latitude=X&longitude=Y&current_weather=true`. Cache no estado local com re-fetch a cada 10 minutos.

**Hook `useWeather`**:
- Solicitar `navigator.geolocation.getCurrentPosition` uma vez
- Salvar lat/lng/city na tabela `user_location` (upsert)
- Buscar clima da Open-Meteo e guardar no estado
- Re-fetch a cada 10 min via `setInterval`
- Retornar `{ temperature, condition, loading }`

### 2. Hora e data em tempo real

**Hook `useClock`**: Estado local com `setInterval` a cada segundo. Retorna `{ time: "HH:mm:ss", date: "DD/MM/YYYY" }`. Sem tabela necessaria.

### 3. Exibicao no Dashboard

Adicionar um bloco compacto no topo do Dashboard (acima dos filtros) mostrando:
- Hora | Data | Clima (temperatura + condicao)
- Dias restantes do mes
- Valor por dia

Isso e uma **extensao** do Dashboard, nao uma alteracao do layout existente — apenas insercao de uma linha informativa acima do conteudo atual.

### 4. Dias restantes e valor por dia

**Calculos em tempo real** (no Dashboard, via `useMemo`):
- `diasRestantes = ultimoDiaMes - hoje` (minimo 0)
- `restanteContas = sum(amount) - sum(amount_paid)` (do `useBills`)
- `valorPorDia = diasRestantes > 0 ? restanteContas / diasRestantes : restanteContas`

Importar `useBills` no Dashboard para acessar os dados de contas.

### 5. Saldo atual integrado

Calcular `saldoAtual = totalEntradas - totalSaidas - totalContasPagas` combinando dados de `useRegistrosContext` e `useBills`.

### 6. Migracao SQL

```sql
CREATE TABLE public.user_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_location ENABLE ROW LEVEL SECURITY;

-- RLS: SELECT, INSERT, UPDATE, DELETE para auth.uid() = user_id
```

### 7. Ordem de implementacao

1. Migracao SQL (tabela `user_location` + RLS)
2. Hook `useClock` (hora/data local)
3. Hook `useWeather` (geolocalizacao + Open-Meteo + persistir localizacao)
4. Atualizar Dashboard: adicionar barra informativa no topo com hora, data, clima, dias restantes, valor por dia
5. Importar `useBills` no Dashboard para calculos de contas

### Detalhes tecnicos

- Open-Meteo e gratuita e sem API key — chamada direta do frontend
- `navigator.geolocation` pede permissao uma vez; se negada, clima nao aparece
- Conversao de weather code da Open-Meteo para texto (0=Limpo, 1-3=Parcialmente nublado, etc.)
- `user_location` usa `UNIQUE(user_id)` para upsert com `.upsert()`
- Todos os calculos de valor por dia sao feitos no frontend com `useMemo`, sem salvar no banco

