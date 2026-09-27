# Arquitetura

## Escopo atual

A vertical slice atual entrega organizações, próximos eventos, detalhe e card de lutas. Dados fictícios entram por seed no PostgreSQL, são expostos pela API e sincronizados no Android. O acesso administrativo está protegido por OIDC e RBAC, permite cadastrar organizações, eventos agendados e lutas e audita essas mutações. Provider externo, ingestão, worker, painel administrativo, resultados e notificações não fazem parte desta entrega.

```text
PostgreSQL
    |
Prisma -> Services -> GET /v1/events/upcoming
                   -> GET /v1/events/:id
                   -> GET /v1/events/:id/card
                   -> GET /v1/organizations
                              |
                          Retrofit
                              |
                         Repositories
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
- `modules/admin`: fronteira protegida para as futuras operações administrativas;
- `modules/health`: liveness simples;
- `infrastructure/database`: ciclo de vida do Prisma;
- `common`: tratamento HTTP transversal;
- `config`: validação de ambiente.

Os módulos acessam Prisma diretamente porque as consultas atuais são simples. Uma port/repository só será criada quando regras de domínio, substituição de implementação ou testes justificarem a boundary.

O endpoint de próximos eventos retorna no máximo 50 registros `SCHEDULED` ou `POSTPONED`, em ordem cronológica. O detalhe por ID reutiliza o mesmo contrato público, valida o UUID e retorna 404 quando o evento não existe. O endpoint de card retorna as lutas por `cardPosition`, também valida o evento e representa apenas o anúncio da luta; resultado, método e rounds permanecem fora do escopo. Os contratos são mapeados para DTO e não expõem diretamente o modelo Prisma.

`GET /v1/admin/access` valida a integração administrativa. `POST /v1/admin/organizations` cadastra uma organização com contrato explícito, normaliza o código para maiúsculas e retorna 409 se ele já existir. `PATCH /v1/admin/organizations/:organizationId` corrige o código ou o nome, rejeita payload vazio e preserva a unicidade do código. `DELETE /v1/admin/organizations/:organizationId` remove somente organizações sem eventos vinculados; a constraint `Restrict` do banco impede perda acidental do histórico. `POST /v1/admin/events` cria um evento `SCHEDULED`, exige uma organização existente, valida o instante com offset e o timezone IANA e persiste o instante em UTC. `PATCH /v1/admin/events/:eventId` corrige os campos informados e permite alterar explicitamente o status, rejeitando payload vazio. `POST /v1/admin/events/:eventId/fights` adiciona uma luta ao card, exige posição positiva e retorna 409 se a posição já estiver ocupada no mesmo evento. `PATCH /v1/admin/events/:eventId/fights/:fightId` corrige somente os campos informados, confirma que a luta pertence ao evento e preserva a unicidade da posição. `DELETE /v1/admin/events/:eventId/fights/:fightId` remove somente uma luta pertencente ao evento informado. As rotas usam o mesmo guard, que exige bearer token assinado com RS256 por uma chave do JWKS configurado, além de `iss`, `aud`, `sub`, `exp` e a role administrativa no claim `roles`. Falhas criptográficas ou de claims retornam 401; identidade autenticada sem a role retorna 403. As URLs OIDC devem usar HTTPS em produção, e o material privado permanece exclusivamente no identity provider.

Cada mutação e seu registro em `AdminAuditLog` são persistidos na mesma transação. O log contém somente o subject OIDC verificado, ação, tipo e ID da entidade e timestamp; não armazena token nem payload administrativo. Triggers do PostgreSQL rejeitam `UPDATE`, `DELETE` e `TRUNCATE` no próprio audit log, tornando-o append-only por garantia do banco, não apenas por convenção da aplicação.

## Android

`android/` é um projeto Gradle independente do workspace TypeScript. Suas responsabilidades estão separadas sem fragmentação excessiva:

- `core/network`: contrato Retrofit e DTOs remotos;
- `core/database`: Room, entidade e DAO;
- `data`: validação, mapping, sincronização da lista e do detalhe e cache;
- `domain`: modelo consumido pela tela e boundary do repository;
- `feature/upcoming`: estado, ViewModel e Compose;
- `feature/details`: detalhe selecionado, refresh individual e fallback para o cache;
- `feature/organizations`: catálogo de organizações com sincronização offline;
- `ui/theme`: tokens e tema Material 3.

A UI nunca chama Retrofit. O repository valida o payload, substitui atomicamente o pequeno cache da listagem e o Room notifica o ViewModel. Falha de rede não apaga dados já sincronizados.

Ao selecionar um evento, o app abre o detalhe e atualiza o evento e seu card. As duas respostas são validadas antes de uma única transação Room; se qualquer chamada falhar, o detalhe e o card previamente armazenados continuam visíveis com indicação de dados locais.

A listagem de organizações possui cache próprio no Room. A migração da versão 1 para a versão 2 cria a nova tabela sem apagar os eventos previamente armazenados e aproveita os dados de organização já presentes nesse cache.

A migração Room da versão 2 para a versão 3 adiciona as lutas com chave estrangeira para eventos. O refresh da listagem usa upsert para preservar cards de eventos que continuam futuros, enquanto a sincronização de um detalhe substitui atomicamente somente o card daquele evento.

Estados da tela:

- `Loading`: primeira leitura/sincronização ainda em andamento;
- `Success`: cache possui eventos, com indicador adicional se o refresh falhou;
- `Empty`: refresh bem-sucedido sem eventos;
- `Error`: refresh falhou e não há cache.

## Próximos passos

Antes de integrar o primeiro provider, a fonte precisa ser escolhida e aprovada conforme a política de autorização, termos, qualidade, limites e custo. Até essa decisão, o admin pode receber apenas operações manuais necessárias para manter eventos e cards corretos. Worker/BullMQ e Redis entram somente quando existir job assíncrono real; resultados entram após existir fonte e regras confiáveis para esse dado, e FCM entra na etapa de registro de dispositivos e alertas.
