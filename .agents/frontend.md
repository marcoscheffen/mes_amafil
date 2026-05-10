# Skill: Frontend — Next.js 15 PWA

## Quando aplicar

- Criar ou modificar páginas, componentes ou layouts
- Implementar autenticação e proteção de rotas no cliente
- Trabalhar com estado global (Zustand), formulários ou validação
- Implementar funcionalidades offline (Service Worker, IndexedDB)
- Configurar ou ajustar o PWA e o Service Worker
- Integrar Supabase Realtime (subscriptions em tempo real)
- Qualquer trabalho de UI/UX no sistema MES

## Contexto do projeto

**Next.js 15** em modo **Static Export (SPA)** — sem SSR, sem middleware de servidor, sem Route Handlers em produção.  
O build gera arquivos estáticos servidos pelo Nginx. Auth redirect é feito no cliente via Zustand + GoTrue SDK.  
O sistema é instalável como **PWA** nos tablets da fábrica (offline-capable).  
Referência: [PRD Infra — seção 6](../PRD/PRD_infra.md) | [PRD Geral — seções 9, 11](../PRD/PRD_geral.md)

---

## Stack frontend

| Lib | Uso |
|---|---|
| Next.js 15 | Framework (Static Export) |
| React 19 | UI |
| TypeScript 5 | Tipagem |
| Zustand | Estado global (auth, empresa selecionada, OP ativa) |
| shadcn/ui | Componentes base |
| Tailwind CSS | Estilização utilitária |
| Lucide React | Ícones |
| Recharts | Gráficos (OEE, paradas, produção) |
| React Hook Form + Zod | Formulários com validação type-safe |
| `next-pwa` | Service Worker e manifest PWA |
| `@supabase/supabase-js` | Auth (GoTrue), Realtime, Storage |

---

## Estrutura do projeto

```
web/
├── app/                  → App Router (páginas e layouts)
│   ├── (auth)/           → Grupo sem layout autenticado
│   │   └── login/
│   ├── (app)/            → Grupo com layout autenticado (sidebar)
│   │   ├── layout.tsx    → Sidebar + guard de auth
│   │   ├── dashboard/
│   │   ├── ops/
│   │   ├── apontamento/
│   │   ├── solicitacoes/
│   │   ├── maquinas/
│   │   ├── paradas/
│   │   ├── usuarios/
│   │   ├── relatorios/
│   │   └── configuracoes/
├── components/           → Componentes reutilizáveis
│   ├── ui/               → shadcn/ui (gerados — não editar manualmente)
│   ├── kpi-card.tsx
│   ├── status-badge.tsx
│   ├── machine-card.tsx
│   ├── op-table.tsx
│   └── gauge-oee.tsx
├── lib/
│   ├── supabase.ts       → Cliente Supabase (browser)
│   ├── api.ts            → Fetch wrapper para /api/* (Fastify)
│   └── offline.ts        → Helpers de IndexedDB e sync queue
├── store/                → Zustand stores
│   ├── auth.ts           → Sessão, perfil, empresa_id
│   └── op.ts             → OP ativa, turno em andamento
├── hooks/                → Custom hooks
├── public/
│   ├── manifest.json     → PWA manifest
│   └── sw.js             → Service Worker (gerado pelo next-pwa)
└── next.config.ts        → output: 'export', configuração PWA
```

---

