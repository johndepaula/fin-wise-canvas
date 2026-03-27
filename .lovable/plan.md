

## Plano — Correção do "Valor por Dia"

### Diagnóstico

A lógica atual em `DashboardInfoBar.tsx` (linha 24) já está quase correta:

```
valorPorDia = diasRestantes > 0 ? Math.max(0, restanteContas - saldoReal) / diasRestantes : restanteContas
```

**Problema**: Quando `diasRestantes = 0`, retorna `restanteContas` bruto em vez de `Math.max(0, restanteContas - saldoReal)` (o valor necessário real).

### Correção

Atualizar linha 24 de `DashboardInfoBar.tsx`:

```typescript
const valorNecessario = Math.max(0, restanteContas - saldoReal);
const valorPorDia = diasRestantes > 0 ? valorNecessario / diasRestantes : valorNecessario;
```

Isso garante:
- Se `saldoReal > restanteContas` → `valorPorDia = 0` (já está positivo)
- Se `diasRestantes = 0` → mostra o valor necessário total restante
- Nunca NaN ou infinito
- Recalcula automaticamente (já reativo via hooks)

### Escopo

- **1 arquivo**: `src/components/DashboardInfoBar.tsx` — apenas corrigir 1 linha de cálculo
- **Zero mudanças de UI**

