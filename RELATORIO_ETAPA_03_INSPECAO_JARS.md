# Relatório técnico — etapa 3: inspeção estrutural dos JARs

**Projeto:** Monitoramento Aviator / análise dos pacotes recebidos do cliente  
**Repositório:** `Alexandrexicara/monitoramento-certo`  
**Data:** 15/11/2026  
**Escopo:** leitura remota dos arquivos JAR pelo conteúdo Base64 do GitHub, sem alterar ou executar os binários originais.

## 1. Resultado mais importante

A inspeção estrutural dos três arquivos `trel.jar` identificou que eles têm a mesma estrutura geral e os mesmos nomes de classes Java, mas **o conteúdo compilado das seis classes é diferente nas três versões**. Portanto, não são apenas diferenças de aparência ou CSS: há diferenças no bytecode Java.

Isso torna necessário comparar o comportamento das três versões antes de escolher definitivamente qual será a base do produto.

## 2. Arquivos analisados

| Pacote | Caminho do JAR | Tamanho | SHA-1 Git |
|---|---|---:|---|
| Raiz | `Addins/browser/searchplugins/app/trel.jar` | 143.051 bytes | `9e07dc766788a0301c2cf391709525edc22bcfdc` |
| AsistMinesPro | `AsistMinesPro/Addins/browser/searchplugins/app/trel.jar` | 180.420 bytes | `6a9973aef7c30e5dbab12b27d2ec7a873ff0a7c6` |
| AsistPro | `AsistPro/Addins/browser/searchplugins/app/trel.jar` | 359.219 bytes | `8131adf11cae234f4f0d0ebae34d7f6662a916ed` |

Cada JAR contém 13 entradas. Os três incluem seis classes com os mesmos nomes:

- `app/Main.class`
- `app/Main$ConstantPool.class`
- `app/forms/HomeFormController.class`
- `app/forms/HomeFormController$1.class`
- `app/forms/HomeFormController$ConstantPool.class`
- `app/forms/HomeFormController$1$ConstantPool.class`

As seis classes apresentam CRC-32 e tamanhos descompactados diferentes entre as versões. Isso confirma que o conteúdo das classes não é idêntico.

## 3. Recursos identificados

Os JARs contêm:
- Manifesto `META-INF/MANIFEST.MF`;
- interface JavaFX em `app/forms/HomeForm.fxml`;
- folhas de estilo CSS;
- imagens de interface;
- classes Java para a janela principal e seu controlador.

A presença de `HomeForm.fxml` e classes `HomeFormController` indica uma interface desktop baseada em JavaFX. Isso, isoladamente, **não prova** que o aplicativo monitore o Aviator nem revela como recebe dados do jogo.

## 4. O que ainda não foi comprovado

Nesta etapa não foi possível descompactar e desassemblar o bytecode das classes no ambiente de leitura do GitHub. Assim, ainda não estão confirmados:

1. Endereços de servidores, APIs ou WebSockets usados pelo programa;
2. Captura de tela, leitura do navegador ou interceptação de dados;
3. Existência de autenticação, licença ou serviço remoto;
4. Uso de IA ou modelo de machine learning;
5. Capacidade real de identificar rodadas e multiplicadores do Aviator;
6. Existência de banco de dados local ou remoto.

Também não há evidência suficiente para afirmar que os pacotes já contenham Neon, PostgreSQL ou uma API própria.

## 5. Executáveis principais

A análise anterior identificou que `StakeCrash.exe`, `AsistMinesPro/AsistMines.exe` e `AsistPro/AsistPro.exe` são binariamente idênticos (mesmo SHA Git e mesmo tamanho). Portanto, trocar apenas o nome do EXE não muda o programa executado. A diferença funcional pode estar em recursos, configuração ou no JAR carregado por cada pacote.

## 6. Recomendação técnica

- Manter os três pacotes originais intactos.
- Não declarar ainda um vencedor entre AsistPro e AsistMinesPro: os bytecodes diferem e precisam ser examinados.
- Usar AsistPro apenas como candidato inicial para um teste isolado, não como versão tecnicamente aprovada.
- Fazer a próxima etapa em uma cópia de trabalho, em máquina virtual ou ambiente Windows isolado.
- Descompactar os JARs, comparar manifestos, FXML, CSS e strings das classes; em seguida, analisar metadados PE, assinatura digital, imports e strings dos EXEs/DLLs.
- Executar o programa apenas após verificação de segurança, junto a uma versão legítima de demonstração do jogo, e registrar se detecta início/fim de rodada e multiplicador.
- Não automatizar apostas, não contornar controles do operador e não usar credenciais reais nos testes.

## 7. Arquitetura proposta caso a prova de conceito funcione

1. **Coletor Windows:** aproveita o mecanismo comprovado do programa existente ou uma integração autorizada; captura e normaliza eventos.
2. **API própria:** recebe eventos autenticados e registra origem, horário, versão do coletor e qualidade da leitura.
3. **Neon/PostgreSQL:** armazena contas, sessões, eventos e histórico.
4. **Motor estatístico/IA:** calcula indicadores retrospectivos, distribuições, alertas de qualidade e anomalias. Não deve prometer prever o próximo resultado aleatório.
5. **Painel web responsivo:** permite acompanhar pelo computador e celular; o celular pode visualizar os dados enviados pelo coletor Windows.
6. **Coleta direta no celular:** somente numa fase separada, se houver uma fonte de dados autorizada e tecnicamente acessível no Android.

## 8. Critérios para aprovar a prova de conceito

A prova de conceito deverá medir, em sessões de demonstração:
- quantidade de rodadas observadas;
- quantidade de rodadas corretamente registradas;
- leituras duplicadas ou ausentes;
- diferença entre multiplicador exibido e capturado;
- latência entre evento na tela e registro;
- estabilidade após reconexão e mudança de sessão.

A taxa de acerto de qualquer classificação ou sinal deverá ser calculada em amostra separada, com regra definida antes do teste e comparação contra uma referência simples. Não se deve selecionar retrospectivamente apenas as rodadas favoráveis.

## 9. Conclusão para o cliente

A auditoria confirmou que os pacotes contêm uma aplicação JavaFX e que as três versões do JAR possuem implementações compiladas diferentes. Ainda não foi comprovado que o monitor se conecta ao Aviator nem que registra resultados corretamente. A próxima entrega é uma prova de conceito controlada; somente depois dela será possível estimar com responsabilidade o esforço de correção, integração com banco de dados e desenvolvimento do painel multiplataforma.

**Status:** análise estrutural concluída; engenharia reversa do bytecode e teste funcional ainda pendentes.  
**Integridade:** nenhum arquivo original foi modificado ou executado.
