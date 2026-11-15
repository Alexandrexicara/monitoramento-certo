# Relatório de inspeção detalhada — etapa 2

Data: 15/11/2026  
Repositório: https://github.com/Alexandrexicara/monitoramento-certo  
Branch: main  
Escopo: inventário recursivo, comparação estrutural e verificação de referências textuais a tecnologias de IA.

## 1. Inventário recursivo atualizado

A árvore Git recursiva retornou 799 itens: 710 arquivos e 89 diretórios. O inventário inclui os dois relatórios de auditoria já adicionados; nenhum binário original foi alterado.

Foram identificados 9 arquivos JAR no total:
- `Addins/browser/searchplugins/app/trel.jar`: 143.051 bytes
- `AsistMinesPro/Addins/browser/searchplugins/app/trel.jar`: 180.420 bytes
- `AsistPro/Addins/browser/searchplugins/app/trel.jar`: 359.219 bytes
- Os outros seis JARs são componentes do runtime Java (incluindo `javafx-swt.jar` e `jrt-fs.jar`) repetidos nas três distribuições.

## 2. Comparação rigorosa das distribuições AsistPro e AsistMinesPro

Cada pasta contém 236 arquivos. A comparação por caminho relativo e SHA Git encontrou três diferenças de entradas:
1. O executável chama-se `AsistPro.exe` numa pasta e `AsistMines.exe` na outra. Ambos têm 5.676.816 bytes e o mesmo blob SHA `b00b2ed710ae89b868d6d01a1070d2285891b02c`; portanto, o conteúdo é idêntico.
2. `Addins/browser/searchplugins/app/trel.jar` difere: 359.219 bytes em AsistPro (SHA `8131adf11cae234f4f0d0ebae34d7f6662a916ed`) e 180.420 bytes em AsistMinesPro (SHA `6a9973aef7c30e5dbab12b27d2ec7a873ff0a7c6`).

Todos os outros 234 arquivos têm caminhos relativos correspondentes e SHA Git idêntico. A diferença funcional potencial mais importante entre os pacotes está, portanto, no conteúdo desses JARs, que ainda precisa ser extraído e inspecionado.

Há ainda um terceiro JAR na pasta Addins da raiz, com 143.051 bytes e SHA `9e07dc766788a0301c2cf391709525edc22bcfdc`. Ele também não é idêntico aos dois JARs internos.

## 3. Runtime Java identificado

O arquivo `Addins/browser/searchplugins/runtime/release` informa:
- `JAVA_VERSION="17.0.2"`
- Módulos incluídos: `java.base`, `java.datatransfer`, `java.xml`, `java.prefs`, `java.desktop`, `java.net.http`, `java.scripting`, `javafx.base`, `javafx.graphics`, `javafx.controls`, `javafx.fxml` e `jdk.unsupported`.

Isso confirma que há um runtime Java 17.0.2 empacotado, com recursos de rede, scripting e interface gráfica JavaFX. A presença desses módulos não prova que o executável principal use todos eles, nem revela o destino das conexões de rede.

## 4. Busca por referências textuais a IA

Foi feita busca no índice de código do GitHub, restrita ao repositório, por termos como `openai`, `nvidia`, `gemini`, `chatgpt`, `artificial intelligence`, `machine learning`, `aviator`, `stake`, `crash`, `websocket` e `api_key`. A busca não retornou correspondências.

Interpretação correta: não foram localizadas referências textuais indexadas a esses termos. Isso não prova ausência de IA, chaves, URLs ou lógica equivalente dentro de EXE, DLL ou JAR, porque esses binários não foram decodificados nem descompilados nesta etapa.

## 5. Limitação técnica que permanece

A tentativa de obter o conteúdo do JAR diretamente pelo conector GitHub falhou porque a resposta é binária e não UTF-8. Portanto, ainda não foi possível ler o manifesto, listar classes, extrair strings, verificar dependências ou comparar o código interno dos três JARs. O mesmo impedimento vale para a análise PE dos EXE e DLL.

Não se deve executar os programas em ambiente de uso diário nem fornecer credenciais de contas de apostas para testes. A próxima etapa é obter os arquivos localmente e fazer análise estática, preferencialmente em ambiente isolado.

## 6. Próximas etapas recomendadas

1. Obter cópias locais dos três JARs, dos EXE principais e das DLLs relevantes, sem substituir os originais.
2. Calcular SHA-256, verificar assinatura Authenticode e metadados PE dos executáveis.
3. Listar o conteúdo dos JARs e comparar manifestos, pacotes, classes e strings.
4. Inspecionar imports e strings dos binários em busca de endpoints, nomes de serviços, tokens acidentais, protocolos e referências a IA.
5. Só depois avaliar comportamento em máquina virtual isolada, sem credenciais reais e sem realizar apostas.
6. Em paralelo, especificar o monitor novo como sistema independente: coleta autorizada, validação de eventos, histórico auditável, métricas estatísticas e painel que exponha incerteza em vez de prometer previsões.

**Conclusão desta etapa:** a estrutura confirma forte duplicação entre AsistPro e AsistMinesPro, com o JAR `trel.jar` como diferença relevante. A busca textual não encontrou referências indexadas a IA, mas a análise interna dos binários continua pendente. Nenhum arquivo original foi modificado.
