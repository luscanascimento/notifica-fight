# Notifica Fight

Aplicativo Android para consultar eventos e cards de esportes de combate. A entrega atual é uma vertical slice pequena e funcional de **próximos eventos**, com dados fictícios de desenvolvimento:

`PostgreSQL -> NestJS -> REST -> Android -> Room -> ViewModel -> Compose`

Não há login público, provider externo, scraping, placar ao vivo, apostas ou recursos sociais. A API possui acesso administrativo via OIDC, permite cadastrar organizações, eventos agendados e lutas dos cards e registra essas mutações em audit log append-only; as demais mutações administrativas ainda não fazem parte desta entrega.

## Stack atual

- API: Node.js, TypeScript strict, NestJS, Prisma e PostgreSQL.
- Infra local: PostgreSQL e Redis via Docker Compose. O Redis está pronto para etapas futuras, mas ainda não é consumido.
- Android: Kotlin, Jetpack Compose, Material 3, Hilt, Retrofit/OkHttp, Room, Coroutines, ViewModel e StateFlow.
- Contrato: REST versionada em `/v1`, documentada com OpenAPI/Swagger.

O código está no mesmo repositório de bootstrap por haver um único remoto fornecido, mas mantém limites de build independentes: `platform/` usa pnpm e `android/` usa Gradle. Não há compartilhamento de modelos entre TypeScript e Kotlin.

## Requisitos

- Node.js 22.18 ou superior;
- Corepack/pnpm 10;
- Docker com Docker Compose;
- JDK 17;
- Android SDK 37.0 e Android Studio compatível com AGP 9.4.

No WSL 2, habilite a integração da distribuição em **Docker Desktop > Settings > Resources > WSL Integration**.
Se a porta PostgreSQL padrão estiver ocupada no Windows, execute o Compose com
`POSTGRES_PORT=55432` e ajuste a porta de `DATABASE_URL` no `.env` para `55432`.

## Executar a API

Na raiz do repositório:

```bash
cp platform/apps/api/.env.example platform/apps/api/.env
corepack pnpm install
docker compose up -d
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

Verificações rápidas:

```bash
curl http://localhost:3000/v1/health
curl http://localhost:3000/v1/organizations
curl http://localhost:3000/v1/events/upcoming
curl http://localhost:3000/v1/events/01990000-0000-7000-8000-000000000101
curl http://localhost:3000/v1/events/01990000-0000-7000-8000-000000000101/card
```

Swagger fica disponível em `http://localhost:3000/docs` no ambiente de desenvolvimento. Os seeds usam o prefixo `[DEV]` e não representam eventos reais.

Para verificar uma integração administrativa, configure um cliente OIDC para a audiência da API e envie um access token com a role configurada no claim `roles`:

```bash
curl -H 'Authorization: Bearer <OIDC_ACCESS_TOKEN>' \
  http://localhost:3000/v1/admin/access

curl -X POST \
  -H 'Authorization: Bearer <OIDC_ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"code":"PFL","name":"Professional Fighters League"}' \
  http://localhost:3000/v1/admin/organizations

curl -X POST \
  -H 'Authorization: Bearer <OIDC_ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"organizationId":"01990000-0000-7000-8000-000000000001","name":"[DEV] Example Event","startTime":"2030-01-12T23:00:00.000Z","timezone":"America/New_York","city":"Example City","countryCode":"US"}' \
  http://localhost:3000/v1/admin/events

curl -X POST \
  -H 'Authorization: Bearer <OIDC_ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"cardPosition":3,"redCornerName":"[DEV] Taylor North","blueCornerName":"[DEV] Cameron Vale","weightClass":"Lightweight"}' \
  http://localhost:3000/v1/admin/events/01990000-0000-7000-8000-000000000101/fights
```

## Executar o Android

Abra a pasta `android/` no Android Studio e execute a variante `debug` em um emulador. Por padrão, ela acessa `http://10.0.2.2:3000/`, o endereço do host visto pelo emulador Android.

