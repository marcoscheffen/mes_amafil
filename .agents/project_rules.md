# Regras e Diretrizes Gerais do Projeto

Este arquivo define as regras fundamentais que o agente de inteligência artificial e os desenvolvedores devem sempre seguir durante a manutenção, expansão e evolução do sistema.

## 1. Priorização do Uso de Skills
- Todas as operações devem ser guiadas pelas diretrizes já estabelecidas na pasta `.agents/` (Skills do Projeto).
- **Consulte antes de agir**: Antes de executar ações padronizadas como versionamento (Git), implantação (Deploy) ou formatação (Lint), verifique se há uma "Skill" (arquivo `.md`) na pasta de agentes definindo as regras daquele fluxo e a siga rigorosamente.
- Priorize a aplicação do conhecimento documentado para manter a padronização do código.

## 2. Manutenção Contínua da Documentação (README)
- A documentação é viva. É **obrigatório** revisar e, se necessário, atualizar os arquivos de documentação (como o `README.md` na raiz e o `github/README.md`) sempre que houver alterações substanciais no código.
- Cenários de atualização obrigatória:
  - Adição ou remoção de dependências ou bibliotecas principais.
  - Criação de novos módulos ou páginas vitais.
  - Mudanças na forma de inicialização ou execução do projeto.
  - Alterações no fluxo geral do sistema ou arquitetura.
- A atualização do README deve ocorrer de preferência antes ou durante o commit das funcionalidades alteradas.
