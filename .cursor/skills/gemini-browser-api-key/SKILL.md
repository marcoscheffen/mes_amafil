---
name: gemini-browser-api-key
description: >-
  Orienta uso de @google/genai (GoogleGenAI) em apps React/Vite no navegador:
  evitar inicialização no carregamento do módulo, checar GEMINI_API_KEY antes de
  instanciar e não derrubar o app inteiro quando a chave faltar. Usar quando houver
  Gemini no frontend, GEMINI_API_KEY, Vite define, erro "API Key must be set when running
  in a browser", ou nova tela com GoogleGenAI importada pelo App/router.
---

# Gemini (@google/genai) no browser com Vite

## Problema

O SDK **`@google/genai`** lança erro no **browser** se `GoogleGenAI` for criado **sem apiKey válida**. Se isso ocorrer no **topo do módulo** (fora de funções/handlers), qualquer **`import`** desse arquivo (ex.: página importada pelo `App.tsx`) **executa na carga inicial** — o erro pode **impedir o React de montar** e a UI inteira ficar em branco.

## Regras

1. **Nunca** fazer no topo do arquivo:
   ```ts
   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
   ```
   quando o módulo puder ser importado antes da rota que realmente usa a IA.

2. **Instanciar só no fluxo que chama** a API (ex.: função disparada por upload/clique), **depois** de validar a chave.

3. Validar assim (ajuste o nome da env se o projeto usar outro):
   ```ts
   const apiKey = process.env.GEMINI_API_KEY?.trim();
   if (!apiKey) {
     // UI: mensagem clara ao usuário; não lançar de forma não tratada no mount
     return;
   }
   const ai = new GoogleGenAI({ apiKey });
   ```

4. **Não embutir** chave real no código; usar `.env` no frontend e **documentar** em `.env.example`.

## Vite (este repositório)

Em `vite.config.ts`, a chave costuma ser injetada com `loadEnv` + `define`, por exemplo:

- `loadEnv(mode, '.', '')` para ler `.env`
- `'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)`

Após mudar `.env`, **reiniciar** o servidor de desenvolvimento.

Referência atual: `frontend/mes-amafil/vite.config.ts` (e cópias equivalentes sob `frontend/version/`).

## Padrão de UX quando não há chave

- Permitir navegar pelo app normalmente.
- Na ação que depender da IA (OCR, etc.), mostrar mensagem objetiva pedindo **GEMINI_API_KEY** + reinício do Vite, ou fluxo alternativo (ex.: liberação manual), em vez de deixar o erro do SDK propagar como **uncaught** na inicialização.

## Verificação

- Sem chave em `.env`: app abre (`/`), rotas relacionadas montam.
- Console do navegador: **sem** `An API Key must be set when running in a browser` no **primeiro** load apenas por import da página.
