# Avaliação do primeiro provider

Revisão realizada em 27 de setembro de 2026. Links, cobertura, limites e termos
devem ser conferidos novamente antes de contratar ou integrar um provider.

## Decisão

O [Sportradar MMA API v2](https://developer.sportradar.com/mma/reference/mma-overview)
é o candidato preferencial para uma avaliação comercial focada em UFC. O
[SportsDataIO MMA API](https://sportsdata.io/developers/workflow-guide/mma) é a
segunda opção.

Nenhum provider está aprovado para integração neste momento. Os dois exigem
confirmação comercial dos direitos de exibição no aplicativo, preço, limites e
retenção. Não será criado adapter, migration, job ou segredo até essa aprovação.
ONE Championship e RWS continuam no fluxo administrativo/manual porque não foi
identificada uma API pública e autorizada para essas organizações nesta revisão.
O [pedido comercial](provider-commercial-request.md) contém mensagens prontas e
o critério de aceite para concluir essa aprovação.

## Comparação

| Critério | Sportradar MMA v2 | SportsDataIO MMA |
| --- | --- | --- |
| Cobertura documentada | UFC e Dana White's Contender Series | UFC, UFC Fight Night e Dana White's Contender Series |
| Agenda e card | Sim | Sim |
| Alterações e remoções | Feeds específicos de eventos atualizados e removidos | Status e atualização dos eventos; confirmar comportamento de remoção no contrato |
| Datas e timezone | Timestamps ISO 8601 em UTC e timezone do venue | Datas e horários em US Eastern Time |
| Contrato técnico | OpenAPI, JSON/XML, IDs estáveis e API key | OpenAPI, JSON/XML e API key |
| Avaliação | Trial; uso somente para avaliação | Trial com dados embaralhados, impróprios para exibição |
| Produção | Contrato e propriedades autorizadas | Contrato comercial e preço conforme uso/volume |
| Limitação principal | Não cobre ONE/RWS e preço público não disponível | Não cobre ONE/RWS; timezone exige normalização explícita |

O Sportradar fica em primeiro lugar porque timestamps UTC, timezone do venue e
feeds de mudança/remoção reduzem ambiguidade na reconciliação. A escolha não é
uma aprovação jurídica ou financeira.

## Fontes oficiais consultadas

- [Sportradar MMA: cobertura e recursos](https://developer.sportradar.com/mma/reference/mma-overview)
- [Sportradar MMA: integração, estados e timestamps](https://developer.sportradar.com/mma/reference/mma-faq)
- [Sportradar: termos do trial e da produção](https://developer.sportradar.com/sportradar-updates/page/terms-and-conditions)
- [SportsDataIO: formas de acesso, trial e produção](https://sportsdata.io/developers)
- [SportsDataIO: workflow e cobertura MMA](https://sportsdata.io/developers/workflow-guide/mma)
- [SportsDataIO: contrato OpenAPI](https://sportsdata.io/developers/sports-data-open-api-swagger-files)
- [UFC: termos que proíbem page scraping e acesso automatizado não autorizado](https://www.ufc.com/terms)
- [ONE: licença do site limitada a uso pessoal e não comercial](https://www.onefc.com/general-terms-and-conditions/)

## Gate de aprovação

O proprietário do produto deve obter por escrito, para o provider escolhido:

1. preço e moeda, duração mínima, SLA e limite de requisições;
2. cobertura exata de organizações, eventos e cards;
3. autorização para exibir os dados no aplicativo Android e na API pública;
4. regras de atribuição, cache, retenção e remoção após o fim do contrato;
5. disponibilidade territorial, inclusive Brasil;
6. uso permitido em desenvolvimento, CI e ambientes de homologação;
7. processo para correções, cancelamentos e indisponibilidade do feed.

Depois da aprovação, a primeira implementação deve ser um spike isolado do
adapter com credencial apenas no servidor, usando payloads do trial como
fixtures sanitizadas. `Source`, `ExternalMapping` e `IngestionRun` entram apenas
junto desse primeiro fluxo real. Worker, Redis e agendamento continuam adiados
até existir uma necessidade assíncrona comprovada.
