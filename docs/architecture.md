# Arquitetura

## Escopo atual

A primeira vertical slice entrega somente organizações e próximos eventos. Eventos fictícios entram por seed no PostgreSQL, são expostos pela API e sincronizados no Android. Provider externo, ingestão, worker, painel administrativo, lutas e notificações não fazem parte desta entrega.

```text
PostgreSQL
    |
Prisma -> EventsService -> GET /v1/events/upcoming
                         -> GET /v1/events/:id
                                  |
                              Retrofit
                                  |
                              Repository
                                  |
                                Room
                                  |
                          ViewModel/StateFlow
                                  |
                               Compose
```

## Backend

`platform/` é um workspace pnpm preparado para crescer como modular monolith. Atualmente contém apenas `apps/api`:

- `modules/events`: consulta e contrato público de eventos;
- `modules/organizations`: listagem mínima de organizações;
- `modules/health`: liveness simples;
- `infrastructure/database`: ciclo de vida do Prisma;
- `common`: tratamento HTTP transversal;
- `config`: validação de ambiente.

Os módulos acessam Prisma diretamente porque as consultas atuais são simples. Uma port/repository só será criada quando regras de domínio, substituição de implementação ou testes justificarem a boundary.

O endpoint de próximos eventos retorna no máximo 50 registros `SCHEDULED` ou `POSTPONED`, em ordem cronológica. O detalhe por ID reutiliza o mesmo contrato público, valida o UUID e retorna 404 quando o evento não existe. Os contratos são mapeados para DTO e não expõem diretamente o modelo Prisma.

## Android

`android/` é um projeto Gradle independente do workspace TypeScript. Suas responsabilidades estão separadas sem fragmentação excessiva:

- `core/network`: contrato Retrofit e DTOs remotos;
- `core/database`: Room, entidade e DAO;
- `data`: validação, mapping, sincronização da lista e do detalhe e cache;
- `domain`: modelo consumido pela tela e boundary do repository;
- `feature/upcoming`: estado, ViewModel e Compose;
- `feature/details`: detalhe selecionado, refresh individual e fallback para o cache;
- `ui/theme`: tokens e tema Material 3.

A UI nunca chama Retrofit. O repository valida o payload, substitui atomicamente o pequeno cache da listagem e o Room notifica o ViewModel. Falha de rede não apaga dados já sincronizados.

Ao selecionar um card, o app abre o detalhe e atualiza somente aquele evento pelo endpoint por ID. A resposta é validada e salva com upsert; se a rede falhar, o detalhe previamente armazenado continua visível com indicação de dados locais.

Estados da tela:

- `Loading`: primeira leitura/sincronização ainda em andamento;
- `Success`: cache possui eventos, com indicador adicional se o refresh falhou;
- `Empty`: refresh bem-sucedido sem eventos;
- `Error`: refresh falhou e não há cache.

## Próximos passos

A ordem preservada é: Organizations, Fights/Card, admin básico e somente então primeiro provider e pipeline de ingestão. Worker/BullMQ e Redis entram quando existir job assíncrono real; FCM entra na etapa de registro de dispositivos e alertas.