## Static Export — regras e restrições

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',       // Gera pasta out/ com arquivos estáticos
  trailingSlash: true,    // Necessário para Nginx servir corretamente
  images: {
    unoptimized: true,    // next/image não funciona com export sem loader externo
  },
};
```

**Implicações obrigatórias:**
- **Sem middleware** de servidor — proteção de rota é feita no cliente
- **Sem Route Handlers** (`/app/api/`) — toda chamada vai para `/api/*` no Fastify
- **Sem Server Actions** — não disponíveis em Static Export
- **Sem `cookies()` ou `headers()`** server-side — usar `document.cookie` ou localStorage

---

## Autenticação — fluxo client-side

Sem middleware de servidor, o guard de auth vive no layout do grupo `(app)`:

```typescript
// app/(app)/layout.tsx
'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AppLayout({ children }) {
  const { session, loading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [session, loading, router]);

  if (loading || !session) return null; // ou um spinner

  return <SidebarLayout>{children}</SidebarLayout>;
}
```

**GoTrue SDK** gerencia tokens automaticamente:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

Tokens ficam em `localStorage` via SDK (não HttpOnly cookie — restrição do Static Export).  
Refresh token é renovado automaticamente pelo GoTrue SDK.

---

## Estado global — Zustand

```typescript
// store/auth.ts
interface AuthState {
  session: Session | null;
  perfil: Perfil | null;
  empresaId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

```typescript
// store/op.ts
interface OPState {
  opAtiva: OP | null;
  turnoAtivo: Turno | null;
  setOpAtiva: (op: OP) => void;
  iniciarTurno: (dados: InicioTurno) => Promise<void>;
  registrarParada: (motivo: MotivoParada) => Promise<void>;
  finalizarTurno: (dados: FimTurno) => Promise<void>;
}
```

---

## Visibilidade por perfil — navegação sidebar

| Item de menu | Master | Admin | TI | PCP | Operação | Manut. | Almox |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Ordens de Produção | ✓ | ✓ | ✓ | ✓ | ✓ (próprias) | — | — |
| Máquinas | ✓ | ✓ | — | ✓ | — | — | — |
| Paradas | ✓ | ✓ | — | ✓ | — | ✓ | — |
| Solicitações | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Relatórios | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Usuários | ✓ | ✓ | ✓ | — | — | — | — |
| Integração Protheus | ✓ | — | ✓ | — | — | — | — |
| Empresas | ✓ | — | — | — | — | — | — |

A sidebar lê `perfil` do Zustand store e filtra os itens antes de renderizar.  
Rotas não autorizadas redirecionam para a tela inicial do perfil, nunca para 403.

---

## PWA — Service Worker e offline

```typescript
// next.config.ts
import withPWA from 'next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/mes\.amafil\.local\/api\//,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache', expiration: { maxAgeSeconds: 300 } },
    },
  ],
})({ output: 'export', trailingSlash: true });
```

### Estratégia de cache

| Recurso | Estratégia |
|---|---|
| JS, CSS, ícones | Cache-first (imutável após deploy) |
| Lista de OPs, máquinas | Stale-while-revalidate (5 min) |
| Dados de apontamento ativo | Network-first |
| Dashboard em tempo real | Network-only (exibe aviso "modo offline" se falhar) |

### Fila offline — IndexedDB

Operações feitas sem conexão são salvas no IndexedDB e enviadas ao reconectar:

```typescript
// lib/offline.ts
const DB_NAME = 'mes-offline';

export async function enqueueOfflineAction(action: OfflineAction) {
  const db = await openDB(DB_NAME, 1);
  await db.add('queue', { ...action, timestamp: Date.now() });
}

export async function flushOfflineQueue() {
  const db = await openDB(DB_NAME, 1);
  const items = await db.getAll('queue');
  for (const item of items) {
    await sendToAPI(item); // envia ao Fastify
    await db.delete('queue', item.id);
  }
}
```

| Operação | Offline | Comportamento |
|---|---|---|
| Iniciar turno | ✓ | IndexedDB → sync ao reconectar |
| Registrar parada | ✓ | IndexedDB → sync ao reconectar |
| Finalizar turno | ✓ | IndexedDB → sync ao reconectar |
| Enviar solicitação | ✓ | IndexedDB → sync ao reconectar |
| Dashboard em tempo real | ✗ | Exibe dados em cache + banner "modo offline" |

---

## Realtime — Supabase subscriptions

Usado para atualizar status de OPs e máquinas sem polling:

```typescript
// hooks/useOPsRealtime.ts
useEffect(() => {
  const channel = supabase
    .channel('ops-status')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'tenant',
      table: 'ordens_producao',
      filter: `empresa_id=eq.${empresaId}`,
    }, (payload) => {
      updateOPNoStore(payload.new);
    })
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}, [empresaId]);
```

---

## Formulários — React Hook Form + Zod

```typescript
const schema = z.object({
  quantidade_produzida: z.number().min(0),
  perda_embalagem: z.number().min(0).default(0),
  perda_reembalagem: z.number().min(0).default(0),
  laboratorista_id: z.string().uuid(),
  encarregado_id: z.string().uuid(),
});

const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

---

## Design system — referência obrigatória

Consultar [design-system.md](./design-system.md) para:
- Paleta de cores e tokens CSS
- Componentes KPI Card, Badge de Status, Machine Card, Gauge OEE
- Tipografia (Inter como fonte principal)
- Layout sidebar + content area

---

## Chamadas à API Fastify

```typescript
// lib/api.ts
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const { session } = useAuthStore.getState();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      ...options?.headers,
    },
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

Nunca chamar `/api/*` sem o token — retorna 401 e o Zustand redireciona para login.

---

## Responsividade

- Design mobile-first: otimizado para tablet 10" (1280×800)
- Breakpoints Tailwind: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Sidebar colapsa em telas menores (`md` para baixo)
- Tabelas com scroll horizontal em mobile
- Botões de ação com área mínima de toque de 44×44px

---

## Regras obrigatórias

1. **Static Export** — nunca usar `getServerSideProps`, `cookies()` server-side, Route Handlers ou Server Actions
2. **Guard de auth no layout** `(app)/layout.tsx` — toda página protegida passa por ele
3. **Sidebar filtra itens por perfil** — nunca renderizar item não autorizado mesmo que rota esteja acessível
4. **Formulários com Zod** — nunca enviar dados sem validação client-side
5. **Offline queue** — operações de apontamento sempre tentam IndexedDB se a requisição falhar
6. **Realtime** — fechar canal no `useEffect` cleanup para evitar leak de conexão
7. **Tokens em localStorage** via GoTrue SDK — não tentar mover para cookie HttpOnly (incompatível com Static Export)
8. `trailingSlash: true` no `next.config.ts` — necessário para Nginx servir corretamente

---

## Referências

- [PRD Infra — seção 6, 11](../PRD/PRD_infra.md)
- [PRD Geral — seções 9, 11](../PRD/PRD_geral.md)
- [Skill: Design System](./design-system.md)
- [Skill: Banco de dados / Supabase](./supabase.md)
- [Skill: Regras de negócio MES](./mes.md)
