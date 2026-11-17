# AssistPro Monitor — Windows

Aplicativo complementar para selecionar uma região da tela, fazer OCR contínuo dos multiplicadores visíveis e registrar resultados na API do Monitor Aviator.

## Gerar EXE
O GitHub Actions gera o pacote Windows em **Actions → Build AssistPro Monitor for Windows → Artifacts**. O ZIP contém o executável e dependências.

## Uso
1. Extraia o ZIP e abra `AssistPro-Monitor.exe`.
2. Selecione a região onde aparece o multiplicador.
3. Clique em iniciar.
4. Confira os resultados no painel https://monitor-aviator.netlify.app.

O monitor só lê o que está visível na tela. Não acessa contas, não interage com apostas e não prevê resultados. OCR pode errar; confira os dados registrados.
