# Complemento da auditoria — comparação entre as pastas

Data: 15/11/2026  
Repositório: https://github.com/Alexandrexicara/monitoramento-certo  
Branch: main

## Comparação atualizada

Após a inclusão do relatório inicial, a árvore passou a conter 798 itens: 709 arquivos e 89 diretórios.

As pastas `AsistMinesPro/` e `AsistPro/` contêm 236 arquivos cada. A comparação por caminho relativo e hash encontrou somente duas diferenças:
- O nome do executável: `AsistMines.exe` versus `AsistPro.exe`. Os dois arquivos têm o mesmo hash Git e o mesmo tamanho.
- O arquivo `Addins/browser/searchplugins/app/trel.jar` tem tamanho e hash diferentes entre as pastas (180.420 bytes na pasta AsistMinesPro e 359.219 bytes na pasta AsistPro).

Todos os demais arquivos encontrados nessas duas pastas têm o mesmo caminho relativo e o mesmo hash. Isso é uma evidência forte de que os pacotes compartilham praticamente toda a mesma distribuição, com a diferença observável concentrada nesse JAR e no nome do EXE.

O executável `StakeCrash.exe` também tem o mesmo hash Git dos dois executáveis acima.

## O que esta comparação permite concluir

1. Não há três executáveis independentes: os três EXE são idênticos em conteúdo.
2. As pastas AsistMinesPro e AsistPro são quase duplicatas completas; a diferença técnica visível mais relevante é o JAR `trel.jar`.
3. O JAR merece inspeção própria para identificar seu conteúdo, dependências e possível função. O nome do arquivo, sozinho, não permite concluir sua finalidade.
4. O conjunto contém muitos componentes de runtime e browser. Isso ainda não demonstra que o aplicativo capture dados do Aviator.

## Limitação técnica atual

A conexão GitHub utilizada nesta auditoria lê arquivos de texto e metadados Git, mas não entrega o conteúdo binário de EXE, DLL ou JAR para análise de cabeçalhos PE, imports, strings, assinatura digital ou conteúdo interno de JAR. Assim, a identificação exata de linguagem, framework e comportamento do aplicativo continua pendente.

## Plano de trabalho seguro

### Fase A — inventário e identificação
- Preservar os arquivos originais e registrar hashes SHA-256 locais.
- Examinar metadados PE, assinatura digital, imports e strings dos EXE/DLL sem executar os programas.
- Inspecionar o manifesto e a listagem interna dos dois JARs.
- Identificar versões, origem e licenças das dependências.

### Fase B — comportamento em laboratório
- Se a análise estática não indicar risco, executar cada pacote em máquina virtual isolada, sem credenciais reais e sem acesso a contas de apostas.
- Registrar telas, processos filhos, arquivos criados e conexões de rede.
- Não enviar apostas, não automatizar cliques de aposta e não tentar contornar controles do site.

### Fase C — produto novo
- Criar um coletor separado e auditável para dados obtidos de fonte autorizada ou de histórico exportado.
- Validar timestamps, multiplicadores, duplicatas e lacunas.
- Persistir eventos e métricas em PostgreSQL/Neon.
- Expor API e painel com histórico, gráficos, filtros e indicadores estatísticos.
- Testar com dados sintéticos e históricos; apresentar incerteza e evitar promessas de previsão.

## Próxima decisão técnica

A prioridade é obter uma cópia local dos binários para análise estática, ou acesso a uma estação Windows isolada que já contenha os arquivos. Até essa etapa, não é tecnicamente correto declarar que os executáveis leem o Aviator ou recomendar reaproveitamento do código interno.
