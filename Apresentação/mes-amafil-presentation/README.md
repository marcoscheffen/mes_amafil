# MES Amafil — Apresentação

App de apresentação/pitch do Sistema MES para a Amafil. Slides interativos cobrindo visão geral do sistema, módulos, integração com Hikrobot e próximos passos.

## Ferramentas e versões

| Ferramenta | Versão |
|---|---|
| Node.js | 25.x |
| React | 19.x |
| TypeScript | 5.8.x |
| Vite | 6.x |
| TailwindCSS | 4.x |
| Motion | 12.x |

## Conteúdo da apresentação

**Ordem dos slides:** após a capa vêm o slide institucional da [Soma Solution](https://www.somasolution.com.br/) (marcas e presença nacional), depois Markem-Imaje, CoLOS, Datec, Hikrobot, pitch do MES e conclusão.

- Problema atual (formulários físicos de OP)
- Solução proposta (MES digital + integração Protheus)
- Módulos do sistema (Dashboard, OPs, Execução, Paradas, Solicitações, Mensagens)
- Integração com Hikrobot (câmeras SC3000 para inspeção visual)
- Stack tecnológico e arquitetura
- Slide de linha de embalagem: gateway central (embaladora, dosagem, balança, enfardadeira; opcional OCR/leitura de código via Hikrobot SC3000), saídas para banco/MES e IO (torre de alarme, intertravamento), lógica de perdas e confirmação por fardo
- Próximos passos e roadmap

## Como executar

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev
# Disponível em http://localhost:3000
```

## Variáveis de ambiente

```env
GEMINI_API_KEY=   # Chave da API Gemini (se necessário para demos ao vivo)
```

Copie `.env.example` para `.env.local` e preencha se necessário.

## Referências

- [PRD Apresentação](../../PRD/PRD_apresentação.md) — roteiro e conteúdo dos slides
- [PRD Hikrobot](../../PRD/PRD_hikrobot.md) — detalhes da integração com câmeras
- [README raiz](../../README.md) — visão geral do projeto MES
