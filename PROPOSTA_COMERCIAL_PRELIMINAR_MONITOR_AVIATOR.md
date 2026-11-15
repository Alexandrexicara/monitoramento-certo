# Proposta comercial preliminar — Monitor Aviator

**Data:** 15/11/2026  
**Status:** estimativa inicial, sujeita à prova de conceito técnica.

## Objetivo

Aproveitar, quando tecnicamente viável e com autorização do titular, os componentes dos programas entregues pelo cliente; corrigir o mecanismo de monitoramento; criar uma infraestrutura própria para registrar dados e disponibilizar um painel acessível por computador e celular.

O projeto é de monitoramento e análise estatística. Não inclui promessa de prever resultados aleatórios, garantir sinais vencedores ou assegurar uma taxa fixa de acerto.

## Escopo e estimativa

| Etapa | Entrega | Estimativa |
|---|---|---:|
| 1. Auditoria e prova de conceito | Inspeção aprofundada dos JARs/EXEs, verificação de segurança e teste controlado de captura de rodadas em ambiente autorizado | **R$ 2.000** |
| 2. Monitor e infraestrutura | Adaptação do coletor Windows, API própria, banco Neon/PostgreSQL, autenticação e registro de histórico | **R$ 7.500–10.000** |
| 3. Painel web e análise | Painel responsivo para PC/celular, histórico, gráficos, indicadores estatísticos, qualidade da coleta e avaliação retrospectiva | **R$ 4.000–6.000** |

**Estimativa total preliminar: R$ 13.500 a R$ 18.000**, incluindo a etapa inicial, se a prova de conceito confirmar que há uma fonte de dados tecnicamente acessível e que os componentes podem ser aproveitados.

## Prazo preliminar

- Etapa 1: 2 a 4 dias úteis após receber os arquivos localmente e ter acesso ao ambiente de teste.
- Etapas 2 e 3: aproximadamente 3 a 6 semanas após aprovação da prova de conceito, dependendo da compatibilidade e da fonte de dados.

Os prazos são estimativas e serão confirmados após o teste funcional.

## Critérios de aceite da prova de conceito

A prova de conceito deve medir:
- rodadas observadas e corretamente registradas;
- multiplicadores capturados versus os exibidos;
- rodadas ausentes e duplicadas;
- latência da captura;
- estabilidade e recuperação após desconexões.

A taxa de acerto de eventuais classificações ou indicadores será calculada em dados separados dos usados para desenvolvimento, com critério definido previamente. Não se promete acertar 4, 5 ou 10 rodadas em cada grupo de dez.

## Infraestrutura e custos recorrentes

Hospedagem, banco de dados, domínio, serviços de terceiros e eventuais licenças serão discriminados à parte, conforme os planos escolhidos e o volume de utilização. Não estão incluídos nos valores de desenvolvimento.

## Condições e limites

- Os arquivos originais serão preservados.
- O aproveitamento do software recebido depende da confirmação de funcionamento, segurança e direito de modificação/redistribuição.
- O teste será realizado com uma versão legítima de demonstração ou fonte autorizada, sem automação de apostas ou tentativa de contornar controles do operador.
- A coleta direta no celular é uma evolução condicionada à disponibilidade de uma fonte compatível; inicialmente, o coletor Windows poderá enviar os dados para o painel móvel.
- Se a prova de conceito demonstrar que o programa não consegue obter os dados necessários, a arquitetura e o orçamento da etapa seguinte serão reavaliados antes de qualquer contratação.

## Recomendação comercial

Contratar primeiro a Etapa 1 por R$ 2.000. Com o resultado documentado, o cliente aprova ou não a implementação completa. Isso reduz o risco de cobrar por uma solução cuja fonte de dados ainda não foi comprovada.