Para usar outro endpoint de desenvolvimento HTTPS, defina em `~/.gradle/gradle.properties`:

```properties
NOTIFICA_DEBUG_API_BASE_URL=https://dev-api.example.com/
```

Builds release exigem um endpoint HTTPS. Configure-o sem incluir segredos:

```bash
cd android
./gradlew assembleRelease -PNOTIFICA_API_BASE_URL=https://api.example.com/
```

O Room persiste cada sincronização bem-sucedida. Um toque no evento abre o detalhe e seu card de lutas; a ação **Organizações** abre o catálogo sincronizado. Se a API estiver indisponível em uma abertura posterior, as listas, o detalhe e o card continuam exibindo os dados salvos e informam que os dados são locais. Se não houver cache, a tela exibe o estado de erro com ação de tentar novamente.

## Testes e checks

Backend:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm --filter @notifica-fight/api test:e2e
corepack pnpm --filter @notifica-fight/api test:integration
corepack pnpm build
corepack pnpm audit --prod --audit-level high
```

Android:

```bash
cd android
./gradlew lintDebug testDebugUnitTest assembleDebug
./gradlew lintRelease assembleRelease \
  -PNOTIFICA_API_BASE_URL=https://api.example.com/
```

## Variáveis de ambiente da API

| Variável | Obrigatória | Finalidade |
| --- | --- | --- |
| `DATABASE_URL` | sim | Conexão PostgreSQL usada pela API e pelo Prisma. |
| `NODE_ENV` | não | `development`, `test` ou `production`. |
| `PORT` | não | Porta HTTP; padrão `3000`. |
| `CORS_ORIGINS` | não | Origins web permitidas, separadas por vírgula. Vazio nega CORS. |
| `LOG_LEVEL` | não | Nível dos logs estruturados. |
| `SWAGGER_ENABLED` | não | Habilita `/docs`; por padrão desabilitado em produção. |
| `OIDC_ISSUER_URL` | sim | Issuer exato esperado nos access tokens administrativos. |
| `OIDC_AUDIENCE` | sim | Audience da API esperada no token. |
| `OIDC_JWKS_URL` | sim | Endpoint HTTPS confiável que publica as chaves de assinatura. |
| `OIDC_ADMIN_ROLE` | sim | Role obrigatória no claim `roles` para acessar `/v1/admin`. |

Nunca use as credenciais locais do Compose em produção.

## Estrutura

```text
android/                  projeto Gradle Android independente
platform/apps/api/        API NestJS e schema/migrations Prisma
docs/                     decisões e orientações do projeto
docker-compose.yml        PostgreSQL e Redis locais
AGENTS.md                 regras duráveis para sessões de desenvolvimento
```

## Decisões principais

- Modular monolith no backend, sem abstrações de domínio especulativas.
- Prisma é usado diretamente pelos serviços simples; não existe generic repository.
- DTO público explícito evita expor modelos Prisma como contrato.
- Room é a fonte observada pela UI; Retrofit apenas atualiza o cache.
- Timestamps vêm da API em UTC e são exibidos no fuso local do aparelho.
- Cleartext fica bloqueado em release; somente o endereço do emulador é liberado na variante debug.
- Rotas administrativas validam assinatura RS256 via JWKS, issuer, audience, expiração e role no servidor.
- O cadastro administrativo de organizações normaliza o código para maiúsculas, rejeita campos desconhecidos e retorna conflito para códigos duplicados.
- O cadastro de eventos exige organização existente, instante com offset explícito e timezone IANA, persiste o instante em UTC e inicia o evento como `SCHEDULED`.
- O cadastro de lutas exige evento existente e posição positiva e única no card; resultado, método e rounds continuam fora do escopo.
- Criação e auditoria usam a mesma transação; o log guarda o subject OIDC, a ação e a entidade, e triggers do PostgreSQL bloqueiam alterações, exclusões e truncamento.

Mais detalhes em [arquitetura](docs/architecture.md), [segurança](docs/security.md) e [fontes de dados](docs/data-sources.md).
