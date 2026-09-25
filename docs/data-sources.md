# Fontes de dados

## Estado atual

Não há integração externa nesta vertical slice. Os três eventos e os nomes dos participantes nos cards do seed são fixtures fictícias e possuem o prefixo `[DEV]`. UFC, ONE Championship e RWS são cadastradas apenas como organizações do MVP; nenhuma informação factual de agenda ou card foi inventada.

Essa escolha valida o fluxo ponta a ponta antes de assumir custo operacional, contrato ou risco jurídico de um provider.

## Política obrigatória

A ordem de preferência para futuras integrações é:

1. API oficial;
2. API licenciada/autorizada;
3. API de terceiro confiável;
4. webhook;
5. ICS;
6. RSS/feed estruturado;
7. entrada administrativa/manual;
8. scraping somente quando os termos permitirem explicitamente.

Nenhum site ou API será integrado sem revisão de autorização, termos, qualidade, limites, custo e estabilidade. O aplicativo Android nunca acessará diretamente providers que exijam credenciais privadas.

## Boundary futura do provider

Quando o primeiro provider real for escolhido, será adicionada uma interface pequena para buscar eventos e detalhes. O adapter será responsável por validar e transformar o formato externo em DTO interno de ingestão. O domínio não conhecerá JSON, HTML, RSS, ICS nem nomes específicos do fornecedor.

O fluxo será:

```text
External source -> Adapter -> Validation -> Normalization
                -> Matching -> Reconciliation -> Domain -> PostgreSQL
```

Persistência direta por scraper/provider é proibida. IDs externos nunca serão primary keys internas.

## Proveniência e reconciliação

Na etapa de ingestão serão introduzidos apenas os conceitos necessários de `Source`, `ExternalMapping` e `IngestionRun`. Eles registrarão origem, identificador externo, momento de recebimento/sincronização e se a alteração foi manual ou automática.

O matching inicial será determinístico: mapping explícito primeiro e revisão administrativa em ambiguidades. Nome parecido não prova identidade. Mudanças críticas não usarão “última escrita vence” sem regra de precedência ou revisão. Snapshots completos só serão guardados quando houver uma necessidade concreta de auditoria ou reprocessamento, com retenção definida.
