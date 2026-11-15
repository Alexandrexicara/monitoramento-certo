# Aviator AI Monitor — análise técnica inicial

Data: 15/11/2026  
Repositório: https://github.com/Alexandrexicara/monitoramento-certo  
Branch analisada: main

## 1. Escopo e integridade

A análise foi feita pela árvore Git recursiva do repositório. Foram encontrados 797 itens na árvore (arquivos e diretórios). Os arquivos originais não foram alterados.

Itens principais na raiz:
- `StakeCrash.exe` — 5.676.816 bytes
- `msvcp140_1.dll` — 35.952 bytes
- Diretórios `AsistMinesPro/`, `AsistPro/`, `Addins/` e `language/`

Dentro das duas pastas de assistentes também existem executáveis:
- `AsistMinesPro/AsistMines.exe` — 5.676.816 bytes
- `AsistPro/AsistPro.exe` — 5.676.816 bytes

Os três executáveis acima têm o mesmo Git blob SHA: `b00b2ed710ae89b868d6d01a1070d2285891b02c`. Isso confirma que são cópias byte a byte do mesmo arquivo, embora tenham nomes diferentes. Portanto, não há evidência de três motores executáveis independentes.

## 2. Componentes identificados

Contagem por extensão na árvore:
- DLL: 396
- EXE: 15
- XML: 27
- JAR: 9
- PROPERTIES: 12
- MD: 72
- demais arquivos: recursos de runtime, certificados, configurações e dados.

Há um runtime Java incluído em `Addins/browser/searchplugins/runtime/`, com executáveis como `java.exe` e `javaw.exe`. Também existem plugins de pesquisa XML para Bing, DuckDuckGo, Ecosia, Ekoru, Mojeek, Wikipedia e Yahoo.

## 3. Indício relevante: componente Ditto

O arquivo `language/English.xml` declara:
- raiz XML `Ditto_Language_File`
- autor `Scott Brogden`
- textos de interface como grupos, histórico de clips, atalhos, colar texto/HTML, importar/exportar clips e desconectar do clipboard.

Também existe `Addins/DittoUtil.dll`. Isso é forte evidência de que há componentes relacionados ao gerenciador de área de transferência Ditto no pacote. Ainda não prova, por si só, que toda a aplicação principal seja o Ditto ou que não exista lógica adicional.

## 4. O que ainda não está comprovado

A integração GitHub consegue listar e ler arquivos de texto, mas não fornece o conteúdo binário dos EXE, DLL e JAR para desassemblagem/análise estática completa. Por isso, ainda não foi possível confirmar:
- linguagem e framework exatos do executável principal;
- telas, menus e funções efetivamente implementadas;
- se existe captura de dados do Aviator;
- origem dos dados, APIs, WebSocket ou leitura de tela;
- se há lógica estatística específica para Mines, Crash ou Aviator;
- comportamento de rede e armazenamento.

Não se deve afirmar que os executáveis monitoram o jogo antes de verificar essas questões.

## 5. Conclusão técnica preliminar

Neste momento, o repositório parece conter três nomes/pastas para cópias de um mesmo executável, acompanhado por um conjunto grande de bibliotecas e recursos de navegador/runtime. As diferenças entre as pastas podem estar em arquivos auxiliares, mas os executáveis principais comparados são idênticos.

O indício de Ditto/clipboard merece investigação antes de reutilizar qualquer componente no Aviator AI Monitor. Não executar os binários em máquina de produção. A próxima etapa segura é obter metadados e análise estática dos binários em ambiente isolado, além de documentação ou capturas das telas dos programas em funcionamento.

## 6. Arquitetura recomendada para o futuro Aviator AI Monitor

A recomendação é construir um sistema novo e modular, reutilizando somente componentes cuja função, licença e segurança sejam confirmadas:

1. **Coletor de dados:** fonte autorizada e documentada; preferir API oficial ou exportação de histórico. Não contornar proteções nem automatizar apostas.
2. **Validação e normalização:** validar sequência, horário, multiplicador, duplicatas e lacunas.
3. **Armazenamento:** PostgreSQL/Neon para histórico e auditoria.
4. **Motor estatístico:** frequências, distribuição, volatilidade, janelas móveis e métricas retrospectivas; sem prometer prever resultados aleatórios.
5. **Backend:** API autenticada para ingestão, consultas e eventos em tempo real.
6. **Frontend:** painel de histórico, gráficos, filtros, indicadores de qualidade dos dados e estado da conexão.
7. **Testes e observabilidade:** dados simulados, testes automatizados, logs e monitoramento de falhas.

## 7. Próximas verificações

- Obter metadados PE (produto, versão, fabricante, arquitetura e assinatura) dos EXE.
- Calcular SHA-256 localmente e comparar os binários.
- Inspecionar imports e strings dos binários sem executá-los.
- Inventariar JARs e DLLs e identificar suas licenças.
- Comparar todos os arquivos auxiliares entre as três pastas.
- Só então decidir o que pode ser aproveitado, substituído ou reimplementado.

**Status:** auditoria inicial de estrutura concluída; análise interna dos binários pendente. Nenhum arquivo original foi modificado.
