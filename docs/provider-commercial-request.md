# Pedido comercial para provider MMA

Este material está pronto para envio, mas precisa ser completado pelo
proprietário do produto. Não inclua chaves de API, documentos pessoais ou dados
de pagamento no repositório.

## Dados a preencher fora do repositório

- nome e sobrenome do responsável;
- nome da empresa ou indicação de projeto individual;
- e-mail e telefone comerciais;
- site da empresa ou página pública do projeto;
- modelo pretendido: gratuito, com anúncios, assinatura ou ainda indefinido;
- estimativa de lançamento, usuários ativos mensais e países atendidos.

## Resumo do produto

Notifica Fight é um aplicativo Android para fãs acompanharem agenda, cards,
resultados, favoritos e notificações de esportes de combate. O MVP atual não
possui apostas, fantasy, conteúdo social ou contas de usuário. A integração com
o provider será exclusivamente server-to-server; nenhuma credencial será
incluída no APK.

O primeiro escopo de dados reais é:

- próximos eventos do UFC;
- horário, timezone, local e status do evento;
- card ordenado e alterações/cancelamentos;
- resultados finais somente em uma etapa posterior;
- exibição em uma API pública read-only e no aplicativo Android;
- cache no PostgreSQL e Room para funcionamento offline.

## Sportradar — candidato preferencial

Canal oficial: [formulário de contato do Sportradar](https://sportradar.com/contact/).
A documentação informa que o produto é B2B e não deve ser chamado diretamente
pelo cliente móvel.

**Subject:** MMA API licensing inquiry for Android combat-sports schedule app

```text
Hello,

We are evaluating Sportradar MMA API v2 for Notifica Fight, an early-stage
Android application for combat-sports fans. The application currently focuses
on upcoming event schedules and fight cards. It has no betting, fantasy, social
features, or public user accounts.

The Sportradar API would be consumed only by our server. Our server would
normalize and cache the data in PostgreSQL and expose a limited read-only REST
API to the Android application. The app also keeps a local Room cache for
offline viewing.

Our initial scope is UFC upcoming events, event status changes, cancellations,
venues, timezones, and ordered fight cards. Final results and notifications may
be added in a later phase.

Could you please provide or confirm:

1. whether the license permits displaying normalized data in our public Android
   app and its supporting read-only API;
2. UFC schedule and fight-card coverage, including update and removal feeds;
3. attribution and branding requirements;
4. permitted server and device cache duration, retention, and backup rules;
5. required deletion or continued display rules after contract termination;
6. availability and territorial rights for Brazil and worldwide distribution;
7. trial, staging, CI, and production usage rights;
8. rate limits, SLA, support, minimum term, setup fees, and recurring pricing;
9. whether a schedule-and-card-only package is available without odds or live
   statistics;
10. whether final fight results can be licensed separately in a later phase.

Expected launch: [FILL IN]
Expected monthly active users: [FILL IN]
Initial countries: [FILL IN]
Business model: [FILL IN]

Kind regards,
[NAME]
[COMPANY OR INDIVIDUAL PROJECT]
[CONTACT DETAILS]
```

## SportsDataIO — alternativa

Canal oficial: [formulário comercial do SportsDataIO](https://sportsdata.io/contact-us)
ou `sales@sportsdata.io`.

Use o mesmo texto acima, substituindo “Sportradar MMA API v2” por
“SportsDataIO MMA API” e acrescentando estas perguntas:

```text
11. Are UFC event timestamps available with an explicit UTC offset and venue
    IANA timezone, or only in US Eastern Time?
12. How are removed fights and canceled or deleted events represented?
13. Can a production evaluation use a limited set of real current data, since
    the self-service trial contains scrambled data?
```

## Critério de aceite da resposta

Uma proposta pode avançar para o spike técnico somente quando responder por
escrito aos itens abaixo:

- uso no aplicativo e na API pública autorizado;
- cache no servidor e no aparelho autorizado com retenção definida;
- UFC, agenda e card incluídos explicitamente;
- território brasileiro incluído;
- custo, prazo mínimo, SLA e limites conhecidos;
- atribuição e obrigações pós-contrato conhecidas;
- ambiente de trial ou homologação disponível sem dados reais no repositório.

Respostas vagas devem ser esclarecidas antes de qualquer implementação. O menor
preço não compensa uma licença incompatível com cache offline ou exibição no
aplicativo.
