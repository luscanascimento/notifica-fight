# Segurança

## Controles implementados

### API

- variáveis de ambiente validadas no boot;
- DTOs explícitos e `ValidationPipe` global com whitelist e rejeição de campos extras;
- headers de segurança com Helmet;
- CORS deny-by-default, liberado somente para origins configuradas;
- limite de payload de 100 KiB;
- rate limit global simples de 100 requisições por minuto por cliente;
- erros 5xx sem stack trace, SQL ou detalhes de infraestrutura na resposta;
- logs JSON via Pino, request ID gerado pelo servidor e redaction de authorization, cookies e tokens;
- `/v1/admin` protegido por JWT OIDC assinado com RS256, JWKS confiável, validação de issuer, audience, expiração e subject;
- RBAC administrativo deny-by-default com role obrigatória no claim `roles` e distinção entre 401 e 403;
- mutações administrativas e seus registros de auditoria persistidos atomicamente, associados ao subject OIDC verificado;
- audit log sem tokens ou payloads, protegido contra `UPDATE`, `DELETE` e `TRUNCATE` por triggers no PostgreSQL;
- URLs OIDC obrigatoriamente HTTPS em produção; HTTP é aceito apenas para loopback em desenvolvimento e testes;
- PostgreSQL e Redis publicados somente em `127.0.0.1` no Compose;
- dependências fixadas por lockfile e auditoria pnpm sem vulnerabilidades conhecidas na entrega.

### Android

- nenhuma credencial ou API key privada no APK;
- endpoint configurável por build environment;
- release aceita somente URL base HTTPS e bloqueia cleartext no manifest;
- debug libera HTTP apenas para `10.0.2.2`, usado pelo emulador local;
- sem logging HTTP, evitando vazamento futuro de tokens ou payloads;
- Room usa armazenamento privado do app;
- backup e transferência dos dados do app estão desabilitados;
- payload remoto é tratado como não confiável e validado antes de substituir o cache.

## Limites atuais

Os endpoints de conteúdo são públicos e read-only. Não existe autenticação de usuário porque ela não é necessária no MVP. As mutações administrativas atuais cadastram, corrigem e removem organizações, eventos agendados e lutas dos cards; a remoção de organização é bloqueada enquanto houver eventos, e a remoção de evento elimina seu card em cascata. Todas permanecem sob `/v1/admin`, com a validação OIDC, o RBAC e o audit log append-only atuais. MFA deve ser exigido no identity provider. Ainda não existe endpoint de consulta do audit log; o acesso operacional deve ocorrer com uma role PostgreSQL read-only separada até haver uma necessidade de produto para expô-lo na API.

O contrato inicial espera uma role de administração em um claim `roles` no nível superior do access token. O identity provider deve emitir esse claim para a audience exclusiva da API; tokens destinados a outra audience são rejeitados. Chaves simétricas, algoritmos diferentes de RS256 e chaves fornecidas pelo próprio header do token não são aceitos.

TLS é responsabilidade do edge/reverse proxy em produção, mas autorização nunca dependerá do proxy. PostgreSQL e Redis não devem receber exposição pública. As credenciais em `docker-compose.yml` são exclusivamente locais e devem ser substituídas por secret management em qualquer ambiente implantado.

FCM, device registration, deep links e App Check ainda não estão implementados. Ao entrarem no escopo, tokens FCM serão dados operacionais sensíveis, nunca serão logados e terão atualização/invalidação explícitas.

## Checklist de implantação futura

- definir URL e certificado TLS reais;
- provisionar roles PostgreSQL separadas para runtime e migrations;
- configurar secrets fora da imagem e do repositório;
- restringir rede de PostgreSQL/Redis;
- configurar WAF/rate limiting no edge sem remover os controles da API;
- desabilitar Swagger público ou protegê-lo conforme o ambiente;
- executar lint, testes, build, auditoria de dependências e secret scan no CI.
