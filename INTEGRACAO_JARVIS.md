# Integração Jarvis + Monitor Aviator

Esta integração adiciona supervisão de leitura ao Monitor Aviator existente. Ela não substitui o painel, os coletores, os binários originais nem a API atual.

## Fluxo

1. O Jarvis consulta periodicamente `GET /api/agent/summary`.
2. A API devolve estado do banco, total de rodadas, rodadas na última hora e a última rodada conhecida.
3. O Jarvis mantém o último estado de supervisão e registra mudanças em `POST /api/agent/events`.
4. Os eventos ficam em `jarvis_agent_events` no Neon quando `DATABASE_URL` está configurada.
5. O painel administrativo do Jarvis consulta `GET /v1/monitor-aviator/status`.

## Variáveis no Render do Monitor API

- `JARVIS_AGENT_TOKEN`: segredo aleatório forte, compartilhado somente entre os dois serviços.
- `DATABASE_URL`: conexão Neon já usada pelo Monitor Aviator.
- `COLLECTOR_TOKEN`: token independente usado pelo coletor de rodadas.

## Variáveis no Render do Jarvis

- `MONITOR_AVIATOR_API_URL`: URL HTTPS pública do serviço monitor-api, sem barra no final.
- `MONITOR_AVIATOR_AGENT_TOKEN`: o mesmo valor de `JARVIS_AGENT_TOKEN`.
- `MONITOR_AVIATOR_POLL_SECONDS`: intervalo em segundos (padrão 60; mínimo 30).

Configure os segredos diretamente nos painéis dos provedores. Não os grave no GitHub, não os envie pelo chat e não reutilize a chave NVIDIA, a chave do worker ou credenciais do Proofable.

## Endpoints

- `GET /api/agent/summary` — resumo autenticado para o Jarvis.
- `POST /api/agent/events` — grava evento de supervisão autenticado.
- `GET /api/agent/events?limit=30` — consulta eventos autenticados.
- `GET /v1/monitor-aviator/status` — estado mais recente conhecido pelo Jarvis, protegido pela chave administrativa do Jarvis.

## Limites de segurança e funcionamento

- O token do Jarvis é separado do token do coletor.
- A integração é somente leitura para os dados de rodadas; o Jarvis não altera multiplicadores, não executa apostas e não controla contas do jogo.
- A supervisão identifica indisponibilidade e registra transições. Ela não corrige automaticamente dados nem modifica arquivos do Monitor Aviator.
- A captura automática do Aviator continua dependendo de um coletor autorizado e validado. O painel existente ainda aceita entrada manual.
- Proofable permanece como camada separada de identidade, delegação e evidências. A delegação do Jarvis ainda precisa ser ativada no Proofable; esta integração não contorna essa aprovação.
- Não faça deploy em produção até revisar as branches e configurar os segredos. Faça primeiro o teste em ambiente de homologação.
